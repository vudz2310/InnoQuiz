import fs from "fs";
import { createServer } from "vite";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
});

const { convertDocumentBlocks } = await server.ssrLoadModule("./src/features/converter/services/converter.service.ts");
const { extractDocxBlocks } = await server.ssrLoadModule("./src/features/converter/extractors/docx.extractor.ts");

console.log("=== INSPECTING OPEN SOURCE PDF ===");
const pdf1Data = new Uint8Array(fs.readFileSync("src/cautruc/Mã nguồn mở HUBT - Update 2025.pdf"));
const pdf1 = await pdfjsLib.getDocument({ data: pdf1Data }).promise;

function buildPageText1(items) {
  let output = "";
  for (const item of items) {
    output += item.str + " ";
    if (item.hasEOL) output += "\n";
  }
  return output.trim();
}

const pdf1Blocks = [];
for (let i = 1; i <= pdf1.numPages; i++) {
  const page = await pdf1.getPage(i);
  const tc = await page.getTextContent();
  const text = buildPageText1(tc.items.filter((it) => "str" in it));
  if (text) {
    pdf1Blocks.push({ type: "TEXT", content: text, order: i, page: i, sourceName: "Mã nguồn mở HUBT - Update 2025.pdf" });
  }
}
const res1 = convertDocumentBlocks(pdf1Blocks, "Mã nguồn mở");
console.log("PDF 1 sections:", res1.normalized.sections.length);
for (const s of res1.normalized.sections) {
  console.log(`  Section ${s.title}: ${s.questions.length} questions`);
}

console.log("\n=== INSPECTING TTNT DOCX ===");
const buf2 = fs.readFileSync("src/cautruc/On-tap-cuoi-ky-TTNT-2026-SV-K30.docx");
const file2 = new File([buf2], "On-tap-cuoi-ky-TTNT-2026-SV-K30.docx");
const blocks2 = await extractDocxBlocks(file2);
const res2 = convertDocumentBlocks(blocks2, "TTNT");
console.log("TTNT questions:", res2.normalized.statistics.totalQuestions);
const q99 = res2.normalized.sections[0]?.questions[98];
console.log("TTNT Q99 stem:", q99?.content);
console.log("TTNT Q99 options:", q99?.options.map(o => `${o.label}: ${o.content}`));

console.log("\n=== INSPECTING JAVA DOCX ===");
const buf3 = fs.readFileSync("src/cautruc/Công Nghệ Java .docx");
const file3 = new File([buf3], "Công Nghệ Java .docx");
const blocks3 = await extractDocxBlocks(file3);
const res3 = convertDocumentBlocks(blocks3, "Java");
console.log("Java sections:", res3.normalized.sections.length);
console.log("Java questions:", res3.normalized.statistics.totalQuestions);
for (const s of res3.normalized.sections) {
  const q94 = s.questions.find(q => q.sourceNumber === 94 || q.content.includes("TinhToan"));
  if (q94) {
    console.log(`=== JAVA Q94 (${s.title}) ===`);
    console.log("Content:", q94.content);
    console.log("Segments:", q94.contentSegments);
    console.log("Options:", q94.options.map(o => `${o.label}: "${o.content}" (correct=${o.isCorrect})`));
  }
}

await server.close();
