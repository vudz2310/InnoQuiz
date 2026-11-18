import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/DB.js";
import ApiError from "../utils/ApiError.js";

/**
 * Public: Lấy danh sách ngành cho đăng ký và hiển thị công khai
 */
const getPublicMajors = async () => {
  const majors = await prisma.major.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: [
      { displayOrder: "asc" },
      { code: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      status: true,
      allowRegistration: true,
      displayOrder: true,
      _count: {
        select: {
          classes: true,
          students: true,
        },
      },
    },
  });
  return majors.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    description: m.description,
    status: m.status,
    allowRegistration: m.allowRegistration,
    displayOrder: m.displayOrder,
    totalClasses: m._count.classes,
    totalStudents: m._count.students,
  }));
};

/**
 * Public: Lấy danh sách lớp thuộc ngành cho form đăng ký
 */
const getPublicClassesByMajor = async (majorId) => {
  if (!majorId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu ID ngành học!");
  }

  const classes = await prisma.academicClass.findMany({
    where: {
      majorId,
      status: "ACTIVE",
    },
    orderBy: [
      { cohort: "desc" },
      { code: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      cohort: true,
      majorId: true,
      status: true,
      allowRegistration: true,
    },
  });
  return classes;
};

/**
 * Admin: Lấy danh sách toàn bộ ngành
 */
const getAdminMajors = async ({ search, status, allowRegistration } = {}) => {
  const where = {};

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { code: { contains: s, mode: "insensitive" } },
      { name: { contains: s, mode: "insensitive" } },
    ];
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status;
  }

  if (allowRegistration !== undefined && allowRegistration !== null && allowRegistration !== "") {
    where.allowRegistration = allowRegistration === true || allowRegistration === "true";
  }

  const majors = await prisma.major.findMany({
    where,
    orderBy: [
      { displayOrder: "asc" },
      { code: "asc" },
    ],
    include: {
      _count: {
        select: {
          classes: true,
          students: true,
          quizMajors: true,
        },
      },
    },
  });

  return majors.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    description: m.description,
    status: m.status,
    allowRegistration: m.allowRegistration,
    displayOrder: m.displayOrder,
    totalClasses: m._count.classes,
    totalStudents: m._count.students,
    totalQuizzes: m._count.quizMajors,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
};

/**
 * Admin: Thêm ngành mới
 */
const createMajor = async ({
  code,
  name,
  description,
  status = "ACTIVE",
  allowRegistration = true,
  displayOrder = 0,
}) => {
  if (!code || !code.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Mã ngành không được để trống!");
  }
  if (!name || !name.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Tên ngành không được để trống!");
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanName = name.trim();

  const existing = await prisma.major.findUnique({
    where: { code: cleanCode },
  });

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, `Mã ngành ${cleanCode} đã tồn tại!`);
  }

  const newMajor = await prisma.major.create({
    data: {
      code: cleanCode,
      name: cleanName,
      description: description ? description.trim() : null,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      allowRegistration: Boolean(allowRegistration),
      displayOrder: Number(displayOrder) || 0,
    },
  });

  return newMajor;
};

/**
 * Admin: Cập nhật ngành
 */
const updateMajor = async (id, data) => {
  const existing = await prisma.major.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy ngành học!");
  }

  const updateData = {};

  if (data.code !== undefined && data.code.trim()) {
    const cleanCode = data.code.trim().toUpperCase();
    if (cleanCode !== existing.code) {
      const codeDuplicate = await prisma.major.findUnique({
        where: { code: cleanCode },
      });
      if (codeDuplicate && codeDuplicate.id !== id) {
        throw new ApiError(StatusCodes.CONFLICT, `Mã ngành ${cleanCode} đã được dùng!`);
      }
      updateData.code = cleanCode;
    }
  }

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  if (data.allowRegistration !== undefined) updateData.allowRegistration = Boolean(data.allowRegistration);
  if (data.displayOrder !== undefined) updateData.displayOrder = Number(data.displayOrder) || 0;

  const updated = await prisma.major.update({
    where: { id },
    data: updateData,
  });

  return updated;
};

/**
 * Admin: Xóa ngành (nếu có dữ liệu phụ thuộc thì chuyển INACTIVE)
 */
const deleteMajor = async (id) => {
  const major = await prisma.major.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          classes: true,
          students: true,
          quizMajors: true,
        },
      },
    },
  });

  if (!major) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy ngành học!");
  }

  const hasDependents =
    major._count.classes > 0 ||
    major._count.students > 0 ||
    major._count.quizMajors > 0;

  if (hasDependents) {
    // Chuyển sang INACTIVE để bảo vệ toàn vẹn dữ liệu
    await prisma.major.update({
      where: { id },
      data: { status: "INACTIVE", allowRegistration: false },
    });
    return {
      softDeleted: true,
      message: "Ngành này đã có sinh viên, lớp hoặc đề thi liên quan nên đã được chuyển sang trạng thái ngừng hoạt động.",
    };
  }

  await prisma.major.delete({ where: { id } });
  return {
    softDeleted: false,
    message: "Xóa ngành học thành công!",
  };
};

/**
 * Admin: Nhập danh sách ngành hàng loạt (Bulk Import từ Excel/CSV)
 */
const bulkImportMajors = async ({ items, updateExisting = false }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Danh sách ngành rỗng!");
  }

  const results = {
    total: items.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawCode = item.code ? String(item.code).trim() : "";
    const rawName = item.name ? String(item.name).trim() : "";

    if (!rawCode || !rawName) {
      results.errors.push({
        row: i + 1,
        code: rawCode,
        name: rawName,
        error: "Thiếu mã ngành hoặc tên ngành",
      });
      results.skipped++;
      continue;
    }

    const cleanCode = rawCode.toUpperCase();
    const cleanName = rawName;
    const cleanDesc = item.description ? String(item.description).trim() : null;

    try {
      const existing = await prisma.major.findUnique({
        where: { code: cleanCode },
      });

      if (existing) {
        if (updateExisting) {
          await prisma.major.update({
            where: { id: existing.id },
            data: {
              name: cleanName,
              description: cleanDesc ?? existing.description,
              status: item.status || existing.status,
            },
          });
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await prisma.major.create({
          data: {
            code: cleanCode,
            name: cleanName,
            description: cleanDesc,
            status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            allowRegistration: item.allowRegistration !== undefined ? Boolean(item.allowRegistration) : true,
            displayOrder: Number(item.displayOrder) || 0,
          },
        });
        results.created++;
      }
    } catch (err) {
      results.errors.push({
        row: i + 1,
        code: cleanCode,
        name: cleanName,
        error: err.message || "Lỗi xử lý cơ sở dữ liệu",
      });
      results.skipped++;
    }
  }

  return results;
};

export const majorService = {
  getPublicMajors,
  getPublicClassesByMajor,
  getAdminMajors,
  createMajor,
  updateMajor,
  deleteMajor,
  bulkImportMajors,
};

