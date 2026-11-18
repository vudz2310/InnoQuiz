import express from "express";
import { attemptController } from "../controllers/attempt.controller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Specific sub-routes (before :id parameter routes)
router.get("/history", verifyToken, attemptController.getUserHistory);
router.get("/wrong-answers", verifyToken, attemptController.getWrongAnswers);
router.post("/wrong-answers/practice", verifyToken, attemptController.startWrongAnswersPractice);
router.get("/progress", verifyToken, attemptController.getLearningProgress);
router.post("/start", verifyToken, attemptController.startSession);

// Session lifecycle routes
router.post("/:quizId/start", verifyToken, attemptController.startAttempt);
router.get("/:attemptId", verifyToken, attemptController.getSession);
router.post("/:attemptId/answers", verifyToken, attemptController.saveAnswer);
router.post("/:attemptId/submit", verifyToken, attemptController.submitAttempt);
router.get("/:attemptId/result", verifyToken, attemptController.getAttemptResult);

export const attemptRoute = router;
