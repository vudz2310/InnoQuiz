import { prisma } from "../config/DB.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Tạo categories nếu chưa có
  const categoriesData = [
    { name: "Lập trình", slug: "lap-trinh" },
    { name: "Toán học", slug: "toan-hoc" },
    { name: "Tiếng Anh", slug: "tieng-anh" },
    { name: "Khoa học máy tính", slug: "khoa-hoc-may-tinh" },
    { name: "Kinh tế & Quản trị", slug: "kinh-te-quan-tri" },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found to assign quizzes. Skipping quiz seeding.");
    return;
  }

  const lapTrinh = await prisma.category.findUnique({ where: { slug: "lap-trinh" } });
  const toanHoc = await prisma.category.findUnique({ where: { slug: "toan-hoc" } });
  const tiengAnh = await prisma.category.findUnique({ where: { slug: "tieng-anh" } });

  const quizzesData = [
    {
      title: "React cơ bản & Hooks",
      description: "Kiểm tra kiến thức React core, useState, useEffect và Component Lifecycle dành cho người mới bắt đầu.",
      authorId: user.id,
      categoryId: lapTrinh?.id,
      status: "PUBLISHED",
      timeLimit: 30,
      questions: [
        {
          content: "Hook nào dùng để quản lý state trong Functional Component?",
          answers: [
            { content: "useState", isCorrect: true },
            { content: "useEffect", isCorrect: false },
            { content: "useReducer", isCorrect: false },
            { content: "useCallback", isCorrect: false },
          ],
        },
        {
          content: "useEffect được kích hoạt khi nào nếu dependency array rỗng []?",
          answers: [
            { content: "Chỉ khi component mount lần đầu", isCorrect: true },
            { content: "Mỗi lần re-render", isCorrect: false },
            { content: "Khi state thay đổi", isCorrect: false },
            { content: "Khi props thay đổi", isCorrect: false },
          ],
        },
        {
          content: "Props trong React có thể bị sửa đổi trực tiếp từ Component con không?",
          answers: [
            { content: "Không, props là read-only (immutable)", isCorrect: true },
            { content: "Có, bằng cách dùng this.props", isCorrect: false },
            { content: "Có, với useState", isCorrect: false },
            { content: "Tùy thuộc vào loại Component", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "JavaScript ES6+ & Bất đồng bộ",
      description: "Thử thách kiến thức về Promise, Async/Await, Event Loop, Closures và Scope trong JavaScript hiện đại.",
      authorId: user.id,
      categoryId: lapTrinh?.id,
      status: "PUBLISHED",
      timeLimit: 25,
      questions: [
        {
          content: "Kết quả của typeof NaN trong JavaScript là gì?",
          answers: [
            { content: "number", isCorrect: true },
            { content: "nan", isCorrect: false },
            { content: "undefined", isCorrect: false },
            { content: "string", isCorrect: false },
          ],
        },
        {
          content: "Async/Await bản chất hoạt động dựa trên cơ chế nào?",
          answers: [
            { content: "Promise", isCorrect: true },
            { content: "Callback", isCorrect: false },
            { content: "Event Loop", isCorrect: false },
            { content: "Thread", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "Cơ sở dữ liệu & SQL nâng cao",
      description: "Các câu hỏi về Indexing, Transaction ACID, JOIN, và chuẩn hóa dữ liệu quan hệ.",
      authorId: user.id,
      categoryId: lapTrinh?.id,
      status: "PUBLISHED",
      timeLimit: 40,
      questions: [
        {
          content: "INNER JOIN khác gì so với LEFT JOIN?",
          answers: [
            { content: "INNER JOIN chỉ lấy dòng khớp ở cả 2 bảng, LEFT JOIN lấy tất cả dòng bảng trái", isCorrect: true },
            { content: "INNER JOIN nhanh hơn LEFT JOIN", isCorrect: false },
            { content: "LEFT JOIN chỉ hoạt động với 2 bảng", isCorrect: false },
            { content: "Không có sự khác biệt", isCorrect: false },
          ],
        },
        {
          content: "Thuộc tính ACID trong Transaction gồm những gì?",
          answers: [
            { content: "Atomicity, Consistency, Isolation, Durability", isCorrect: true },
            { content: "Availability, Consistency, Isolation, Durability", isCorrect: false },
            { content: "Atomicity, Concurrency, Integrity, Durability", isCorrect: false },
            { content: "Atomicity, Consistency, Independence, Data", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "Đại số tuyến tính & Giải tích ứng dụng",
      description: "Các bài toán ma trận, định thức, không gian véc-tơ và ứng dụng trong khoa học dữ liệu.",
      authorId: user.id,
      categoryId: toanHoc?.id,
      status: "PUBLISHED",
      timeLimit: 45,
      questions: [
        {
          content: "Định thức của ma trận đơn vị cấp n bằng bao nhiêu?",
          answers: [
            { content: "1", isCorrect: true },
            { content: "0", isCorrect: false },
            { content: "n", isCorrect: false },
            { content: "-1", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "Từ vựng tiếng Anh chuyên ngành CNTT (IT English)",
      description: "Luyện tập từ vựng, thuật ngữ kỹ thuật phổ biến trong phát triển phần mềm và công nghệ thông tin.",
      authorId: user.id,
      categoryId: tiengAnh?.id,
      status: "PUBLISHED",
      timeLimit: 20,
      questions: [
        {
          content: "Thuật ngữ 'Deployment' có nghĩa là gì trong quy trình phần mềm?",
          answers: [
            { content: "Triển khai ứng dụng lên môi trường production/server", isCorrect: true },
            { content: "Thiết kế giao diện người dùng", isCorrect: false },
            { content: "Viết tài liệu kỹ thuật", isCorrect: false },
            { content: "Kiểm thử phần mềm", isCorrect: false },
          ],
        },
      ],
    },
  ];

  for (const q of quizzesData) {
    const existing = await prisma.quiz.findFirst({ where: { title: q.title } });
    if (!existing) {
      const createdQuiz = await prisma.quiz.create({
        data: {
          title: q.title,
          description: q.description,
          authorId: q.authorId,
          categoryId: q.categoryId,
          status: q.status,
          timeLimit: q.timeLimit,
        },
      });

      for (let i = 0; i < q.questions.length; i++) {
        const qData = q.questions[i];
        const createdQ = await prisma.question.create({
          data: {
            quizId: createdQuiz.id,
            content: qData.content,
            order: i + 1,
            points: 1,
          },
        });

        for (let j = 0; j < qData.answers.length; j++) {
          await prisma.answer.create({
            data: {
              questionId: createdQ.id,
              content: qData.answers[j].content,
              isCorrect: qData.answers[j].isCorrect,
              order: j + 1,
            },
          });
        }
      }
    }
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
