import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { convertDocumentBlocks, convertText } = await server.ssrLoadModule(
    "/src/features/converter/services/converter.service.ts",
  );

  const missingSpaces = convertText(`Câu1:ViệtNamlàgì?
A.HàNội
B.ĐàNẵng
C.Huế
D.Hồ Chí Minh
Đáp án: A`);
  const missingSpacesQuestion = missingSpaces.normalized.sections[0].questions[0];
  assert.equal(missingSpacesQuestion.order, 1);
  assert.equal(missingSpacesQuestion.options.length, 4);
  assert.equal(missingSpacesQuestion.correctOptionIds.length, 1);
  assert.equal(missingSpacesQuestion.options[0].isCorrect, true);

  const excessiveSpaces = convertText(`Câu 1: Văn bản có khoảng cách.
A. V i ệ t     N a m
B. Đà Nẵng
C. Huế
D. Cần Thơ
Đáp án: A`);
  assert.equal(excessiveSpaces.normalized.sections[0].questions[0].options[0].content, "Việt Nam");

  const sections = convertText(`PHẦN 1: Cơ bản
1. Câu hỏi một?
A. Một    B. Hai    C. Ba    D. Bốn
Answer: A

PHẦN 2: Nâng cao
51. Câu hỏi hai?
A. Một
B. Hai
C. Ba
D. Bốn
Key: C`);
  assert.equal(sections.normalized.sections.length, 2);
  assert.deepEqual(sections.normalized.sections.map((section) => section.questions.map((question) => question.order)), [[1], [1]]);
  assert.equal(sections.normalized.sections[0].questions[0].options.length, 4);
  assert.equal(sections.normalized.sections[1].questions[0].options[2].isCorrect, true);

  const noSections = convertText(`Câu 1: Một câu hỏi.
A. Một
B. Hai
C. Ba
D. Bốn
Đáp án: A
Câu 2: Câu tiếp theo.
A. Một
B. Hai
C. Ba
D. Bốn
Đáp án: B`);
  assert.equal(noSections.normalized.sections.length, 1);
  assert.deepEqual(noSections.normalized.sections[0].questions.map((question) => question.order), [1, 2]);

  const noAnswer = convertText(`Câu 1: Chưa có đáp án?
A. Một
B. Hai
C. Ba
D. Bốn`);
  assert.equal(noAnswer.normalized.sections[0].questions[0].answerDetected, false);
  assert.equal(noAnswer.normalized.sections[0].questions[0].status, "VALID");
  assert.equal(noAnswer.normalized.sections[0].questions[0].answerStatus, "MISSING");
  assert.deepEqual(noAnswer.normalized.sections[0].questions[0].correctOptionIds, []);

  const conflictingAnswer = convertText(`Câu 1: Đáp án xung đột?
*A. Một
B. Hai
C. Ba
D. Bốn
Đáp án: C`);
  assert.equal(conflictingAnswer.normalized.sections[0].questions[0].status, "NEEDS_REVIEW");
  assert.deepEqual(conflictingAnswer.normalized.sections[0].questions[0].correctOptionIds, []);

  const imageBlocks = convertDocumentBlocks([
    { type: "TEXT", content: "Câu 1: Chọn hình đúng.", order: 0 },
    {
      type: "IMAGE",
      order: 1,
      image: { assetId: "question-image", mimeType: "image/png", dataUrl: "data:image/png;base64,AA==", blockIndex: 1, confidence: 0.95 },
    },
    { type: "TEXT", content: "A. Hình A", order: 2 },
    {
      type: "IMAGE",
      order: 3,
      image: { assetId: "option-image", mimeType: "image/png", dataUrl: "data:image/png;base64,AA==", blockIndex: 3, confidence: 0.95 },
    },
    { type: "TEXT", content: "B. Hình B\nC. Hình C\nD. Hình D\nĐáp án: A", order: 4 },
  ]);
  const imageQuestion = imageBlocks.normalized.sections[0].questions[0];
  assert.equal(imageQuestion.media.length, 1);
  assert.equal(imageQuestion.options[0].media.length, 1);

  const uncertainImage = convertDocumentBlocks([
    { type: "TEXT", content: "Câu 1: Câu hỏi có hình.", order: 0 },
    {
      type: "IMAGE",
      order: 1,
      image: { assetId: "uncertain-image", mimeType: "image/png", blockIndex: 1, confidence: 0.3 },
    },
  ]);
  assert.equal(uncertainImage.normalized.unassignedMedia.length, 1);
  assert.equal(uncertainImage.normalized.warnings.some((warning) => warning.code === "UNASSIGNED_IMAGE"), true);

  console.log("converter smoke tests passed");
} finally {
  await server.close();
}
