import crypto from "crypto";
import sharp from "sharp";
import { localStorageDriver } from "./local.storage.js";
import { prisma } from "../../config/DB.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class StorageService {
  constructor(driver = localStorageDriver) {
    this.driver = driver;
  }

  /**
   * Process and convert image to WebP with size constraints
   */
  async optimizeImage(fileBuffer, { maxWidth = 1920, maxHeight = 1080, quality = 85 } = {}) {
    try {
      const image = sharp(fileBuffer).rotate(); // auto-orient from EXIF
      const metadata = await image.metadata();

      let pipeline = image;

      if (
        (metadata.width && metadata.width > maxWidth) ||
        (metadata.height && metadata.height > maxHeight)
      ) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const webpBuffer = await pipeline
        .webp({ quality })
        .toBuffer();

      const optimizedMeta = await sharp(webpBuffer).metadata();

      return {
        buffer: webpBuffer,
        width: optimizedMeta.width || null,
        height: optimizedMeta.height || null,
        size: webpBuffer.length,
        mimeType: "image/webp",
      };
    } catch (error) {
      console.warn("Sharp image optimization failed, using original buffer:", error.message);
      return {
        buffer: fileBuffer,
        width: null,
        height: null,
        size: fileBuffer.length,
        mimeType: "image/jpeg",
      };
    }
  }

  /**
   * 1. USER AVATAR
   * Path: storage/users/{userId}/avatar/{uuid}.webp
   */
  async uploadUserAvatar(userId, fileBuffer, _originalMimeType = "image/jpeg") {
    if (!userId) throw new ApiError(StatusCodes.BAD_REQUEST, "User ID is required");
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "No image file provided");
    }

    // 1. Resize & convert to 512x512 WebP (Quality 85%)
    const { buffer } = await this.optimizeImage(fileBuffer, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 85,
    });

    const fileUuid = crypto.randomUUID().replace(/-/g, "");
    const storageKey = `users/${userId}/avatar/${fileUuid}.webp`;

    // 2. Fetch current user to find old avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true, avatar: true },
    });

    // 3. Upload new avatar
    const avatarUrl = await this.driver.upload(buffer, storageKey, "image/webp");

    // 4. Update Database
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarKey: storageKey,
        avatarUrl,
        avatar: avatarUrl, // for backwards compatibility
      },
    });

    // 5. Safely clean up old avatar file
    if (currentUser?.avatarKey && currentUser.avatarKey !== storageKey) {
      await this.driver.delete(currentUser.avatarKey);
    }

    return {
      storageKey,
      avatarKey: storageKey,
      avatarUrl,
      url: avatarUrl,
    };
  }

  /**
   * 2. QUIZ COVER
   * Path: storage/quizzes/{quizId}/cover/{uuid}.webp
   */
  async uploadQuizCover(quizId, fileBuffer) {
    if (!quizId) throw new ApiError(StatusCodes.BAD_REQUEST, "Quiz ID is required");

    // 1. Optimize 1280x720 WebP
    const { buffer } = await this.optimizeImage(fileBuffer, {
      maxWidth: 1280,
      maxHeight: 720,
      quality: 85,
    });

    const fileUuid = crypto.randomUUID().replace(/-/g, "");
    const storageKey = `quizzes/${quizId}/cover/${fileUuid}.webp`;

    const currentQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { coverKey: true },
    });

    const coverUrl = await this.driver.upload(buffer, storageKey, "image/webp");

    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        coverKey: storageKey,
        coverUrl,
      },
    });

    if (currentQuiz?.coverKey && currentQuiz.coverKey !== storageKey) {
      await this.driver.delete(currentQuiz.coverKey);
    }

    return {
      storageKey,
      coverKey: storageKey,
      coverUrl,
      url: coverUrl,
    };
  }

  /**
   * 3. QUESTION IMAGE / MEDIA
   * Path: storage/quizzes/{quizId}/questions/{questionId}/images/{uuid}.webp
   */
  async uploadQuestionImage(quizId, questionId, fileBuffer, originalName = "image.png") {
    if (!questionId) throw new ApiError(StatusCodes.BAD_REQUEST, "Question ID is required");

    // If quizId not provided, fetch from Question record
    let targetQuizId = quizId;
    if (!targetQuizId) {
      const q = await prisma.question.findUnique({
        where: { id: questionId },
        select: { quizId: true },
      });
      if (!q) throw new ApiError(StatusCodes.NOT_FOUND, "Question not found");
      targetQuizId = q.quizId;
    }

    // 1. Optimize Question Image
    const { buffer, width, height, size } = await this.optimizeImage(fileBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    const fileUuid = crypto.randomUUID().replace(/-/g, "");
    const storageKey = `quizzes/${targetQuizId}/questions/${questionId}/images/${fileUuid}.webp`;

    const publicUrl = await this.driver.upload(buffer, storageKey, "image/webp");

    // 2. Count existing media for ordering
    const count = await prisma.questionMedia.count({ where: { questionId } });

    // 3. Save QuestionMedia record
    const media = await prisma.questionMedia.create({
      data: {
        questionId,
        type: "IMAGE",
        originalName,
        storageKey,
        mimeType: "image/webp",
        size,
        width,
        height,
        order: count,
      },
    });

    return {
      id: media.id,
      storageKey,
      url: publicUrl,
      width,
      height,
      size,
    };
  }

  /**
   * Upload an image belonging to a specific answer/option.
   */
  async uploadAnswerImage(quizId, answerId, fileBuffer, originalName = "image.png") {
    if (!answerId) throw new ApiError(StatusCodes.BAD_REQUEST, "Answer ID is required");

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { question: { select: { id: true, quizId: true } } },
    });
    if (!answer) throw new ApiError(StatusCodes.NOT_FOUND, "Answer not found");

    const targetQuizId = quizId || answer.question.quizId;
    const { buffer, width, height, size } = await this.optimizeImage(fileBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    const fileUuid = crypto.randomUUID().replace(/-/g, "");
    const storageKey = `quizzes/${targetQuizId}/questions/${answer.question.id}/answers/${answerId}/images/${fileUuid}.webp`;
    const publicUrl = await this.driver.upload(buffer, storageKey, "image/webp");
    const count = await prisma.answerMedia.count({ where: { answerId } });

    const media = await prisma.answerMedia.create({
      data: {
        answerId,
        type: "IMAGE",
        originalName,
        storageKey,
        mimeType: "image/webp",
        size,
        width,
        height,
        order: count,
      },
    });

    return {
      id: media.id,
      storageKey,
      url: publicUrl,
      width,
      height,
      size,
    };
  }

  /**
   * Delete Question Media
   */
  async deleteQuestionMedia(mediaId) {
    const media = await prisma.questionMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new ApiError(StatusCodes.NOT_FOUND, "Media not found");

    await this.driver.delete(media.storageKey);
    await prisma.questionMedia.delete({ where: { id: mediaId } });

    return { success: true };
  }

  /**
   * 4. DOCUMENT IMPORT SOURCE (PDF / DOCX)
   * Path: storage/imports/{importId}/source/{fileName}
   */
  async uploadImportSource(userId, fileBuffer, originalName, mimeType = "application/pdf") {
    const importId = crypto.randomUUID();
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `imports/${importId}/source/${safeName}`;

    await this.driver.upload(fileBuffer, storageKey, mimeType);

    const importRecord = await prisma.quizImport.create({
      data: {
        id: importId,
        userId,
        originalName,
        sourceFileKey: storageKey,
        mimeType,
        fileSize: fileBuffer.length,
        status: "PENDING",
      },
    });

    return {
      importId: importRecord.id,
      storageKey,
      originalName,
      fileSize: fileBuffer.length,
    };
  }

  /**
   * 5. EXTRACTED IMPORT IMAGE
   * Path: storage/imports/{importId}/extracted/images/{uuid}.webp
   */
  async uploadExtractedImportImage(importId, fileBuffer) {
    const { buffer, width, height, size } = await this.optimizeImage(fileBuffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    const fileUuid = crypto.randomUUID().replace(/-/g, "");
    const storageKey = `imports/${importId}/extracted/images/${fileUuid}.webp`;

    const publicUrl = await this.driver.upload(buffer, storageKey, "image/webp");

    return {
      storageKey,
      url: publicUrl,
      width,
      height,
      size,
    };
  }

  /**
   * Generic driver pass-throughs
   */
  getUrl(key) {
    return this.driver.getUrl(key);
  }

  async delete(key) {
    return this.driver.delete(key);
  }

  async deleteDirectory(prefix) {
    if (this.driver.deleteDirectory) {
      return this.driver.deleteDirectory(prefix);
    }
  }
}

export const storageService = new StorageService(localStorageDriver);
