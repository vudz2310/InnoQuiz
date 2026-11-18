import type { QuestionType } from "../../../types/quiz.types";

export const PARSER_VERSION = "3.0.0";

export type OptionMode = "LABELED" | "UNLABELED" | "NONE";

export interface SourceOptionMarker {
  label: string;
  hasCorrectMarker: boolean;
  lineIndex: number;
  inlineIndex?: number;
  rawMarker: string;
  contentStart: string;
  blockId?: string;
}

export interface DocumentParseAudit {
  totalQuestions: number;
  questionsWithExtraOptions: number;
  questionsWithMissingOptions: number;
  questionsWithDuplicateLabels: number;
  questionsWithLabelGaps: number;
  singleChoiceWithMultipleCorrectAnswers: number;
  orphanContinuationBlocks: number;
  sourceMarkerMismatchCount: number;
}

export type ConverterBlockType = "TEXT" | "IMAGE" | "TABLE";
export type ConverterQuestionStatus = "VALID" | "NEEDS_REVIEW" | "INVALID";
export type ParseStatus = "VALID" | "NEEDS_REVIEW" | "INVALID";
export type AnswerStatus =
  | "DETECTED"
  | "MISSING"
  | "AMBIGUOUS"
  | "NOT_APPLICABLE"
  | "NOT_REQUIRED";

export type DocumentBlockKind =
  | "TEXT"
  | "IMAGE"
  | "TABLE"
  | "PAGE_BREAK"
  | "SECTION_BREAK";

export interface SourceLocation {
  fileName: string;
  pageNumber?: number;
  paragraphIndex?: number;
  tableIndex?: number;
  rowIndex?: number;
  cellIndex?: number;
  blockIndex: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlighted?: boolean;
  highlightColor?: string;
  fontSize?: number;
  headingLevel?: number;
  listLevel?: number;
  listMarker?: string;
}

export interface ExtractedImage {
  assetId: string;
  originalName?: string;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  width?: number;
  height?: number;
  page?: number;
  blockIndex: number;
  confidence?: number;
}

export interface DocumentBlockBase {
  type: ConverterBlockType;
  order: number;
  page?: number;
  sourceName?: string;
}

export interface TextDocumentBlock extends DocumentBlockBase {
  type: "TEXT";
  content: string;
}

export interface ImageDocumentBlock extends DocumentBlockBase {
  type: "IMAGE";
  image: ExtractedImage;
}

export interface TableDocumentBlock extends DocumentBlockBase {
  type: "TABLE";
  content: string;
}

export interface DocumentBlock {
  id?: string;
  kind?: DocumentBlockKind;
  type: ConverterBlockType;
  order: number;
  page?: number;
  sourceName?: string;
  content?: string;
  rawText?: string;
  normalizedText?: string;
  image?: ExtractedImage;
  mediaAssetId?: string;
  tableData?: string[][];
  style?: TextStyle;
  source?: SourceLocation;
  children?: DocumentBlock[];
}

export type ContentSegmentType = "TEXT" | "CODE" | "IMAGE" | "MATH";

export interface ContentSegment {
  id: string;
  type: ContentSegmentType;
  rawContent: string;
  normalizedContent: string;
  language?: string;
  preserveWhitespace?: boolean;
  sourceBlockIds?: string[];
}

export type EvidenceType =
  | "STAR_PREFIX"
  | "DOCX_HIGHLIGHT"
  | "DOCX_BOLD"
  | "JSON_FIELD"
  | "ANSWER_KEY_TABLE"
  | "USER_CONFIRMED";

export interface AnswerEvidence {
  type: EvidenceType;
  sourceBlockId: string;
  confidence: number;
  description?: string;
}

export interface MediaAsset {
  id: string;
  hash: string;
  mimeType: string;
  width?: number;
  height?: number;
  blobUrl?: string;
  dataUrl?: string;
  fileName?: string;
}

export interface MediaPlacement {
  assetId: string;
  sourceBlockId: string;
  pageNumber?: number;
  order: number;
  ownerType?: "QUESTION" | "OPTION" | "UNASSIGNED";
  ownerId?: string;
}

export interface NormalizedMedia {
  tempId: string;
  type: "IMAGE";
  assetId: string;
  order: number;
  originalName?: string;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  width?: number;
  height?: number;
  confidence?: number;
  source?: {
    page?: number;
    blockIndex?: number;
  };
}

export interface NormalizedOption {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean | null;
  evidence?: AnswerEvidence[];
  contentSegments?: ContentSegment[];
  media: NormalizedMedia[];
}

export interface NormalizedQuestion {
  tempId: string;
  sourceNumber?: number;
  order: number;
  content: string;
  contentSegments?: ContentSegment[];
  type: QuestionType;
  points: number;
  options: NormalizedOption[];
  media: NormalizedMedia[];
  correctOptionIds: string[];
  answerDetected: boolean;
  status: ConverterQuestionStatus;
  parseStatus?: ParseStatus;
  answerStatus?: AnswerStatus;
  confidence?: number;
  warnings: string[];
  sourceBlockIds?: string[];
  source?: {
    page?: number;
    blockIndex?: number;
  };
  optionMode?: OptionMode;
  sourceOptionMarkers?: SourceOptionMarker[];
}

export interface NormalizedSection {
  tempId: string;
  title: string;
  order: number;
  questions: NormalizedQuestion[];
}

export interface ConverterWarning {
  code: string;
  message: string;
  sectionTempId?: string;
  questionTempId?: string;
  page?: number;
  blockIndex?: number;
}

export interface NormalizedQuizStatistics {
  totalSections: number;
  totalQuestions: number;
  totalImages: number;
  validQuestions: number;
  waitingAnswerQuestions?: number;
  needsReviewQuestions: number;
  invalidQuestions: number;
}

export interface DuplicateSectionCandidate {
  firstSectionId: string;
  secondSectionId: string;
  firstTitle: string;
  secondTitle: string;
  firstOrder: number;
  secondOrder: number;
  similarity: number;
  canMergeAnswers: boolean;
  message: string;
}

export interface NormalizedQuiz {
  parserVersion?: string;
  title?: string;
  sections: NormalizedSection[];
  unassignedMedia: NormalizedMedia[];
  warnings: ConverterWarning[];
  statistics: NormalizedQuizStatistics;
  audit?: DocumentParseAudit;
  duplicateSections?: DuplicateSectionCandidate[];
}

export type NormalizedResult = NormalizedQuiz;

export interface ConverterResult {
  parserVersion: string;
  normalized: NormalizedQuiz;
  blocks: DocumentBlock[];
  sourceText: string;
  audit: DocumentParseAudit;
}

// Canonical QuizDraft Schema
export interface QuizOptionDraft {
  id: string;
  label?: string;
  order: number;
  text: string;
  mediaAssetIds: string[];
  contentSegments?: ContentSegment[];
  isCorrect: boolean | null;
  evidence: AnswerEvidence[];
  sourceBlockIds: string[];
}

export interface ImportWarning {
  code: string;
  message: string;
  sourceBlockId?: string;
  questionId?: string;
  severity: "INFO" | "WARNING" | "ERROR";
}

export interface QuizQuestionDraft {
  id: string;
  sourceNumber?: number;
  order: number;
  type: QuestionType;
  content: string;
  contentSegments: ContentSegment[];
  mediaAssetIds: string[];
  options: QuizOptionDraft[];
  correctOptionIds: string[] | null;
  answerStatus: AnswerStatus;
  parseStatus: ParseStatus;
  confidence: number;
  warnings: ImportWarning[];
  sourceBlockIds: string[];
  sourceLocation?: {
    sourceName?: string;
    page?: number;
    blockIndex?: number;
  };
}

export interface QuizSectionDraft {
  id: string;
  title: string;
  order: number;
  questions: QuizQuestionDraft[];
}

export interface ImportStatistics {
  totalSections: number;
  totalQuestions: number;
  totalImages: number;
  readyQuestions: number;
  waitingAnswerQuestions: number;
  needsReviewQuestions: number;
  invalidQuestions: number;
  unassignedMediaCount: number;
}

export interface QuizDraft {
  schemaVersion: "1.0.0";
  parserVersion: string;
  title: string;
  sourceType: "PDF" | "DOCX" | "TXT" | "JSON" | "MANUAL_TEXT";
  sections: QuizSectionDraft[];
  mediaAssets: MediaAsset[];
  mediaPlacements: MediaPlacement[];
  warnings: ImportWarning[];
  statistics: ImportStatistics;
  audit?: DocumentParseAudit;
}
