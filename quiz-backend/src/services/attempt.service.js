import { prisma } from "../config/DB.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

// Helper: Shuffle array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const attemptService = {
  /**
   * Start a new exam session / quiz attempt
   */
  async startSession(userId, { quizId, mode = "MOCK_EXAM", config = {}, source = null }) {
    const validModes = ["PRACTICE", "MOCK_EXAM", "TEST", "ASSIGNMENT", "FLASHCARD"];
    const sessionMode = validModes.includes(mode) ? mode : "MOCK_EXAM";
    const isWrongSource = source === "WRONG_ANSWERS" || config?.source === "WRONG_ANSWERS";

    let targetQuizId = quizId;

    // If source is WRONG_ANSWERS and no quizId is provided, find the most recent quiz with wrong answers
    if (!targetQuizId && isWrongSource) {
      const latestWrong = await prisma.userAnswer.findFirst({
        where: {
          attempt: { userId },
          isCorrect: false,
        },
        orderBy: { createdAt: "desc" },
        include: { attempt: { select: { quizId: true } } },
      });

      if (!latestWrong?.attempt?.quizId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Bạn không có câu hỏi làm sai nào để ôn tập.");
      }
      targetQuizId = latestWrong.attempt.quizId;
    }

    if (!targetQuizId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn đề thi để bắt đầu.");
    }

    // 1. Fetch Quiz & Questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: targetQuizId },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true, avatar: true } },
        sections: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, description: true },
        },
        questions: {
          orderBy: { order: "asc" },
          include: {
            section: { select: { id: true, title: true, order: true } },
            answers: {
              orderBy: { order: "asc" },
              include: { media: { orderBy: { order: "asc" } } },
            },
            media: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!quiz) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy bài thi");
    if (quiz.status !== "PUBLISHED" && quiz.authorId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bài thi này chưa được xuất bản");
    }
    if (!quiz.questions || quiz.questions.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Bài thi không có câu hỏi nào");
    }

    const now = new Date();

    // 2. Mode-specific constraints check
    if (sessionMode === "TEST") {
      if (quiz.startAt && now < new Date(quiz.startAt)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          `Bài kiểm tra chưa đến thời gian mở (Mở lúc: ${new Date(quiz.startAt).toLocaleString("vi-VN")})`
        );
      }
      if (quiz.dueAt && now > new Date(quiz.dueAt)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          `Bài kiểm tra đã kết thúc (Đóng lúc: ${new Date(quiz.dueAt).toLocaleString("vi-VN")})`
        );
      }
    }

    if (sessionMode === "ASSIGNMENT") {
      if (quiz.dueAt && now > new Date(quiz.dueAt)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          `Bài tập đã quá hạn nộp (Hạn chót: ${new Date(quiz.dueAt).toLocaleString("vi-VN")})`
        );
      }
      if (quiz.maxAttempts) {
        const pastAttemptsCount = await prisma.quizAttempt.count({
          where: { userId, quizId: targetQuizId, mode: "ASSIGNMENT", status: "COMPLETED" },
        });
        if (pastAttemptsCount >= quiz.maxAttempts) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            `Bạn đã hết số lần làm bài tập này (Tối đa ${quiz.maxAttempts} lần)`
          );
        }
      }
    }

    // 3. Question filtering based on source or config
    let questionPool = [...quiz.questions];

    // Wrong answers practice mode: STRICTLY include only questions answered incorrectly
    if (isWrongSource) {
      const wrongAnswers = await prisma.userAnswer.findMany({
        where: {
          attempt: { userId, quizId: targetQuizId },
          isCorrect: false,
        },
        select: { questionId: true },
      });
      const wrongQuestionIds = new Set(wrongAnswers.map((w) => w.questionId));

      const filtered = quiz.questions.filter((q) => wrongQuestionIds.has(q.id));
      if (filtered.length === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Bạn không có câu hỏi làm sai nào trong đề thi này để ôn tập."
        );
      }
      questionPool = filtered;
    }

    // Sắp xếp câu hỏi và shuffle (nếu có)
    const shouldShuffle = Boolean(config?.shuffleQuestions || sessionMode === "MOCK_EXAM");
    const rawSections = quiz.sections || [];

    if (rawSections.length > 0) {
      // Đề thi có phân chia phần (sections):
      // Sắp xếp tuần tự: Phần 1 -> Phần 2 -> Phần 3
      // Nếu có shuffle, chỉ shuffle câu hỏi trong nội bộ từng phần, tuyệt đối không trộn lẫn giữa các phần!
      const sortedSections = [...rawSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const sectionMap = new Map();
      for (const s of sortedSections) {
        sectionMap.set(s.id, []);
      }
      const otherQuestions = [];

      for (const q of questionPool) {
        if (q.sectionId && sectionMap.has(q.sectionId)) {
          sectionMap.get(q.sectionId).push(q);
        } else {
          otherQuestions.push(q);
        }
      }

      const orderedList = [];
      for (const s of sortedSections) {
        const secQuestions = sectionMap.get(s.id) || [];
        if (shouldShuffle) {
          orderedList.push(...shuffleArray(secQuestions));
        } else {
          secQuestions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          orderedList.push(...secQuestions);
        }
      }

      if (shouldShuffle) {
        orderedList.push(...shuffleArray(otherQuestions));
      } else {
        otherQuestions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        orderedList.push(...otherQuestions);
      }

      questionPool = orderedList;
    } else {
      if (shouldShuffle) {
        questionPool = shuffleArray(questionPool);
      } else {
        questionPool.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    }

    // Limit question count if requested
    if (config?.questionCount && config.questionCount > 0 && config.questionCount < questionPool.length) {
      questionPool = questionPool.slice(0, config.questionCount);
    }

    // 4. Determine session configuration
    const isPracticeOrFlashcard = sessionMode === "PRACTICE" || sessionMode === "FLASHCARD";
    const sessionConfig = {
      shuffleQuestions: Boolean(config?.shuffleQuestions || sessionMode === "MOCK_EXAM"),
      shuffleOptions: Boolean(config?.shuffleOptions || sessionMode === "MOCK_EXAM"),
      showAnswerImmediately:
        config?.showAnswerImmediately !== undefined
          ? Boolean(config.showAnswerImmediately)
          : isPracticeOrFlashcard,
      showExplanation:
        config?.showExplanation !== undefined ? Boolean(config.showExplanation) : isPracticeOrFlashcard,
      allowRetry: isPracticeOrFlashcard,
      source: source || config?.source || "ALL",
      questionCount: questionPool.length,
    };

    // Calculate duration in seconds
    let durationSeconds = null;
    if (config?.duration && config.duration > 0) {
      durationSeconds = config.duration * 60;
    } else if (sessionMode === "MOCK_EXAM" || sessionMode === "TEST") {
      if (quiz.timeLimit && quiz.timeLimit > 0) {
        durationSeconds = quiz.timeLimit * 60;
      }
    }

    const questionOrder = questionPool.map((q) => q.id);
    const totalPoints = questionPool.reduce((sum, q) => sum + (q.points || 1), 0);

    // 5. Create Session
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId: targetQuizId,
        mode: sessionMode,
        config: sessionConfig,
        totalQuestions: questionPool.length,
        totalPoints,
        correctAnswers: 0,
        incorrectAnswers: 0,
        unanswered: questionPool.length,
        score: 0,
        duration: durationSeconds,
        questionOrder,
        status: "IN_PROGRESS",
      },
    });

    // 6. Format Question payload (safe, no isCorrect for MOCK_EXAM / TEST)
    const formattedQuestions = questionPool.map((q) => {
      let answers = q.answers.map((a) => ({
        id: a.id,
        content: a.content,
        order: a.order,
        media: a.media,
      }));

      if (sessionConfig.shuffleOptions) {
        answers = shuffleArray(answers);
      }

      return {
        id: q.id,
        sectionId: q.sectionId,
        section: q.section,
        content: q.content,
        type: q.type,
        points: q.points,
        order: q.order,
        explanation: sessionConfig.showExplanation ? q.explanation : undefined,
        answers,
        media: q.media,
      };
    });

    return {
      sessionId: attempt.id,
      attemptId: attempt.id,
      quizId: quiz.id,
      mode: attempt.mode,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category ? { id: quiz.category.id, name: quiz.category.name } : null,
      sections: quiz.sections || [],
      timeLimit: quiz.timeLimit,
      duration: durationSeconds,
      totalQuestions: questionPool.length,
      startedAt: attempt.startedAt,
      config: sessionConfig,
      questions: formattedQuestions,
    };
  },

  /**
   * Save an answer for a question in a session
   */
  async saveAnswer(userId, sessionId, { questionId, answerId, selectedAnswerIds = [] }) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { id: questionId },
              include: { answers: true },
            },
          },
        },
      },
    });

    if (!attempt) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiên làm bài");
    if (attempt.userId !== userId) throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này");
    if (attempt.status !== "IN_PROGRESS") throw new ApiError(StatusCodes.BAD_REQUEST, "Phiên làm bài này đã kết thúc");

    // Check expiration if duration set (add 15s grace period for latency)
    if (attempt.duration && attempt.duration > 0) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      if (elapsedSeconds > attempt.duration + 15) {
        await prisma.quizAttempt.update({
          where: { id: sessionId },
          data: { status: "EXPIRED", finishedAt: new Date() },
        });
        throw new ApiError(StatusCodes.BAD_REQUEST, "Phiên thi đã hết thời gian làm bài");
      }
    }

    const question = attempt.quiz.questions[0];
    if (!question) throw new ApiError(StatusCodes.NOT_FOUND, "Câu hỏi không tồn tại trong bài thi này");

    // Determine correctness
    const targetAnswerId = answerId || (selectedAnswerIds.length > 0 ? selectedAnswerIds[0] : null);
    const selectedAnswer = targetAnswerId ? question.answers.find((a) => a.id === targetAnswerId) : null;
    const isCorrect = Boolean(selectedAnswer?.isCorrect);
    const pointsEarned = isCorrect ? question.points : 0;

    // Upsert user answer
    const savedAnswer = await prisma.userAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: sessionId,
          questionId,
        },
      },
      create: {
        attemptId: sessionId,
        questionId,
        answerId: targetAnswerId,
        selectedAnswerIds: selectedAnswerIds.length > 0 ? selectedAnswerIds : targetAnswerId ? [targetAnswerId] : [],
        isCorrect,
        points: pointsEarned,
        answeredAt: new Date(),
      },
      update: {
        answerId: targetAnswerId,
        selectedAnswerIds: selectedAnswerIds.length > 0 ? selectedAnswerIds : targetAnswerId ? [targetAnswerId] : [],
        isCorrect,
        points: pointsEarned,
        answeredAt: new Date(),
      },
    });

    const config = attempt.config || {};
    const showImmediately = config.showAnswerImmediately;

    if (showImmediately) {
      const correctAnswer = question.answers.find((a) => a.isCorrect);
      return {
        success: true,
        questionId,
        answerId: targetAnswerId,
        isCorrect,
        pointsEarned,
        explanation: question.explanation,
        correctAnswerId: correctAnswer?.id || null,
        correctAnswerContent: correctAnswer?.content || null,
      };
    }

    return {
      success: true,
      questionId,
      answerId: targetAnswerId,
      saved: true,
    };
  },

  /**
   * Get current session detail (with safe questions and existing answers)
   */
  async getSession(userId, sessionId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            category: true,
            sections: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true, description: true },
            },
            questions: {
              include: {
                section: { select: { id: true, title: true, order: true } },
                answers: {
                  include: { media: { orderBy: { order: "asc" } } },
                },
                media: { orderBy: { order: "asc" } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiên làm bài");
    if (attempt.userId !== userId) throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền truy cập phiên này");

    const now = Date.now();
    let remainingSeconds = null;

    if (attempt.duration && attempt.duration > 0) {
      const endTimestamp = new Date(attempt.startedAt).getTime() + attempt.duration * 1000;
      remainingSeconds = Math.max(0, Math.floor((endTimestamp - now) / 1000));

      if (remainingSeconds <= 0 && attempt.status === "IN_PROGRESS") {
        return await this.submitSession(userId, sessionId);
      }
    }

    // Preserve original questionOrder
    const questionMap = new Map(attempt.quiz.questions.map((q) => [q.id, q]));
    const orderedQuestions =
      attempt.questionOrder && attempt.questionOrder.length > 0
        ? attempt.questionOrder.map((id) => questionMap.get(id)).filter(Boolean)
        : attempt.quiz.questions;

    const config = attempt.config || {};
    const showAnswerImmediately = config.showAnswerImmediately;

    const formattedQuestions = orderedQuestions.map((q) => {
      const answers = q.answers.map((a) => {
        if (showAnswerImmediately) {
          return { id: a.id, content: a.content, order: a.order, isCorrect: a.isCorrect, media: a.media };
        }
        return { id: a.id, content: a.content, order: a.order, media: a.media };
      });

      return {
        id: q.id,
        sectionId: q.sectionId,
        section: q.section,
        content: q.content,
        type: q.type,
        points: q.points,
        order: q.order,
        explanation: showAnswerImmediately ? q.explanation : undefined,
        answers,
        media: q.media,
      };
    });

    const userAnswerMap = {};
    for (const ans of attempt.answers) {
      userAnswerMap[ans.questionId] = ans.answerId;
    }

    return {
      sessionId: attempt.id,
      attemptId: attempt.id,
      quizId: attempt.quizId,
      mode: attempt.mode,
      title: attempt.quiz.title,
      description: attempt.quiz.description,
      category: attempt.quiz.category ? { id: attempt.quiz.category.id, name: attempt.quiz.category.name } : null,
      sections: attempt.quiz.sections || [],
      status: attempt.status,
      startedAt: attempt.startedAt,
      duration: attempt.duration,
      remainingSeconds,
      totalQuestions: orderedQuestions.length,
      config: attempt.config,
      userAnswers: userAnswerMap,
      questions: formattedQuestions,
    };
  },

  /**
   * Submit exam session
   */
  async submitSession(userId, sessionId, userAnswersList = null) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: { answers: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiên làm bài");
    if (attempt.userId !== userId) throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền nộp bài thi này");

    // If already completed, return cached result
    if (attempt.status === "COMPLETED") {
      return await this.getResult(userId, sessionId);
    }

    const quiz = attempt.quiz;
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

    // Determine questions in this session
    const sessionQuestions =
      attempt.questionOrder && attempt.questionOrder.length > 0
        ? attempt.questionOrder.map((id) => questionMap.get(id)).filter(Boolean)
        : quiz.questions;

    // Merge provided answers if any
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a.answerId]));
    if (Array.isArray(userAnswersList)) {
      for (const item of userAnswersList) {
        if (item.questionId) {
          answerMap.set(item.questionId, item.answerId || item.selectedAnswerIds?.[0] || null);
        }
      }
    }

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;
    let pointsEarned = 0;
    let totalPossibleScore = 0;
    const answersToUpsert = [];

    for (const question of sessionQuestions) {
      const qPoints = question.points || 1;
      totalPossibleScore += qPoints;

      const selectedAnswerId = answerMap.get(question.id) || null;
      if (!selectedAnswerId) {
        unanswered++;
        answersToUpsert.push({
          attemptId: sessionId,
          questionId: question.id,
          answerId: null,
          selectedAnswerIds: [],
          isCorrect: false,
          points: 0,
        });
      } else {
        const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId);
        const isCorrect = Boolean(selectedAnswer?.isCorrect);
        if (isCorrect) {
          correctAnswers++;
          pointsEarned += qPoints;
        } else {
          incorrectAnswers++;
        }
        answersToUpsert.push({
          attemptId: sessionId,
          questionId: question.id,
          answerId: selectedAnswerId,
          selectedAnswerIds: [selectedAnswerId],
          isCorrect,
          points: isCorrect ? qPoints : 0,
        });
      }
    }

    const scorePercent =
      totalPossibleScore > 0 ? Math.round((pointsEarned / totalPossibleScore) * 100) : 0;
    const score10 =
      totalPossibleScore > 0 ? Math.round((pointsEarned / totalPossibleScore) * 100) / 10 : 0;

    await prisma.$transaction(async (tx) => {
      await tx.userAnswer.deleteMany({ where: { attemptId: sessionId } });
      for (const ans of answersToUpsert) {
        await tx.userAnswer.create({ data: ans });
      }
      await tx.quizAttempt.update({
        where: { id: sessionId },
        data: {
          correctAnswers,
          incorrectAnswers,
          unanswered,
          pointsEarned,
          totalPoints: totalPossibleScore,
          score: scorePercent,
          status: "COMPLETED",
          finishedAt: new Date(),
        },
      });
    });

    return await this.getResult(userId, sessionId);
  },

  /**
   * Get Result of a completed session
   */
  async getResult(userId, sessionId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            category: true,
            questions: {
              include: { answers: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy kết quả làm bài");
    if (attempt.userId !== userId) throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xem kết quả này");
    if (attempt.status !== "COMPLETED") throw new ApiError(StatusCodes.BAD_REQUEST, "Phiên làm bài chưa hoàn thành");

    const quiz = attempt.quiz;
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
    const sessionQuestions =
      attempt.questionOrder && attempt.questionOrder.length > 0
        ? attempt.questionOrder.map((id) => questionMap.get(id)).filter(Boolean)
        : quiz.questions;

    const userAnswerMap = new Map(attempt.answers.map((ua) => [ua.questionId, ua]));
    const wrongQuestionIds = [];

    const questionResults = sessionQuestions.map((q) => {
      const userAnswer = userAnswerMap.get(q.id);
      const correctAnswer = q.answers.find((a) => a.isCorrect);
      const selectedAnswer = userAnswer?.answerId ? q.answers.find((a) => a.id === userAnswer.answerId) : null;
      const isCorrect = Boolean(userAnswer?.isCorrect);

      if (!isCorrect) {
        wrongQuestionIds.push(q.id);
      }

      return {
        questionId: q.id,
        content: q.content,
        type: q.type,
        points: q.points,
        pointsEarned: userAnswer?.points || 0,
        isCorrect,
        explanation: q.explanation || null,
        selectedAnswerId: userAnswer?.answerId || null,
        selectedAnswerContent: selectedAnswer?.content || null,
        correctAnswerId: correctAnswer?.id || null,
        correctAnswerContent: correctAnswer?.content || null,
        answers: q.answers.map((a) => ({ id: a.id, content: a.content, isCorrect: a.isCorrect })),
      };
    });

    const timeTakenSeconds =
      attempt.startedAt && attempt.finishedAt
        ? Math.max(0, Math.round((new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000))
        : null;

    const score10 = Math.round((attempt.score / 10) * 10) / 10;

    return {
      sessionId: attempt.id,
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: quiz.title,
      category: quiz.category ? { id: quiz.category.id, name: quiz.category.name } : null,
      mode: attempt.mode,
      score: attempt.score,
      score10,
      pointsEarned: attempt.pointsEarned || 0,
      totalPossibleScore: attempt.totalPoints || 0,
      correctAnswers: attempt.correctAnswers,
      incorrectAnswers: attempt.incorrectAnswers || 0,
      unanswered: attempt.unanswered || 0,
      totalQuestions: sessionQuestions.length,
      wrongQuestionIds,
      isPassed: attempt.score >= 50,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      timeTakenSeconds,
      config: attempt.config,
      questionResults,
    };
  },

  /**
   * Get user exam history with filters
   */
  async getUserHistory(userId, { mode = null, page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId, status: "COMPLETED" };
    if (mode) where.mode = mode;

    const [items, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { finishedAt: "desc" },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              category: { select: { id: true, name: true } },
              _count: { select: { questions: true } },
            },
          },
        },
      }),
      prisma.quizAttempt.count({ where }),
    ]);

    return { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 };
  },

  /**
   * Get list of questions user has answered incorrectly
   */
  async getWrongAnswers(userId, { quizId = null, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      attempt: {
        userId,
        status: "COMPLETED",
        ...(quizId ? { quizId } : {}),
      },
      isCorrect: false,
    };

    // Find unique wrong questions with latest attempt
    const wrongAnswers = await prisma.userAnswer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        question: {
          include: {
            answers: true,
            quiz: {
              select: {
                id: true,
                title: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Deduplicate by questionId
    const questionMap = new Map();
    for (const ans of wrongAnswers) {
      if (!questionMap.has(ans.questionId) && ans.question) {
        questionMap.set(ans.questionId, {
          questionId: ans.question.id,
          content: ans.question.content,
          explanation: ans.question.explanation,
          type: ans.question.type,
          points: ans.question.points,
          quiz: ans.question.quiz,
          lastAnsweredAt: ans.createdAt,
          userAnswerId: ans.answerId,
          answers: ans.question.answers.map((a) => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect,
          })),
        });
      }
    }

    const allWrongQuestions = Array.from(questionMap.values());
    const total = allWrongQuestions.length;
    const paginatedItems = allWrongQuestions.slice(skip, skip + limitNum);

    return {
      items: paginatedItems,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Get overall user learning progress and statistics
   */
  async getLearningProgress(userId) {
    const [completedAttempts, totalAnswers, correctAnswersCount] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { finishedAt: "desc" },
      }),
      prisma.userAnswer.count({
        where: { attempt: { userId, status: "COMPLETED" } },
      }),
      prisma.userAnswer.count({
        where: { attempt: { userId, status: "COMPLETED" }, isCorrect: true },
      }),
    ]);

    const totalSessions = completedAttempts.length;
    const totalQuestionsAnswered = totalAnswers;
    const totalCorrect = correctAnswersCount;
    const totalIncorrect = Math.max(0, totalQuestionsAnswered - totalCorrect);
    const accuracyRate =
      totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

    let totalScoreSum = 0;
    let totalStudyTimeSeconds = 0;
    const categoryStats = {};
    const modeStats = {
      PRACTICE: 0,
      MOCK_EXAM: 0,
      TEST: 0,
      ASSIGNMENT: 0,
      FLASHCARD: 0,
    };

    for (const att of completedAttempts) {
      totalScoreSum += att.score || 0;
      if (att.mode && modeStats[att.mode] !== undefined) {
        modeStats[att.mode]++;
      }

      if (att.startedAt && att.finishedAt) {
        const dur = (new Date(att.finishedAt).getTime() - new Date(att.startedAt).getTime()) / 1000;
        if (dur > 0) totalStudyTimeSeconds += Math.round(dur);
      }

      const catName = att.quiz?.category?.name || "Chung";
      if (!categoryStats[catName]) {
        categoryStats[catName] = {
          categoryName: catName,
          totalAttempts: 0,
          totalScore: 0,
          correctAnswers: 0,
          totalQuestions: 0,
        };
      }
      categoryStats[catName].totalAttempts++;
      categoryStats[catName].totalScore += att.score || 0;
      categoryStats[catName].correctAnswers += att.correctAnswers || 0;
      categoryStats[catName].totalQuestions += att.totalQuestions || 0;
    }

    const avgScore = totalSessions > 0 ? Math.round(totalScoreSum / totalSessions) : 0;

    const categoryProgress = Object.values(categoryStats).map((cat) => ({
      categoryName: cat.categoryName,
      totalAttempts: cat.totalAttempts,
      avgScore: Math.round(cat.totalScore / cat.totalAttempts),
      accuracyRate:
        cat.totalQuestions > 0 ? Math.round((cat.correctAnswers / cat.totalQuestions) * 100) : 0,
    }));

    return {
      totalSessions,
      totalQuestionsAnswered,
      totalCorrect,
      totalIncorrect,
      accuracyRate,
      avgScore,
      totalStudyTimeSeconds,
      modeStats,
      categoryProgress,
      recentSessions: completedAttempts.slice(0, 5).map((att) => ({
        id: att.id,
        quizId: att.quizId,
        quizTitle: att.quiz?.title,
        mode: att.mode,
        score: att.score,
        correctAnswers: att.correctAnswers,
        totalQuestions: att.totalQuestions,
        finishedAt: att.finishedAt,
      })),
    };
  },

  // Legacy wrappers for backwards compatibility
  async startAttempt(userId, quizId) {
    return this.startSession(userId, { quizId, mode: "MOCK_EXAM" });
  },
  async submitAttempt(userId, attemptId, userAnswers) {
    return this.submitSession(userId, attemptId, userAnswers);
  },
  async getAttemptResult(userId, attemptId) {
    return this.getResult(userId, attemptId);
  },
};
