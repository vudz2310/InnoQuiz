import express from "express";
import { attemptController } from "../controllers/attempt.controller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Standard Exam Sessions REST API
 */

// Start session: POST /api/exam-sessions
router.post("/", verifyToken, attemptController.startSession);

// Aggregation & queries
router.get("/history", verifyToken, attemptController.getUserHistory);
router.get("/wrong-answers", verifyToken, attemptController.getWrongAnswers);
router.post("/wrong-answers/practice", verifyToken, attemptController.startWrongAnswersPractice);
router.get("/progress", verifyToken, attemptController.getLearningProgress);

// Single session actions
router.get("/:sessionId", verifyToken, attemptController.getSession);
router.post("/:sessionId/answers", verifyToken, attemptController.saveAnswer);
router.post("/:sessionId/submit", verifyToken, attemptController.submitSession);
router.get("/:sessionId/result", verifyToken, attemptController.getResult);

export const examSessionRoute = router;
