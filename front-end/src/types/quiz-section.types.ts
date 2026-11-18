import type { Question, QuestionDraft } from "./quiz.types";

export interface QuizSection {
  id: string;
  quizId: string;
  title: string;
  description?: string | null;
  order: number;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizSectionDraft {
  id?: string;
  title: string;
  description?: string;
  order: number;
  questions: QuestionDraft[];
}

export interface ImportedSection {
  tempId: string;
  title: string;
  description?: string;
  order: number;
  questions: QuestionDraft[];
}

export type SectionProgressStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface ExamSectionProgress {
  sectionId: string;
  title: string;
  order: number;
  status: SectionProgressStatus;
  answeredCount: number;
  totalCount: number;
}
