import { prisma } from "../config/DB.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import { storageService } from "./storage/storage.service.js";

export const quizService = {
  /**
   * Lấy danh sách bài thi đã xuất bản (PUBLISHED) có phân trang, tìm kiếm và lọc danh mục (cho trang công khai /quiz)
   */
  async getAllQuizzes({ page = 1, limit = 10, search, categoryId, majorId, currentUser }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const userRole = (currentUser?.role || "").toUpperCase();
    const isElevated = ["ADMIN", "TEACHER"].includes(userRole);
    const targetMajorId = majorId || currentUser?.majorId || null;

    const where = {
      status: "PUBLISHED",
      ...(categoryId && { categoryId }),
      ...(search && {
        title: {
          contains: search.trim(),
          mode: "insensitive",
        },
      }),
    };

    // Áp dụng bộ lọc phân quyền theo ngành
    if (isElevated) {
      if (majorId) {
        where.OR = [
          { majorScope: "ALL_MAJORS" },
          { quizMajors: { some: { majorId } } },
        ];
      }
    } else if (targetMajorId) {
      where.OR = [
        { majorScope: "ALL_MAJORS" },
        { quizMajors: { some: { majorId: targetMajorId } } },
        ...(currentUser?.id ? [{ authorId: currentUser.id }] : []),
      ];
    } else {
      where.majorScope = "ALL_MAJORS";
    }

    const [items, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          description: true,
          coverUrl: true,
          coverKey: true,
          status: true,
          majorScope: true,
          quizMajors: {
            select: {
              major: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          timeLimit: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  },

  /**
   * Lấy danh sách bài thi của chính User hiện tại (My Quizzes)
   */
  async getMyQuizzes(userId, { page = 1, limit = 10, search, status }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      authorId: userId,
      ...(status && { status }),
      ...(search && {
        title: {
          contains: search.trim(),
          mode: "insensitive",
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  },

  /**
   * Lấy chi tiết bài thi theo ID
   * - Nếu là PUBLISHED: ai cũng có thể xem (nếu không phải tác giả, ẩn isCorrect).
   * - Nếu là DRAFT: chỉ chính tác giả mới được xem/sửa (người khác -> 403 Forbidden).
   */
  async getQuizById(id, currentUserId = null, userRole = null, userMajorId = null) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        quizMajors: {
          include: {
            major: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        sections: {
          orderBy: {
            order: "asc",
          },
          include: {
            questions: {
              orderBy: {
                order: "asc",
              },
              include: {
                answers: {
                  orderBy: {
                    order: "asc",
                  },
                  include: { media: { orderBy: { order: "asc" } } },
                },
                media: { orderBy: { order: "asc" } },
              },
            },
          },
        },
        questions: {
          orderBy: {
            order: "asc",
          },
          include: {
            answers: {
              orderBy: {
                order: "asc",
              },
              include: { media: { orderBy: { order: "asc" } } },
            },
            media: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy bài thi");
    }

    const isAuthor = currentUserId && quiz.authorId === currentUserId;

    // Nếu bài thi chưa Publish mà không phải tác giả
    if (quiz.status === "DRAFT" && !isAuthor) {
      if (!currentUserId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Vui lòng đăng nhập để xem bài thi");
      }
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xem bản nháp này");
    }

    // Nếu đề thi giới hạn ngành cụ thể (SPECIFIC_MAJORS), kiểm tra sinh viên có thuộc ngành được phép không
    if (quiz.status === "PUBLISHED" && quiz.majorScope === "SPECIFIC_MAJORS" && !isAuthor) {
      const normalizedRole = (userRole || "").toUpperCase();
      const isAdminOrTeacher = ["ADMIN", "TEACHER"].includes(normalizedRole);

      if (!isAdminOrTeacher) {
        const allowedMajorIds = (quiz.quizMajors || []).map((qm) => qm.majorId);
        if (!userMajorId || !allowedMajorIds.includes(userMajorId)) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "Đề thi này chỉ dành riêng cho sinh viên thuộc ngành được phân công!",
            [],
            "FORBIDDEN_MAJOR"
          );
        }
      }
    }

    // Nếu không phải tác giả và đang xem bài PUBLISHED, ẩn cờ isCorrect để bảo mật đề thi
    if (!isAuthor) {
      const sanitizedQuestions = quiz.questions.map((q) => ({
        ...q,
        answers: q.answers.map(({ isCorrect, ...rest }) => rest),
      }));
      const sanitizedSections = quiz.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) => ({
          ...q,
          answers: q.answers.map(({ isCorrect, ...rest }) => rest),
        })),
      }));
      return {
        ...quiz,
        questions: sanitizedQuestions,
        sections: sanitizedSections,
      };
    }

    return quiz;
  },

  /**
   * Tạo bài thi mới (Mặc định status: DRAFT)
   * Có hỗ trợ tạo kèm danh sách Phần (Sections) & câu hỏi trong Prisma transaction
   */
  async createQuiz(authorId, data) {
    const { title, description, coverUrl, coverKey, categoryId, timeLimit, questions, sections } = data;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Tiêu đề bài thi là bắt buộc và phải có ít nhất 3 ký tự"
      );
    }

    const cleanTitle = title.trim();
    const cleanTimeLimit = timeLimit ? Math.max(1, parseInt(timeLimit, 10)) : null;

    // Kiểm tra categoryId nếu có truyền
    if (categoryId) {
      const catExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!catExists) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Danh mục không tồn tại");
      }
    }

    return await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          title: cleanTitle,
          description: description?.trim() || null,
          coverUrl: coverUrl || null,
          coverKey: coverKey || null,
          authorId,
          categoryId: categoryId || null,
          status: "DRAFT",
          majorScope: data.majorScope === "SPECIFIC_MAJORS" ? "SPECIFIC_MAJORS" : "ALL_MAJORS",
          ...(data.majorScope === "SPECIFIC_MAJORS" && Array.isArray(data.majorIds) && data.majorIds.length > 0
            ? {
                quizMajors: {
                  create: data.majorIds.map((mId) => ({ majorId: mId })),
                },
              }
            : {}),
          timeLimit: cleanTimeLimit,
        },
      });

      // 1. Nếu có truyền danh sách Sections có cấu trúc
      if (Array.isArray(sections) && sections.length > 0) {
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          const createdSection = await tx.quizSection.create({
            data: {
              quizId: quiz.id,
              title: sec.title?.trim() || `Phần ${sIdx + 1}`,
              description: sec.description?.trim() || null,
              order: sec.order !== undefined ? sec.order : sIdx + 1,
            },
          });

          if (Array.isArray(sec.questions) && sec.questions.length > 0) {
            for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
              const q = sec.questions[qIdx];
              const createdQuestion = await tx.question.create({
                data: {
                  quizId: quiz.id,
                  sectionId: createdSection.id,
                  content: q.content?.trim() || `Câu hỏi ${qIdx + 1}`,
                  type: q.type || "MULTIPLE_CHOICE",
                  points: typeof q.points === "number" ? q.points : 1,
                  order: qIdx + 1, // Reset numbering 1, 2, 3... trong từng Section
                },
              });

              if (Array.isArray(q.answers) && q.answers.length > 0) {
                for (let aIdx = 0; aIdx < q.answers.length; aIdx++) {
                  const a = q.answers[aIdx];
                  await tx.answer.create({
                    data: {
                      questionId: createdQuestion.id,
                      content: a.content?.trim() || `Đáp án ${aIdx + 1}`,
                      isCorrect: Boolean(a.isCorrect),
                      order: aIdx + 1,
                    },
                  });
                }
              }
            }
          }
        }
      } else if (Array.isArray(questions) && questions.length > 0) {
        // 2. Nếu truyền danh sách câu hỏi phẳng truyền thống
        for (let qIndex = 0; qIndex < questions.length; qIndex++) {
          const q = questions[qIndex];
          const createdQuestion = await tx.question.create({
            data: {
              quizId: quiz.id,
              content: q.content?.trim() || `Câu hỏi ${qIndex + 1}`,
              type: q.type || "MULTIPLE_CHOICE",
              points: typeof q.points === "number" ? q.points : 1,
              order: qIndex + 1,
            },
          });

          if (Array.isArray(q.answers) && q.answers.length > 0) {
            for (let aIndex = 0; aIndex < q.answers.length; aIndex++) {
              const a = q.answers[aIndex];
              await tx.answer.create({
                data: {
                  questionId: createdQuestion.id,
                  content: a.content?.trim() || `Đáp án ${aIndex + 1}`,
                  isCorrect: Boolean(a.isCorrect),
                  order: aIndex + 1,
                },
              });
            }
          }
        }
      }

      return await tx.quiz.findUnique({
        where: { id: quiz.id },
        include: {
          category: true,
          sections: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: {
                  answers: {
                    orderBy: { order: "asc" },
                    include: { media: { orderBy: { order: "asc" } } },
                  },
                  media: { orderBy: { order: "asc" } },
                },
              },
            },
          },
          questions: {
            orderBy: { order: "asc" },
            include: {
              answers: {
                orderBy: { order: "asc" },
                include: { media: { orderBy: { order: "asc" } } },
              },
              media: { orderBy: { order: "asc" } },
            },
          },
        },
      });
    });
  },

  /**
   * Cập nhật bài thi (Bắt buộc kiểm tra ownership: quiz.authorId === authorId)
   */
  async updateQuiz(id, authorId, data) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy bài thi");
    }

    if (quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền chỉnh sửa bài thi này");
    }

    const { title, description, coverUrl, coverKey, categoryId, timeLimit, questions, sections } = data;

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 3) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Tiêu đề bài thi phải có ít nhất 3 ký tự"
        );
      }
    }

    if (categoryId) {
      const catExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!catExists) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Danh mục không tồn tại");
      }
    }

    const cleanTimeLimit =
      timeLimit !== undefined
        ? timeLimit
          ? Math.max(1, parseInt(timeLimit, 10))
          : null
        : quiz.timeLimit;

    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản
      await tx.quiz.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
          ...(coverKey !== undefined && { coverKey: coverKey || null }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(timeLimit !== undefined && { timeLimit: cleanTimeLimit }),
          ...(data.majorScope !== undefined && {
            majorScope: data.majorScope === "SPECIFIC_MAJORS" ? "SPECIFIC_MAJORS" : "ALL_MAJORS",
          }),
        },
      });

      if (data.majorIds !== undefined && Array.isArray(data.majorIds)) {
        await tx.quizMajor.deleteMany({ where: { quizId: id } });
        const targetScope = data.majorScope || quiz.majorScope;
        if (targetScope === "SPECIFIC_MAJORS" && data.majorIds.length > 0) {
          for (const mId of data.majorIds) {
            await tx.quizMajor.create({
              data: { quizId: id, majorId: mId },
            });
          }
        }
      }

      // 2. Nếu có truyền danh sách sections, đồng bộ lại sections và questions
      if (Array.isArray(sections)) {
        await tx.question.deleteMany({ where: { quizId: id } });
        await tx.quizSection.deleteMany({ where: { quizId: id } });

        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          const createdSection = await tx.quizSection.create({
            data: {
              quizId: id,
              title: sec.title?.trim() || `Phần ${sIdx + 1}`,
              description: sec.description?.trim() || null,
              order: sec.order !== undefined ? sec.order : sIdx + 1,
            },
          });

          if (Array.isArray(sec.questions)) {
            for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
              const q = sec.questions[qIdx];
              const createdQ = await tx.question.create({
                data: {
                  quizId: id,
                  sectionId: createdSection.id,
                  content: q.content?.trim() || `Câu hỏi ${qIdx + 1}`,
                  type: q.type || "MULTIPLE_CHOICE",
                  points: typeof q.points === "number" ? q.points : 1,
                  order: qIdx + 1,
                },
              });

              if (Array.isArray(q.answers)) {
                for (let aIdx = 0; aIdx < q.answers.length; aIdx++) {
                  const a = q.answers[aIdx];
                  await tx.answer.create({
                    data: {
                      questionId: createdQ.id,
                      content: a.content?.trim() || `Đáp án ${aIdx + 1}`,
                      isCorrect: Boolean(a.isCorrect),
                      order: aIdx + 1,
                    },
                  });
                }
              }
            }
          }
        }
      } else if (Array.isArray(questions)) {
        // Đồng bộ câu hỏi phẳng truyền thống
        await tx.question.deleteMany({ where: { quizId: id } });

        for (let qIndex = 0; qIndex < questions.length; qIndex++) {
          const q = questions[qIndex];
          const createdQ = await tx.question.create({
            data: {
              quizId: id,
              content: q.content?.trim() || `Câu hỏi ${qIndex + 1}`,
              type: q.type || "MULTIPLE_CHOICE",
              points: typeof q.points === "number" ? q.points : 1,
              order: qIndex + 1,
            },
          });

          if (Array.isArray(q.answers)) {
            for (let aIndex = 0; aIndex < q.answers.length; aIndex++) {
              const a = q.answers[aIndex];
              await tx.answer.create({
                data: {
                  questionId: createdQ.id,
                  content: a.content?.trim() || `Đáp án ${aIndex + 1}`,
                  isCorrect: Boolean(a.isCorrect),
                  order: aIndex + 1,
                },
              });
            }
          }
        }
      }

      return await tx.quiz.findUnique({
        where: { id },
        include: {
          category: true,
          sections: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: {
                  answers: {
                    orderBy: { order: "asc" },
                    include: { media: { orderBy: { order: "asc" } } },
                  },
                  media: { orderBy: { order: "asc" } },
                },
              },
            },
          },
          questions: {
            orderBy: { order: "asc" },
            include: {
              answers: {
                orderBy: { order: "asc" },
                include: { media: { orderBy: { order: "asc" } } },
              },
              media: { orderBy: { order: "asc" } },
            },
          },
        },
      });
    });
  },


  /**
   * Xóa bài thi (Bắt buộc kiểm tra ownership hoặc quyền Admin, xóa sạch toàn bộ quan hệ trong transaction và dọn dẹp ảnh vật lý)
   */
  async deleteQuiz(id, authorId, userRole = "USER") {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        coverKey: true,
      },
    });

    if (!quiz) {
      // Idempotent: Nếu bài thi không còn tồn tại, coi như đã xóa thành công để tránh race condition do double-click
      return { success: true, message: "Bài thi đã được gỡ bỏ khỏi hệ thống" };
    }

    if (quiz.authorId !== authorId && userRole !== "ADMIN") {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xóa bài thi này");
    }

    // Danh sách key ảnh cần dọn dẹp vật lý trên ổ đĩa
    const mediaKeysToDelete = [];
    if (quiz.coverKey) {
      mediaKeysToDelete.push(quiz.coverKey);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Lấy tất cả lượt thi của đề
      const attempts = await tx.quizAttempt.findMany({
        where: { quizId: id },
        select: { id: true },
      });
      const attemptIds = attempts.map((a) => a.id);

      // 2. Lấy tất cả câu hỏi của đề
      const questions = await tx.question.findMany({
        where: { quizId: id },
        select: { id: true },
      });
      const questionIds = questions.map((q) => q.id);

      // 3. Xóa toàn bộ câu trả lời UserAnswer (của lượt thi hoặc trỏ tới câu hỏi)
      if (attemptIds.length > 0 || questionIds.length > 0) {
        await tx.userAnswer.deleteMany({
          where: {
            OR: [
              attemptIds.length > 0 ? { attemptId: { in: attemptIds } } : undefined,
              questionIds.length > 0 ? { questionId: { in: questionIds } } : undefined,
            ].filter(Boolean),
          },
        });
      }

      // 4. Xóa các lượt thi QuizAttempt
      if (attemptIds.length > 0) {
        await tx.quizAttempt.deleteMany({
          where: { id: { in: attemptIds } },
        });
      }

      // 5. Thu thập toàn bộ storageKey ảnh của QuestionMedia và AnswerMedia để xóa sạch file
      if (questionIds.length > 0) {
        // Thu thập ảnh câu hỏi
        const qMedias = await tx.questionMedia.findMany({
          where: { questionId: { in: questionIds } },
          select: { storageKey: true },
        });
        qMedias.forEach((m) => {
          if (m.storageKey) mediaKeysToDelete.push(m.storageKey);
        });

        const answers = await tx.answer.findMany({
          where: { questionId: { in: questionIds } },
          select: { id: true },
        });
        const answerIds = answers.map((a) => a.id);

        if (answerIds.length > 0) {
          // Thu thập ảnh đáp án
          const aMedias = await tx.answerMedia.findMany({
            where: { answerId: { in: answerIds } },
            select: { storageKey: true },
          });
          aMedias.forEach((m) => {
            if (m.storageKey) mediaKeysToDelete.push(m.storageKey);
          });

          await tx.answerMedia.deleteMany({
            where: { answerId: { in: answerIds } },
          });
          await tx.answer.deleteMany({
            where: { id: { in: answerIds } },
          });
        }

        await tx.questionMedia.deleteMany({
          where: { questionId: { in: questionIds } },
        });

        await tx.question.deleteMany({
          where: { id: { in: questionIds } },
        });
      }

      // 6. Xóa các phân loại và cấu trúc kèm theo (Tags, Sections, Majors)
      await tx.quizTag.deleteMany({
        where: { quizId: id },
      });

      await tx.quizSection.deleteMany({
        where: { quizId: id },
      });

      await tx.quizMajor.deleteMany({
        where: { quizId: id },
      });

      // 7. Xóa đề thi chính
      await tx.quiz.delete({
        where: { id },
      });
    });

    // 8. Dọn dẹp sạch sẽ toàn bộ tệp tin ảnh vật lý trên ổ cứng (cover, câu hỏi, đáp án, và thư mục storage/quizzes/{id})
    try {
      for (const key of mediaKeysToDelete) {
        await storageService.delete(key);
      }
      await storageService.deleteDirectory(`quizzes/${id}`);
    } catch (cleanupErr) {
      console.warn(`Lỗi dọn dẹp file ảnh của quiz ${id}:`, cleanupErr.message);
    }

    return { success: true, message: "Đã xóa toàn bộ bài thi và các hình ảnh đính kèm thành công" };
  },

  /**
   * Xuất bản bài thi (Chuyển sang PUBLISHED)
   * Bắt buộc validate chặt chẽ:
   * - Title >= 3 ký tự
   * - Category hợp lệ
   * - Ít nhất 1 câu hỏi
   * - Mỗi câu hỏi phải có đáp án
   * - MULTIPLE_CHOICE: >= 2 đáp án, đúng 1 đáp án đúng
   * - TRUE_FALSE: đúng 2 đáp án, đúng 1 đáp án đúng
   */
  async publishQuiz(id, authorId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: true,
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy bài thi");
    }

    if (quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xuất bản bài thi này");
    }

    // 1. Validate Title
    if (!quiz.title || quiz.title.trim().length < 3) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Tiêu đề bài thi không hợp lệ để xuất bản (tối thiểu 3 ký tự)"
      );
    }

    // 2. Validate Category
    if (!quiz.categoryId || !quiz.category) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Bài thi phải thuộc về một danh mục hợp lệ trước khi xuất bản"
      );
    }

    // 3. Validate Questions Count
    if (!quiz.questions || quiz.questions.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Bài thi phải có ít nhất 1 câu hỏi trước khi xuất bản"
      );
    }

    // 4. Validate từng câu hỏi và đáp án
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const qNum = i + 1;

      if (!q.content || !q.content.trim()) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Câu hỏi số ${qNum} chưa có nội dung`
        );
      }

      if (!q.answers || q.answers.length === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Câu hỏi số ${qNum} chưa có danh sách đáp án`
        );
      }

      const correctCount = q.answers.filter((a) => a.isCorrect).length;

      if (q.type === "MULTIPLE_CHOICE") {
        if (q.answers.length < 2) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Câu hỏi số ${qNum} (Trắc nghiệm) phải có ít nhất 2 đáp án lựa chọn`
          );
        }
        if (correctCount !== 1) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Câu hỏi số ${qNum} (Trắc nghiệm) phải có đúng 1 đáp án đúng (hiện có ${correctCount})`
          );
        }
      } else if (q.type === "TRUE_FALSE") {
        if (q.answers.length !== 2) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Câu hỏi số ${qNum} (Đúng/Sai) phải có đúng 2 đáp án (True/False)`
          );
        }
        if (correctCount !== 1) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Câu hỏi số ${qNum} (Đúng/Sai) phải chọn đúng 1 đáp án chính xác`
          );
        }
      }
    }

    // Cập nhật trạng thái PUBLISHED
    return await prisma.quiz.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
      include: {
        category: true,
        _count: {
          select: { questions: true },
        },
      },
    });
  },
};
