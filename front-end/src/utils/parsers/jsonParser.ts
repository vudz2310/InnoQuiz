import type {
  AnswerDraft,
  QuestionDraft,
  QuestionType,
} from "../../types/quiz.types";
import type { ImportedSection } from "../../types/quiz-section.types";
import type { ParseResult } from "../questionParser";
import { getErrorMessage } from "../errorMessage";
import { cleanAnswerText, cleanQuestionText } from "./textNormalizer";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const getPoints = (value: unknown): number => {
  const points = typeof value === "number" || typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(points) && points > 0 ? points : 1;
};

const parseAnswers = (value: unknown): AnswerDraft[] => {
  const rawAnswers = Array.isArray(value) ? value : [];

  return rawAnswers.map((answer, answerIndex) => {
    const answerRecord = isRecord(answer) ? answer : undefined;
    const content = getString(
      typeof answer === "string" ? answer : answerRecord?.content,
      `Đáp án ${answerIndex + 1}`,
    );

    return {
      content: cleanAnswerText(content),
      isCorrect: answerRecord ? Boolean(answerRecord.isCorrect) : answerIndex === 0,
      order: answerIndex + 1,
    };
  });
};

const parseQuestion = (
  value: unknown,
  questionIndex: number,
  sectionIndex: number,
): QuestionDraft => {
  const question = isRecord(value) ? value : {};
  const answers = parseAnswers(question.answers);

  if (answers.length > 0 && !answers.some((answer) => answer.isCorrect)) {
    answers[0].isCorrect = true;
  }

  return {
    tempId: `q-${sectionIndex + 1}-${questionIndex + 1}`,
    content: cleanQuestionText(
      getString(question.content, `Câu hỏi ${questionIndex + 1}`),
    ),
    type: (question.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE") as QuestionType,
    points: getPoints(question.points),
    order: questionIndex + 1,
    answers,
  };
};

/** Phân tích JSON có cấu trúc sections hoặc danh sách câu hỏi phẳng. */
export function parseJsonQuestions(jsonStr: string): ParseResult {
  try {
    const data: unknown = JSON.parse(jsonStr);
    const errors: string[] = [];
    const dataRecord = isRecord(data) ? data : undefined;
    const rawSections = dataRecord?.sections;

    if (Array.isArray(rawSections)) {
      const parsedSections: ImportedSection[] = rawSections.map((section, sectionIndex) => {
        const sectionRecord = isRecord(section) ? section : {};
        const rawQuestions = sectionRecord.questions;
        const questions = Array.isArray(rawQuestions)
          ? rawQuestions.map((question, questionIndex) =>
              parseQuestion(question, questionIndex, sectionIndex),
            )
          : [];

        return {
          tempId: `sec-${sectionIndex + 1}`,
          title: getString(sectionRecord.title, `Phần ${sectionIndex + 1}`),
          description:
            typeof sectionRecord.description === "string"
              ? sectionRecord.description
              : undefined,
          order: sectionIndex + 1,
          questions,
        };
      });

      const flattenedQuestions = parsedSections.flatMap((section) => section.questions);

      return {
        success: flattenedQuestions.length > 0,
        sections: parsedSections,
        questions: flattenedQuestions,
        errors,
        totalParsed: flattenedQuestions.length,
        validCount: flattenedQuestions.length,
        warningCount: 0,
      };
    }

    const list = Array.isArray(data)
      ? data
      : Array.isArray(dataRecord?.questions)
        ? dataRecord.questions
        : [];

    if (list.length === 0) {
      return {
        success: false,
        sections: [],
        questions: [],
        errors: ["JSON không chứa danh sách câu hỏi hợp lệ."],
        totalParsed: 0,
        validCount: 0,
        warningCount: 1,
      };
    }

    const flatQuestions = list.map((question, questionIndex) =>
      parseQuestion(question, questionIndex, 0),
    );
    const defaultSection: ImportedSection = {
      tempId: "sec-1",
      title: "Phần mặc định",
      order: 1,
      questions: flatQuestions,
    };

    return {
      success: flatQuestions.length > 0,
      sections: [defaultSection],
      questions: flatQuestions,
      errors,
      totalParsed: flatQuestions.length,
      validCount: flatQuestions.length,
      warningCount: 0,
    };
  } catch (error: unknown) {
    return {
      success: false,
      sections: [],
      questions: [],
      errors: [
        `Lỗi định dạng JSON: ${getErrorMessage(error, "Cú pháp không hợp lệ")}`,
      ],
      totalParsed: 0,
      validCount: 0,
      warningCount: 1,
    };
  }
}
