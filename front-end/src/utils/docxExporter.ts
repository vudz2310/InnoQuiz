import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import saveAs from "file-saver";
import type { QuestionDraft } from "../types/quiz.types";
import type { ImportedSection, QuizSectionDraft } from "../types/quiz-section.types";

/**
 * Xuất danh sách câu hỏi ra tệp Word (.docx) chuẩn A B C D theo từng phần
 */
export async function exportQuestionsToDocx(
  input: QuestionDraft[] | ImportedSection[] | QuizSectionDraft[],
  title: string = "Đề thi trắc nghiệm HUBT"
): Promise<void> {
  const isSectionList = Array.isArray(input) && input.length > 0 && "questions" in input[0];

  const sectionsData: { title: string; questions: QuestionDraft[] }[] = isSectionList
    ? (input as (ImportedSection | QuizSectionDraft)[]).map((s) => ({
        title: s.title,
        questions: s.questions,
      }))
    : [{ title: "", questions: input as QuestionDraft[] }];

  const totalQ = sectionsData.reduce((acc, s) => acc + s.questions.length, 0);

  const children: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tổng số câu hỏi: ${totalQ} câu${sectionsData.length > 1 ? ` (${sectionsData.length} phần)` : ""}`,
          italics: true,
          color: "666666",
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  sectionsData.forEach((sec) => {
    if (sec.title) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sec.title.toUpperCase(),
              bold: true,
              size: 28,
              color: "1E40AF", // Blue-800
            }),
          ],
          spacing: { before: 300, after: 200 },
        })
      );
    }

    sec.questions.forEach((q, idx) => {
      // 1. Tiêu đề câu hỏi (reset số thứ tự 1..N theo Section)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Câu ${idx + 1}: `,
              bold: true,
              color: "1E3A8A", // Blue-900
            }),
            new TextRun({
              text: q.content,
              bold: true,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );

      // 2. Danh sách các lựa chọn A, B, C, D
      q.answers.forEach((ans, aIdx) => {
        const letter = String.fromCharCode(65 + aIdx);
        const isCorrect = ans.isCorrect === true;

        children.push(
          new Paragraph({
            children: [
              ...(isCorrect
                ? [
                    new TextRun({
                      text: "* ",
                      bold: true,
                      color: "DC2626", // Red-600
                    }),
                  ]
                : [
                    new TextRun({
                      text: "  ",
                    }),
                  ]),
              new TextRun({
                text: `${letter}. `,
                bold: isCorrect,
                color: isCorrect ? "DC2626" : "333333",
              }),
              new TextRun({
                text: ans.content,
                bold: isCorrect,
                color: isCorrect ? "DC2626" : "000000",
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 50 },
          })
        );
      });

      // 3. Dòng đáp án tóm tắt
      const correctLetters = q.answers
        .map((a, aIdx) => (a.isCorrect ? String.fromCharCode(65 + aIdx) : null))
        .filter(Boolean)
        .join(", ");

      if (correctLetters) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `=> Đáp án đúng: `,
                italics: true,
                color: "16A34A", // Green-600
              }),
              new TextRun({
                text: correctLetters,
                bold: true,
                color: "DC2626", // Red-600
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 200 },
          })
        );
      }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[\/\\?%*:|"<>]/g, "_")}.docx`);
}

/**
 * Xuất danh sách câu hỏi ra tệp JSON chuẩn (hỗ trợ cả format sections và flat)
 */
export function exportQuestionsToJson(
  input: QuestionDraft[] | ImportedSection[] | QuizSectionDraft[],
  title: string = "quiz_data"
): void {
  const isSectionList = Array.isArray(input) && input.length > 0 && "questions" in input[0];
  const payload = isSectionList ? { sections: input } : { questions: input };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  saveAs(blob, `${title.replace(/[\/\\?%*:|"<>]/g, "_")}.json`);
}

/**
 * Chuyển danh sách câu hỏi / phần thành chuỗi văn bản thuần chuẩn A. B. C. D.
 */
export function formatQuestionsToStandardText(
  input: QuestionDraft[] | ImportedSection[] | QuizSectionDraft[]
): string {
  const isSectionList = Array.isArray(input) && input.length > 0 && "questions" in input[0];

  const sectionsData: { title: string; questions: QuestionDraft[] }[] = isSectionList
    ? (input as (ImportedSection | QuizSectionDraft)[]).map((s) => ({
        title: s.title,
        questions: s.questions,
      }))
    : [{ title: "", questions: input as QuestionDraft[] }];

  return sectionsData
    .map((sec) => {
      let secText = sec.title ? `${sec.title}\n\n` : "";
      const questionsText = sec.questions
        .map((q, idx) => {
          let result = `Câu ${idx + 1}: ${q.content}\n`;
          if (q.media && q.media.length > 0) {
            result += `{ảnh}\n`;
          }
          let correctKey = "";

          q.answers.forEach((ans, aIdx) => {
            const letter = String.fromCharCode(65 + aIdx);
            if (ans.isCorrect) {
              result += `*${letter}. ${ans.content}\n`;
              correctKey = letter;
            } else {
              result += `${letter}. ${ans.content}\n`;
            }
            if (ans.media && ans.media.length > 0) {
              result += `{ảnh}\n`;
            }
          });

          if (correctKey) {
            result += `Đáp án: ${correctKey}\n`;
          }

          return result;
        })
        .join("\n");

      return secText + questionsText;
    })
    .join("\n\n");
}
