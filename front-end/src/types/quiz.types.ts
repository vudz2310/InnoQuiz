import type { QuizSection, QuizSectionDraft } from "./quiz-section.types";

export type QuizStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface QuizAuthor {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface QuizMedia {
  id: string;
  type: "IMAGE";
  originalName?: string | null;
  storageKey: string;
  url?: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  order: number;
}

export interface Answer {
  id: string;
  content: string;
  isCorrect?: boolean;
  order: number;
  media?: QuizMedia[];
}

export interface Question {
  id: string;
  sectionId?: string | null;
  section?: {
    id: string;
    title: string;
    order: number;
    description?: string | null;
  } | null;
  content: string;
  quizId?: string;
  type: QuestionType;
  points: number;
  order: number;
  answers: Answer[];
  media?: QuizMedia[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  coverKey?: string | null;
  coverUrl?: string | null;
  authorId?: string;
  author?: QuizAuthor;
  categoryId?: string | null;
  category?: Category | null;
  status: QuizStatus;
  timeLimit?: number | null;
  createdAt: string;
  updatedAt?: string;
  sections?: QuizSection[];
  questions?: Question[];
  _count?: {
    questions: number;
    attempts?: number;
  };
}

import type { ContentSegment } from "../features/converter/types/converter.types";

export interface AnswerDraft {
  id?: string;
  content: string;
  isCorrect: boolean | null;
  order: number;
  media?: DraftMedia[];
}

export interface DraftMedia {
  tempId: string;
  type: "IMAGE";
  assetId: string;
  order: number;
  originalName?: string;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  storageKey?: string;
  width?: number;
  height?: number;
  confidence?: number;
  source?: {
    page?: number;
    blockIndex?: number;
  };
}

export interface QuestionDraft {
  id?: string;
  tempId?: string;
  sectionId?: string | null;
  content: string;
  contentSegments?: ContentSegment[];
  type: QuestionType;
  points: number;
  order: number;
  answers: AnswerDraft[];
  media?: DraftMedia[];
}

export interface QuizDraft {
  id?: string;
  title: string;
  description?: string;
  coverKey?: string | null;
  coverUrl?: string | null;
  coverFile?: File | null;
  categoryId?: string;
  timeLimit?: number | null;
  sections?: QuizSectionDraft[];
  questions: QuestionDraft[];
  status?: QuizStatus;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  coverKey?: string | null;
  coverUrl?: string | null;
  categoryId?: string;
  timeLimit?: number;
  sections?: QuizSectionDraft[];
  questions?: QuestionDraft[];
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string;
  coverKey?: string | null;
  coverUrl?: string | null;
  categoryId?: string;
  timeLimit?: number | null;
  sections?: QuizSectionDraft[];
  questions?: QuestionDraft[];
}

export interface QuizListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
}

export interface QuizListResponse {
  items: Quiz[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
