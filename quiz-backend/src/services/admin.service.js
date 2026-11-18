import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/DB.js";
import ApiError from "../utils/ApiError.js";

/**
 * Lấy danh sách sinh viên cho trang Admin Quản lý sinh viên
 */
const getStudents = async ({ search, majorId, classId, status, page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const where = {
    role: { in: ["STUDENT", "USER"] },
  };

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { studentCode: { contains: s, mode: "insensitive" } },
    ];
  }

  if (majorId && majorId.trim()) {
    where.majorId = majorId.trim();
  }

  if (classId && classId.trim()) {
    where.classId = classId.trim();
  }

  if (status && status.trim()) {
    where.status = status.trim().toUpperCase();
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        studentCode: true,
        role: true,
        status: true,
        avatar: true,
        majorId: true,
        classId: true,
        createdAt: true,
        major: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        academicClass: {
          select: {
            id: true,
            code: true,
            name: true,
            cohort: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: students,
    total,
    page: pageNum,
    limit: take,
    totalPages: Math.ceil(total / take),
  };
};

/**
 * Admin chỉnh sửa thông tin học tập của sinh viên (ngành, gán lớp, chuyển lớp)
 */
const updateStudentAcademicInfo = async (studentId, { majorId, classId, studentCode }) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy sinh viên!");
  }

  const updateData = {};

  // Cập nhật mã sinh viên nếu có
  if (studentCode !== undefined && studentCode !== null) {
    const cleanCode = String(studentCode).trim();
    if (cleanCode && cleanCode !== student.studentCode) {
      const codeDuplicate = await prisma.user.findFirst({
        where: { studentCode: cleanCode },
      });
      if (codeDuplicate && codeDuplicate.id !== studentId) {
        throw new ApiError(StatusCodes.CONFLICT, "Mã sinh viên đã tồn tại trên hệ thống!");
      }
      updateData.studentCode = cleanCode;
    }
  }

  // Cập nhật ngành
  let targetMajorId = student.majorId;
  if (majorId && majorId !== student.majorId) {
    const major = await prisma.major.findUnique({ where: { id: majorId } });
    if (!major) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Ngành học không tồn tại!");
    }
    updateData.majorId = major.id;
    targetMajorId = major.id;
  }

  // Cập nhật lớp
  if (classId !== undefined) {
    if (classId === null || classId === "") {
      updateData.classId = null;
    } else {
      const academicClass = await prisma.academicClass.findUnique({
        where: { id: classId },
      });
      if (!academicClass) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Lớp học không tồn tại!");
      }
      if (targetMajorId && academicClass.majorId !== targetMajorId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Lớp học không thuộc ngành đã chọn!");
      }
      updateData.classId = academicClass.id;
    }
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      studentCode: true,
      majorId: true,
      classId: true,
      status: true,
      major: {
        select: { id: true, code: true, name: true },
      },
      academicClass: {
        select: { id: true, code: true, name: true, cohort: true },
      },
    },
  });

  return updated;
};

/**
 * Admin khóa hoặc mở khóa tài khoản
 */
const updateStudentStatus = async (studentId, status) => {
  const cleanStatus = status?.toUpperCase();
  if (!["ACTIVE", "BLOCKED", "INACTIVE"].includes(cleanStatus)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Trạng thái không hợp lệ!");
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: { status: cleanStatus },
    select: { id: true, name: true, email: true, status: true },
  });

  return updated;
};

/**
 * Thống kê tổng quan cho Admin Dashboard
 */
const getAdminStats = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalMajors,
    totalClasses,
    totalQuizzes,
    totalAttempts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["STUDENT", "USER"] } } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.major.count(),
    prisma.academicClass.count(),
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalMajors,
    totalClasses,
    totalQuizzes,
    totalAttempts,
  };
};

/**
 * Danh sách Giảng viên
 */
const getTeachers = async ({ search, majorId } = {}) => {
  const where = {
    role: "TEACHER",
  };

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
    ];
  }

  if (majorId && majorId.trim()) {
    where.majorId = majorId.trim();
  }

  const teachers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      createdAt: true,
      major: {
        select: { id: true, code: true, name: true },
      },
      _count: {
        select: {
          quizzes: true,
        },
      },
    },
  });

  return teachers;
};

/**
 * Danh sách tất cả Đề thi trong hệ thống (cho Admin)
 */
const getAdminQuizzes = async ({
  search,
  majorId,
  status,
  page = 1,
  limit = 20,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const where = {};

  if (status && status.trim()) {
    where.status = status.trim().toUpperCase();
  }

  if (search && search.trim()) {
    where.title = { contains: search.trim(), mode: "insensitive" };
  }

  if (majorId && majorId.trim()) {
    where.quizMajors = { some: { majorId: majorId.trim() } };
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
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
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

/**
 * Admin: Thay đổi trạng thái đề thi
 */
const updateAdminQuizStatus = async (quizId, newStatus) => {
  const validStatuses = ["PUBLISHED", "DRAFT", "ARCHIVED"];
  if (!validStatuses.includes(newStatus)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Trạng thái đề thi không hợp lệ!");
  }

  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: { status: newStatus },
    select: { id: true, title: true, status: true },
  });

  return updated;
};

export const adminService = {
  getStudents,
  updateStudentAcademicInfo,
  updateStudentStatus,
  getAdminStats,
  getTeachers,
  getAdminQuizzes,
  updateAdminQuizStatus,
};
