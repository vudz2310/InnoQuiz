import { prisma } from "../config/DB.js";

/**
 * Thống kê cho Teacher Dashboard
 */
const getTeacherStats = async (teacherId) => {
  // Lấy thông tin giảng viên để biết ngành (nếu có)
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true, majorId: true },
  });

  const teacherMajorId = teacher?.majorId;

  // 1. Tổng đề thi do giảng viên tạo
  const totalQuizzes = await prisma.quiz.count({
    where: { authorId: teacherId },
  });

  // 2. Tổng lượt làm bài trên các đề thi của giảng viên
  const totalAttempts = await prisma.quizAttempt.count({
    where: {
      quiz: {
        authorId: teacherId,
      },
    },
  });

  // 3. Tổng số lớp học
  const classWhere = teacherMajorId ? { majorId: teacherMajorId } : {};
  const totalClasses = await prisma.academicClass.count({
    where: classWhere,
  });

  // 4. Tổng số sinh viên
  const studentWhere = {
    role: { in: ["STUDENT", "USER"] },
    ...(teacherMajorId ? { majorId: teacherMajorId } : {}),
  };
  const totalStudents = await prisma.user.count({
    where: studentWhere,
  });

  // 5. Danh sách đề thi gần đây của giảng viên
  const recentQuizzes = await prisma.quiz.findMany({
    where: { authorId: teacherId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      majorScope: true,
      timeLimit: true,
      createdAt: true,
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
      quizMajors: {
        select: {
          major: {
            select: { id: true, code: true, name: true },
          },
        },
      },
    },
  });

  // 6. Lượt làm bài gần đây nhất của sinh viên
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: {
      quiz: {
        authorId: teacherId,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      score: true,
      correctAnswers: true,
      totalQuestions: true,
      duration: true,
      status: true,
      finishedAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          studentCode: true,
          academicClass: {
            select: { code: true, name: true },
          },
        },
      },
      quiz: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return {
    totalQuizzes,
    totalAttempts,
    totalClasses,
    totalStudents,
    recentQuizzes,
    recentAttempts,
  };
};

/**
 * Danh sách lớp học giảng dạy
 */
const getTeacherClasses = async (teacherId) => {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { majorId: true },
  });

  const where = teacher?.majorId ? { majorId: teacher.majorId } : {};

  const classes = await prisma.academicClass.findMany({
    where,
    orderBy: [{ cohort: "desc" }, { code: "asc" }],
    include: {
      major: {
        select: { id: true, code: true, name: true },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  return classes;
};

/**
 * Danh sách sinh viên thuộc các lớp giảng dạy
 */
const getTeacherStudents = async (
  teacherId,
  { search, classId, page = 1, limit = 20 } = {}
) => {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { majorId: true },
  });

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const where = {
    role: { in: ["STUDENT", "USER"] },
    ...(teacher?.majorId ? { majorId: teacher.majorId } : {}),
  };

  if (classId && classId.trim()) {
    where.classId = classId.trim();
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { studentCode: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: [{ studentCode: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        studentCode: true,
        status: true,
        avatar: true,
        major: { select: { id: true, code: true, name: true } },
        academicClass: { select: { id: true, code: true, name: true, cohort: true } },
        _count: {
          select: { attempts: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    total,
    page: pageNum,
    limit: take,
    totalPages: Math.ceil(total / take) || 1,
  };
};

/**
 * Danh sách đề thi của giảng viên
 */
const getTeacherQuizzes = async (
  teacherId,
  { search, status, page = 1, limit = 20 } = {}
) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const where = {
    authorId: teacherId,
  };

  if (status && status.trim()) {
    where.status = status.trim().toUpperCase();
  }

  if (search && search.trim()) {
    where.title = { contains: search.trim(), mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        majorScope: true,
        timeLimit: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
        quizMajors: {
          select: {
            major: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    }),
    prisma.quiz.count({ where }),
  ]);

  return {
    items,
    total,
    page: pageNum,
    limit: take,
    totalPages: Math.ceil(total / take) || 1,
  };
};

export const teacherService = {
  getTeacherStats,
  getTeacherClasses,
  getTeacherStudents,
  getTeacherQuizzes,
};
