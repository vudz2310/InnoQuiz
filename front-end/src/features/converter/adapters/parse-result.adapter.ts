import type { ParseResult } from "../../../utils/questionParser";
import type { QuestionDraft } from "../../../types/quiz.types";
import type { ConverterResult, NormalizedMedia } from "../types/converter.types";

function toDraftMedia(media: NormalizedMedia) {
  return {
    tempId: media.tempId,
    type: media.type,
    assetId: media.assetId,
    order: media.order,
    originalName: media.originalName,
    mimeType: media.mimeType,
    dataUrl: media.dataUrl,
    url: media.url,
    width: media.width,
    height: media.height,
    confidence: media.confidence,
    source: media.source,
  };
}

export function converterResultToParseResult(result: ConverterResult): ParseResult {
  const sections = result.normalized.sections.map((section) => ({
    tempId: section.tempId,
    title: section.title,
    order: section.order,
    questions: section.questions.map((question): QuestionDraft => ({
      tempId: question.tempId,
      content: question.content,
      contentSegments: question.contentSegments,
      type: question.type,
      points: question.points,
      order: question.order,
      media: question.media.map(toDraftMedia),
      answers: question.options.map((option, index) => ({
        id: option.id,
        content: option.content,
        isCorrect: option.isCorrect,
        order: index + 1,
        media: option.media.map(toDraftMedia),
      })),
    })),
  }));
  const questions = sections.flatMap((section) => section.questions);

  return {
    success: questions.length > 0,
    sections,
    questions,
    errors: result.normalized.warnings.map((warning) => warning.message),
    totalParsed: result.normalized.statistics.totalQuestions,
    validCount: result.normalized.statistics.validQuestions,
    warningCount:
      result.normalized.statistics.needsReviewQuestions +
      result.normalized.statistics.invalidQuestions +
      result.normalized.warnings.length,
    normalized: result.normalized,
    blocks: result.blocks,
  };
}
