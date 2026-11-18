export type ExamMode =
  | "PRACTICE"
  | "MOCK_EXAM"
  | "TEST"
  | "ASSIGNMENT"
  | "FLASHCARD";

export type ExamSessionStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABANDONED"
  | "EXPIRED"
  | "CANCELLED";

export interface ExamConfig {
  mode: ExamMode;
  questionCount?: number;
  duration?: number; // in minutes
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showAnswerImmediately?: boolean;
  showExplanation?: boolean;
  allowRetry?: boolean;
  maxAttempts?: number;
  startAt?: string;
  dueAt?: string;
  source?: "ALL" | "WRONG_ANSWERS";
}

export interface AttemptAnswer {
  questionId: string;
  answerId: string | null;
  selectedAnswerIds?: string[];
}

import type { QuizSection } from "./quiz-section.types";
import type { QuizMedia } from "./quiz.types";

export interface ExamQuestionAnswer {
  id: string;
  content: string;
  order: number;
  isCorrect?: boolean;
  media?: QuizMedia[];
}

export interface AttemptQuestion {
  id: string;
  sectionId?: string | null;
  section?: {
    id: string;
    title: string;
    order: number;
    description?: string | null;
  } | null;
  content: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  points: number;
  order: number;
  explanation?: string;
  answers: ExamQuestionAnswer[];
  media?: QuizMedia[];
}

export interface StartAttemptResponse {
  sessionId: string;
  attemptId: string;
  quizId: string;
  mode: ExamMode;
  title: string;
  description?: string | null;
  category?: { id: string; name: string } | null;
  timeLimit?: number | null;
  duration?: number | null; // in seconds
  remainingSeconds?: number | null;
  totalQuestions: number;
  startedAt: string;
  status?: ExamSessionStatus;
  config?: ExamConfig;
  userAnswers?: Record<string, string>;
  sections?: QuizSection[];
  questions: AttemptQuestion[];
}

export interface SaveAnswerResponse {
  success: boolean;
  questionId: string;
  answerId: string | null;
  isCorrect?: boolean;
  pointsEarned?: number;
  explanation?: string;
  correctAnswerId?: string | null;
  correctAnswerContent?: string | null;
  saved?: boolean;
}

export interface QuestionResult {
  questionId: string;
  content: string;
  type: string;
  points: number;
  pointsEarned: number;
  isCorrect: boolean;
  explanation?: string | null;
  selectedAnswerId: string | null;
  selectedAnswerContent: string | null;
  correctAnswerId: string | null;
  correctAnswerContent: string | null;
  answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
}

export interface AttemptResult {
  sessionId: string;
  attemptId: string;
  quizId: string;
  quizTitle: string;
  category?: { id: string; name: string } | null;
  mode: ExamMode;
  score: number; // percentage (0 - 100)
  score10: number; // scale 10 (0 - 10)
  pointsEarned?: number;
  totalPoints?: number;
  totalPossibleScore?: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  totalQuestions: number;
  wrongQuestionIds?: string[];
  isPassed: boolean;
  startedAt?: string;
  finishedAt?: string;
  timeTakenSeconds?: number | null;
  config?: ExamConfig;
  questionResults: QuestionResult[];
}

export interface HistoryItem {
  id: string;
  quizId: string;
  mode?: ExamMode;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  status: string;
  startedAt: string;
  finishedAt: string;
  quiz: {
    id: string;
    title: string;
    category?: { id: string; name: string } | null;
    _count?: { questions: number };
  };
}

export interface WrongAnswerItem {
  questionId: string;
  content: string;
  explanation?: string | null;
  type: string;
  points: number;
  lastAnsweredAt: string;
  userAnswerId?: string | null;
  quiz: {
    id: string;
    title: string;
    category?: { id: string; name: string } | null;
  };
  answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
}

export interface LearningProgress {
  totalSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracyRate: number;
  avgScore: number;
  totalStudyTimeSeconds: number;
  modeStats: Record<ExamMode, number>;
  categoryProgress: {
    categoryName: string;
    totalAttempts: number;
    avgScore: number;
    accuracyRate: number;
  }[];
  recentSessions: {
    id: string;
    quizId: string;
    quizTitle: string;
    mode: ExamMode;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    finishedAt: string;
  }[];
}
