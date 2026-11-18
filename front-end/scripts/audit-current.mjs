import fs from "fs";
import { createServer } from "vite";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
});

const { convertDocumentBlocks } = await server.ssrLoadModule("./src/features/converter/services/converter.service.ts");

const pdfData = new Uint8Array(fs.readFileSync("src/cautruc/Quản trị mạng - có ảnh.pdf"));
const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

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

console.log("=== AUDIT SUMMARY BEFORE REFACTOR ===");
let totalExtraOptions = 0;
let totalMissingOptions = 0;
let totalMultipleCorrect = 0;
let suspiciousOptions = 0;

for (const sec of res.normalized.sections) {
  for (const q of sec.questions) {
    const optLabels = q.options.map(o => o.label);
    const correctCount = q.options.filter(o => o.isCorrect === true).length;
    
    // Check if extra options (e.g. E, F, G...)
    const hasExtra = q.options.length > 4 || optLabels.some(l => !["A", "B", "C", "D"].includes(l));
    if (hasExtra) {
      totalExtraOptions++;
      console.log(`[EXTRA OPTS] ${sec.title} - Q${q.order} (source: ${q.sourceNumber}): ${q.options.length} options: [${optLabels.join(", ")}] Content snippet: "${q.content.slice(0, 60)}..."`);
      for (const opt of q.options) {
        console.log(`    ${opt.label}: "${opt.content}"`);
      }
    }

    if (correctCount > 1) {
      totalMultipleCorrect++;
      console.log(`[MULTI CORRECT] ${sec.title} - Q${q.order}: ${correctCount} correct options`);
    }

    // Check suspicious short fragments
    for (const opt of q.options) {
      if (opt.content.length < 20 && !/^(đúng|sai|true|false|\d+|\w)$/i.test(opt.content.trim())) {
        suspiciousOptions++;
      }
    }
  }
}

console.log(`\nTotal questions: ${res.normalized.statistics.totalQuestions}`);
console.log(`Total questions with extra options (>4 or non A-D): ${totalExtraOptions}`);
console.log(`Total questions with multiple correct: ${totalMultipleCorrect}`);
console.log(`Total suspicious short fragments: ${suspiciousOptions}`);

console.log("\n=== INSPECTING SPECIFIC MENTIONED QUESTIONS ===");
for (const s of res.normalized.sections) {
  for (const q of s.questions) {
    if (q.content.toLowerCase().includes("dhcp") || q.content.toLowerCase().includes("lease") || q.sourceNumber === 17 || q.sourceNumber === 37) {
      if (q.options.length > 4 || q.options.some(o => o.content.toLowerCase().includes("lease") || o.content.toLowerCase().includes("địa chỉ ip cho mình"))) {
        console.log(`=== FOUND: ${s.title} - Q${q.order} (source: ${q.sourceNumber}) ===`);
        console.log("Stem:", q.content);
        console.log("Options count:", q.options.length);
        q.options.forEach(o => console.log(`  ${o.label} (correct=${o.isCorrect}): ${o.content}`));
      }
    }
  }
}
for (const s of res.normalized.sections) {
  if (s.title === "Phần 4") {
    const q32 = s.questions[31];
    console.log("=== PHAN 4 Q32 ===");
    console.log("Stem:", q32.content);
    console.log("Options count:", q32.options.length);
    q32.options.forEach(o => console.log(`  ${o.label}: "${o.content}"`));
    console.log("Source markers:", q32.sourceOptionMarkers);
  }
}

await server.close();
