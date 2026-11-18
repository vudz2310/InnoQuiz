import { prisma } from "../config/DB.js";

async function main() {
  const answersData = {
    "Hook nào dùng để quản lý state trong Functional Component?": [
      { content: "useState", isCorrect: true, order: 1 },
      { content: "useEffect", isCorrect: false, order: 2 },
      { content: "useReducer", isCorrect: false, order: 3 },
      { content: "useCallback", isCorrect: false, order: 4 },
    ],
    "useEffect được kích hoạt khi nào nếu dependency array rỗng []?": [
      { content: "Chỉ khi component mount lần đầu", isCorrect: true, order: 1 },
      { content: "Mỗi lần re-render", isCorrect: false, order: 2 },
      { content: "Khi state thay đổi", isCorrect: false, order: 3 },
      { content: "Khi props thay đổi", isCorrect: false, order: 4 },
    ],
    "Props trong React có thể bị sửa đổi trực tiếp từ Component con không?": [
      { content: "Không, props là read-only (immutable)", isCorrect: true, order: 1 },
      { content: "Có, bằng cách dùng this.props", isCorrect: false, order: 2 },
      { content: "Có, với useState", isCorrect: false, order: 3 },
      { content: "Tùy thuộc vào loại Component", isCorrect: false, order: 4 },
    ],
    "Kết quả của typeof NaN trong JavaScript là gì?": [
      { content: "number", isCorrect: true, order: 1 },
      { content: "nan", isCorrect: false, order: 2 },
      { content: "undefined", isCorrect: false, order: 3 },
      { content: "string", isCorrect: false, order: 4 },
    ],
    "Async/Await bản chất hoạt động dựa trên cơ chế nào?": [
      { content: "Promise", isCorrect: true, order: 1 },
      { content: "Callback", isCorrect: false, order: 2 },
      { content: "Event Loop", isCorrect: false, order: 3 },
      { content: "Thread", isCorrect: false, order: 4 },
    ],
    "INNER JOIN khác gì so với LEFT JOIN?": [
      { content: "INNER JOIN chỉ lấy dòng khớp ở cả 2 bảng, LEFT JOIN lấy tất cả dòng bảng trái", isCorrect: true, order: 1 },
      { content: "INNER JOIN nhanh hơn LEFT JOIN", isCorrect: false, order: 2 },
      { content: "LEFT JOIN chỉ hoạt động với 2 bảng", isCorrect: false, order: 3 },
      { content: "Không có sự khác biệt", isCorrect: false, order: 4 },
    ],
    "Thuộc tính ACID trong Transaction gồm những gì?": [
      { content: "Atomicity, Consistency, Isolation, Durability", isCorrect: true, order: 1 },
      { content: "Availability, Consistency, Isolation, Durability", isCorrect: false, order: 2 },
      { content: "Atomicity, Concurrency, Integrity, Durability", isCorrect: false, order: 3 },
      { content: "Atomicity, Consistency, Independence, Data", isCorrect: false, order: 4 },
    ],
    "Định thức của ma trận đơn vị cấp n bằng bao nhiêu?": [
      { content: "1", isCorrect: true, order: 1 },
      { content: "0", isCorrect: false, order: 2 },
      { content: "n", isCorrect: false, order: 3 },
      { content: "-1", isCorrect: false, order: 4 },
    ],
  };

  const questions = await prisma.question.findMany({ include: { answers: true } });
  let added = 0;
  for (const q of questions) {
    if (q.answers.length === 0 && answersData[q.content]) {
      for (const ans of answersData[q.content]) {
        await prisma.answer.create({ data: { questionId: q.id, ...ans } });
        added++;
      }
    }
  }
  console.log("Added " + added + " answers to questions");
  
  // Also add a generic answer if no mapping found
  const questionsWithNoAnswers = await prisma.question.findMany({ 
    where: { answers: { none: {} } }
  });
  for (const q of questionsWithNoAnswers) {
    await prisma.answer.createMany({
      data: [
        { questionId: q.id, content: "Đáp án A", isCorrect: true, order: 1 },
        { questionId: q.id, content: "Đáp án B", isCorrect: false, order: 2 },
        { questionId: q.id, content: "Đáp án C", isCorrect: false, order: 3 },
        { questionId: q.id, content: "Đáp án D", isCorrect: false, order: 4 },
      ]
    });
    console.log("Added generic answers for:", q.content.substring(0, 50));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
