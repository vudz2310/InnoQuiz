import { StatusCodes } from "http-status-codes";
import { attemptService } from "../services/attempt.service.js";

export const attemptController = {
  // Start Exam Session
  async startSession(req, res, next) {
    try {
      const userId = req.user.id;
      const { quizId, mode, config, source } = req.body;
      const targetQuizId = quizId || req.params.quizId;
      const result = await attemptService.startSession(userId, {
        quizId: targetQuizId,
        mode,
        config,
        source,
      });
      return res.status(StatusCodes.CREATED).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Save single answer or instant check (Practice / Flashcard)
  async saveAnswer(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId || req.params.attemptId;
      const { questionId, answerId, selectedAnswerIds } = req.body;
      const result = await attemptService.saveAnswer(userId, sessionId, {
        questionId,
        answerId,
        selectedAnswerIds,
      });
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Get session state (timer, answers, question list)
  async getSession(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId || req.params.attemptId;
      const result = await attemptService.getSession(userId, sessionId);
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Submit Session
  async submitSession(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId || req.params.attemptId;
      const { answers } = req.body;
      const result = await attemptService.submitSession(userId, sessionId, answers);
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Get Result
  async getResult(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId || req.params.attemptId;
      const result = await attemptService.getResult(userId, sessionId);
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Get wrong answers
  async getWrongAnswers(req, res, next) {
    try {
      const userId = req.user.id;
      const { quizId, page, limit } = req.query;
      const result = await attemptService.getWrongAnswers(userId, { quizId, page, limit });
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Start Practice with Wrong Answers
  async startWrongAnswersPractice(req, res, next) {
    try {
      const userId = req.user.id;
      const { quizId } = req.body;
      const result = await attemptService.startSession(userId, {
        quizId,
        mode: "PRACTICE",
        source: "WRONG_ANSWERS",
        config: { showAnswerImmediately: true, showExplanation: true, allowRetry: true },
      });
      return res.status(StatusCodes.CREATED).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Learning Progress & Stats
  async getLearningProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await attemptService.getLearningProgress(userId);
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // History with mode filter
  async getUserHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { mode, page, limit } = req.query;
      const result = await attemptService.getUserHistory(userId, { mode, page, limit });
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Backwards compatibility handlers
  async startAttempt(req, res, next) {
    try {
      const userId = req.user.id;
      const { quizId } = req.params;
      const { mode, config } = req.body || {};
      const result = await attemptService.startSession(userId, { quizId, mode: mode || "MOCK_EXAM", config });
      return res.status(StatusCodes.CREATED).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async submitAttempt(req, res, next) {
    try {
      const userId = req.user.id;
      const { attemptId } = req.params;
      const { answers } = req.body;
      const result = await attemptService.submitSession(userId, attemptId, answers);
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAttemptResult(req, res, next) {
    try {
      const userId = req.user.id;
      const { attemptId } = req.params;
      const result = await attemptService.getResult(userId, attemptId);
      return res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
