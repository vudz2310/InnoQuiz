import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const {
    sanitizeControlCharacters,
    normalizeDocumentText,
    normalizeTextFragment,
  } = await server.ssrLoadModule("/src/features/converter/normalizers/text.normalizer.ts");

  console.log("--- Running Unit Tests for Text Normalizer ---");

  // 1. Sanitize control characters
  assert.equal(sanitizeControlCharacters("TA\u0000( 1,1 )"), "TA( 1,1 )");
  assert.equal(sanitizeControlCharacters("Hello\u0000\u0008\u001FWorld"), "HelloWorld");
  assert.equal(sanitizeControlCharacters("Line 1\nLine 2\tTab"), "Line 1\nLine 2\tTab");

  // 2. Technical token preservation in normalizeTextFragment
  assert.equal(normalizeTextFragment("TA\u0000( 1,1 )"), "TA( 1,1 )");
  assert.equal(normalizeTextFragment("System.out"), "System.out");
  assert.equal(normalizeTextFragment("Java."), "Java.");
  assert.equal(normalizeTextFragment("mọi việc."), "mọi việc.");
  assert.equal(normalizeTextFragment("internet"), "internet");
  assert.equal(normalizeTextFragment("K30-2026"), "K30-2026");
  assert.equal(
    normalizeTextFragment("OpenOffice PowerPoint Update"),
    "OpenOffice PowerPoint Update"
  );
  assert.equal(normalizeTextFragment("test_size=0.2"), "test_size=0.2");
  assert.equal(normalizeTextFragment("java.sql.Connection"), "java.sql.Connection");

  // 3. Test bất biến: normalize(normalize(input)) === normalize(input)
  const samples = [
    "System.out",
    "Java.",
    "mọi việc.",
    "internet",
    "K30-2026",
    "OpenOffice PowerPoint Update",
    "Câu 1. Trong lĩnh vực Trí tuệ nhân tạo, định nghĩa nào sau đây phản ánh đúng nhất về bản chất của TTNT?",
  ];
  for (const s of samples) {
    const once = normalizeTextFragment(s);
    const twice = normalizeTextFragment(once);
    assert.equal(twice, once, `Idempotence failed for: ${s}`);
  }

  console.log("All text normalizer unit tests passed successfully!");
} finally {
  await server.close();
}
