import fs from "fs";
import assert from "assert";
import { createServer } from "vite";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
});

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error("    ", err.message);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error("    ", err.message);
    failed++;
  }
}

try {
  console.log("\n========================================================");
  console.log("SUITE 1: UNIT TESTS - NORMALIZER & OPTION DETECTOR");
  console.log("========================================================");

  const {
    sanitizeControlCharacters,
    normalizeTextFragment,
  } = await server.ssrLoadModule("/src/features/converter/normalizers/text.normalizer.ts");

  const {
    cleanQuestionText,
    cleanAnswerText,
    isIgnorableMetaLine,
  } = await server.ssrLoadModule("/src/utils/parsers/textNormalizer.ts");

  const {
    convertDocumentBlocks,
    convertText,
    detectDuplicateSections,
  } = await server.ssrLoadModule("/src/features/converter/services/converter.service.ts");

  const {
    extractDocxBlocks,
  } = await server.ssrLoadModule("/src/features/converter/extractors/docx.extractor.ts");

  it("Sanitizes null bytes and control chars without mangling text", () => {
    assert.strictEqual(sanitizeControlCharacters("TA\u0000( 1,1 )"), "TA( 1,1 )");
    assert.strictEqual(sanitizeControlCharacters("Câu 1\u0000"), "Câu 1");
  });

  it("Preserves technical tokens and prevents splitting inside words", () => {
    assert.strictEqual(normalizeTextFragment("System.out"), "System.out");
    assert.strictEqual(normalizeTextFragment("Java."), "Java.");
    assert.strictEqual(normalizeTextFragment("mọi việc."), "mọi việc.");
    assert.strictEqual(normalizeTextFragment("internet"), "internet");
    assert.strictEqual(normalizeTextFragment("K30-2026"), "K30-2026");
    assert.strictEqual(normalizeTextFragment("test_size=0.2"), "test_size=0.2");
    assert.strictEqual(normalizeTextFragment("OpenOffice PowerPoint Update"), "OpenOffice PowerPoint Update");
  });

  it("Normalization is idempotent: normalize(normalize(x)) === normalize(x)", () => {
    const sample = "Phần mềm OpenOffice dùng trong công việc hàng ngày với System.out và java.sql.";
    assert.strictEqual(normalizeTextFragment(normalizeTextFragment(sample)), normalizeTextFragment(sample));
  });

  it("Does not treat questions starting with 'Một...' as ignorable metadata", () => {
    const q68 = "Câu 68.  Một hệ chuyên gia hoạt động lâu dài trong thực tế cần thường xuyên cập nhật luật";
    const q78 = "Câu 78.  Một thuật toán xử lý ảnh số cần tổng hợp hình ảnh từ hai camera hồng ngoại A";
    const q107 = "Câu 107.  Một hệ thống phân tích chi tiêu có dữ liệu: 120,140,135,130,5200.";
    assert.strictEqual(isIgnorableMetaLine(q68), false);
    assert.strictEqual(isIgnorableMetaLine(q78), false);
    assert.strictEqual(isIgnorableMetaLine(q107), false);

    assert.strictEqual(cleanQuestionText(q68.replace(/^Câu \d+\.\s*/, "")).length > 20, true);
  });

  it("Correctly identifies EduQuiz metadata line as ignorable when not in state-machine", () => {
    assert.strictEqual(isIgnorableMetaLine("Câu 1 (Một đáp án)"), true);
    assert.strictEqual(isIgnorableMetaLine("Câu 169 (Nhiều đáp án)"), true);
  });

  console.log("\n========================================================");
  console.log("SUITE 2: EDUQUIZ PARSER UNIT TEST");
  console.log("========================================================");

  it("EduQuiz encoded format parses into exactly 1 question, 2 options, correct key", () => {
    const raw = `Câu 1 (Một đáp án)
Câu 1: HA(1)=“Nội dung câu hỏi mẫu”
TA(1,1)=“Phương án A”
*TA(1,2)=“Phương án B”`;

    const res = convertText(raw);
    const questions = res.normalized.sections[0]?.questions || [];
    assert.strictEqual(questions.length, 1);
    const q = questions[0];
    assert.strictEqual(q.content, "Nội dung câu hỏi mẫu");
    assert.strictEqual(q.options.length, 2);
    assert.strictEqual(q.options[0].label, "A");
    assert.strictEqual(q.options[0].isCorrect, false);
    assert.strictEqual(q.options[1].label, "B");
    assert.strictEqual(q.options[1].isCorrect, true);
    assert.strictEqual(q.answerDetected, true);
  });

  it("EduQuiz generalized format (HB/TB, HC/TC) parses with null bytes", () => {
    const raw = `Câu 2 (Một đáp án)
Câu 2: HB\u0000(5)=“Nội dung câu hỏi B”
TB(5,1)=“Phương án B1”
TB(5,2)=“Phương án B2”
*TB(5,3)=“Phương án B3”`;

    const res = convertText(raw);
    const questions = res.normalized.sections[0]?.questions || [];
    assert.strictEqual(questions.length, 1);
    const q = questions[0];
    assert.strictEqual(q.content, "Nội dung câu hỏi B");
    assert.strictEqual(q.options.length, 3);
    assert.strictEqual(q.options[2].label, "C");
    assert.strictEqual(q.options[2].isCorrect, true);
  });

  console.log("\n========================================================");
  console.log("SUITE 3: GOLDEN TEST - On-tap-cuoi-ky-TTNT-2026-SV-K30.docx");
  console.log("========================================================");

  await itAsync("TTNT docx: Exactly 141 questions, Q99 has 4 options, all 141 waiting for answers", async () => {
    const buf = fs.readFileSync("src/cautruc/On-tap-cuoi-ky-TTNT-2026-SV-K30.docx");
    const file = new File([buf], "On-tap-cuoi-ky-TTNT-2026-SV-K30.docx");
    const blocks = await extractDocxBlocks(file);
    const res = convertDocumentBlocks(blocks, "TTNT");

    const total = res.normalized.statistics.totalQuestions;
    assert.strictEqual(total, 141, `Expected 141 questions, got ${total}`);

    // Title banner detection: title is NOT Question 1
    assert.strictEqual(res.normalized.title.includes("TTNT K30-2026"), true);

    const questions = res.normalized.sections[0]?.questions || [];
    assert.strictEqual(questions.length, 141);

    // Q1 content check
    assert.strictEqual(questions[0].content.includes("định nghĩa nào sau đây phản ánh đúng nhất"), true);
    assert.strictEqual(questions[0].options.length, 4);

    // Q99 unlabeled options check
    const q99 = questions[98];
    assert.strictEqual(q99.content.includes("Phương sai và độ lệch chuẩn"), true);
    assert.strictEqual(q99.options.length, 4, `Expected 4 options for Q99, got ${q99.options.length}`);

    // Q141 content check
    const q141 = questions[140];
    assert.strictEqual(q141.content.includes("train_test_split"), true);
    assert.strictEqual(q141.options.length, 4);

    // No answer keys in source -> all valid questions marked waiting for answer
    const waiting = res.normalized.statistics.waitingAnswerQuestions;
    assert.strictEqual(waiting, 141, `Expected 141 waiting answer questions, got ${waiting}`);
    assert.strictEqual(res.normalized.statistics.invalidQuestions, 0);
  });

  console.log("\n========================================================");
  console.log("SUITE 4: GOLDEN TEST - Công Nghệ Java .docx");
  console.log("========================================================");

  await itAsync("Java docx: System.out preserved, 5 sections detected, duplicate sections identified", async () => {
    const buf = fs.readFileSync("src/cautruc/Công Nghệ Java .docx");
    const file = new File([buf], "Công Nghệ Java .docx");
    const blocks = await extractDocxBlocks(file);
    const res = convertDocumentBlocks(blocks, "Công Nghệ Java");

    // Sections check: exactly 5 section headers
    assert.strictEqual(res.normalized.sections.length, 5);
    assert.strictEqual(res.normalized.sections[0].title.includes("Phần 1: 45 câu"), true);
    assert.strictEqual(res.normalized.sections[0].questions.length, 45, `Expected 45 questions in Section 1, got ${res.normalized.sections[0].questions.length}`);

    // Q1 check: unnumbered Question 1 with System.out intact
    const q1 = res.normalized.sections[0].questions[0];
    assert.strictEqual(q1.content, "Lớp System.out dùng để ?");
    assert.strictEqual(q1.options.length, 4);
    assert.strictEqual(q1.options[0].isCorrect, true);

    // Q94 check: Code block preservation, exactly 4 options (A-D), A is correct, no E-H
    const allJavaQuestions = res.normalized.sections.flatMap((s) => s.questions);
    const q94 = allJavaQuestions.find((q) => q.sourceNumber === 94 || q.content.includes("TinhToan"));
    assert.strictEqual(Boolean(q94), true, "Question 94 must be found");
    assert.strictEqual(q94.options.length, 4, `Expected exactly 4 options for Q94, got ${q94.options.length}`);
    assert.strictEqual(q94.options[0].label, "A");
    assert.strictEqual(q94.options[0].isCorrect, null); // Unlabeled options in Part 2, missing answer keys until merged
    assert.strictEqual(q94.answerStatus, "MISSING");
    assert.strictEqual(q94.options[0].content, "Báo lỗi");
    assert.strictEqual(q94.options[1].label, "B");
    assert.strictEqual(q94.options[1].content, "6");
    assert.strictEqual(q94.options[2].label, "C");
    assert.strictEqual(q94.options[2].content, "S=6");
    assert.strictEqual(q94.options[3].label, "D");
    assert.strictEqual(q94.options[3].content, "Không có kết quả nào đơợc in ra");

    // Segments check: 1 Text segment + 1 Code segment
    assert.strictEqual(q94.contentSegments.length, 2);
    assert.strictEqual(q94.contentSegments[0].type, "TEXT");
    assert.strictEqual(q94.contentSegments[0].normalizedContent, "Khi chạy, chương trình sau cho kết quả nào?");
    assert.strictEqual(q94.contentSegments[1].type, "CODE");
    assert.strictEqual(q94.contentSegments[1].normalizedContent.includes("public class TinhToan"), true);
    assert.strictEqual(q94.contentSegments[1].normalizedContent.includes("System.out.println(S=+s);"), true);

    // Duplicate section detection
    const dupes = res.normalized.duplicateSections || [];
    assert.strictEqual(dupes.length > 0, true);
    const part2Dupe = dupes.find((d) => d.firstTitle.includes("Phần 2") && d.secondTitle.includes("Phần 2"));
    assert.strictEqual(Boolean(part2Dupe), true, "Duplicate Part 2 must be detected");
    assert.strictEqual(part2Dupe.canMergeAnswers, true);

    assert.strictEqual(res.normalized.statistics.invalidQuestions, 0);
  });

  console.log("\n========================================================");
  console.log("SUITE 5: GOLDEN TEST - Mã nguồn mở HUBT - Update 2025.pdf");
  console.log("========================================================");

  await itAsync("PDF: Exactly 2 sections, 261 total questions (90 Part 1, 171 Part 2), no >500 questions", async () => {
    const pdfData = new Uint8Array(fs.readFileSync("src/cautruc/Mã nguồn mở HUBT - Update 2025.pdf"));
    const pdfLoading = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await pdfLoading.promise;

    function buildPageText(items) {
      let output = "";
      let lastY = null;
      let lastX = null;
      let lastWidth = 0;
      for (const item of items) {
        const currentX = item.transform[4] || 0;
        const currentY = item.transform[5] || 0;
        const isNewLine = lastY !== null && Math.abs(currentY - lastY) > 5;
        if (isNewLine && !output.endsWith("\n")) output += "\n";
        if (!isNewLine && lastX !== null) {
          const gap = currentX - (lastX + lastWidth);
          if (gap > 2.5 && !output.endsWith(" ") && !output.endsWith("\n") && !item.str.startsWith(" ")) {
            output += " ";
          }
        }
        output += item.str;
        if (item.hasEOL && !output.endsWith("\n")) output += "\n";
        lastX = currentX;
        lastY = currentY;
        lastWidth = item.width || 0;
      }
      return output.trim();
    }

    const pdfBlocks = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const text = buildPageText(tc.items.filter((it) => "str" in it));
      if (text) {
        pdfBlocks.push({ type: "TEXT", content: text, order: i, page: i, sourceName: "test.pdf" });
      }
    }

    const res = convertDocumentBlocks(pdfBlocks, "Mã nguồn mở HUBT");

    assert.strictEqual(res.normalized.sections.length, 2, `Expected 2 sections, got ${res.normalized.sections.length}`);
    const sec1Count = res.normalized.sections[0].questions.length;
    const sec2Count = res.normalized.sections[1].questions.length;

    assert.strictEqual(sec1Count, 90, `Expected 90 questions in Part 1, got ${sec1Count}`);
    assert.strictEqual(sec2Count, 171, `Expected 171 questions in Part 2, got ${sec2Count}`);
    assert.strictEqual(res.normalized.statistics.totalQuestions, 261, `Expected 261 total questions, got ${res.normalized.statistics.totalQuestions}`);

    // Verify correct answers detected
    const sec1Q1 = res.normalized.sections[0].questions[0];
    assert.strictEqual(sec1Q1.options[3].isCorrect, true); // D is correct
    assert.strictEqual(sec1Q1.answerDetected, true);

    const sec2Q1 = res.normalized.sections[1].questions[0];
    assert.strictEqual(sec2Q1.options[3].isCorrect, true); // D* is correct
    assert.strictEqual(sec2Q1.answerDetected, true);

    assert.strictEqual(res.normalized.statistics.invalidQuestions, 0);
  });

  console.log("\n========================================================");
  console.log("SUITE 6: GOLDEN TEST - Quản trị mạng - có ảnh.pdf");
  console.log("========================================================");

  await itAsync("PDF: Exactly 8 sections, 462 questions, preamble/header ignored", async () => {
    const pdfData = new Uint8Array(fs.readFileSync("src/cautruc/Quản trị mạng - có ảnh.pdf"));
    const pdfLoading = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await pdfLoading.promise;

    function buildPageText(items) {
      let output = "";
      let lastY = null;
      let lastX = null;
      let lastWidth = 0;
      for (const item of items) {
        const currentX = item.transform[4] || 0;
        const currentY = item.transform[5] || 0;
        const isNewLine = lastY !== null && Math.abs(currentY - lastY) > 5;
        if (isNewLine && !output.endsWith("\n")) output += "\n";
        if (!isNewLine && lastX !== null) {
          const gap = currentX - (lastX + lastWidth);
          if (gap > 2.5 && !output.endsWith(" ") && !output.endsWith("\n") && !item.str.startsWith(" ")) {
            output += " ";
          }
        }
        output += item.str;
        if (item.hasEOL && !output.endsWith("\n")) output += "\n";
        lastX = currentX;
        lastY = currentY;
        lastWidth = item.width || 0;
      }
      return output.trim();
    }

    const pdfBlocks = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const text = buildPageText(tc.items.filter((it) => "str" in it));
      if (text) {
        pdfBlocks.push({ type: "TEXT", content: text, order: i, page: i, sourceName: "Quản trị mạng - có ảnh.pdf" });
      }
    }

    const res = convertDocumentBlocks(pdfBlocks, "Quản trị mạng");

    assert.strictEqual(res.normalized.sections.length, 8, `Expected 8 sections, got ${res.normalized.sections.length}`);
    assert.strictEqual(res.normalized.statistics.totalQuestions, 462, `Expected 462 total questions, got ${res.normalized.statistics.totalQuestions}`);

    const secTitles = res.normalized.sections.map((s) => s.title);
    assert.strictEqual(secTitles[0], "Phần 1");
    assert.strictEqual(secTitles[1], "Phần 2");
    assert.strictEqual(secTitles[2], "Phần 3");
    assert.strictEqual(secTitles[3], "Phần 4");
    assert.strictEqual(secTitles[4], "Phần 5");
    assert.strictEqual(secTitles[5], "Phần MMT 1");
    assert.strictEqual(secTitles[6], "Phần MMT 2");
    assert.strictEqual(secTitles[7], "Phần MMT 3");

    // Check Question 1 of Section 1
    const q1 = res.normalized.sections[0].questions[0];
    assert.strictEqual(q1.content, "Mô hình tường lửa ISA là viết tắt của?");
    assert.strictEqual(q1.options.length, 4);
    assert.strictEqual(q1.options[2].isCorrect, true); // C is correct

    assert.strictEqual(res.normalized.statistics.invalidQuestions, 0);
  });

  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
} finally {
  await server.close();
}
