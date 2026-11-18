import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/DB.js";
import ApiError from "../utils/ApiError.js";

/**
 * Admin: Lấy danh sách lớp kèm thông tin ngành và số sinh viên
 */
const getAdminClasses = async ({ search, majorId, cohort, status } = {}) => {
  const where = {};

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { code: { contains: s, mode: "insensitive" } },
      { name: { contains: s, mode: "insensitive" } },
    ];
  }

  if (majorId && majorId.trim()) {
    where.majorId = majorId.trim();
  }

  if (cohort && cohort.trim()) {
    where.cohort = { contains: cohort.trim(), mode: "insensitive" };
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status;
  }

  const classes = await prisma.academicClass.findMany({
    where,
    orderBy: [
      { major: { code: "asc" } },
      { cohort: "desc" },
      { code: "asc" },
    ],
    include: {
      major: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  return classes.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    cohort: c.cohort,
    majorId: c.majorId,
    major: c.major,
    status: c.status,
    allowRegistration: c.allowRegistration,
    totalStudents: c._count.students,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
};

/**
 * Admin: Lấy chi tiết lớp kèm danh sách sinh viên trong lớp
 */
const getClassStudents = async (classId) => {
  const academicClass = await prisma.academicClass.findUnique({
    where: { id: classId },
    include: {
      major: { select: { id: true, code: true, name: true } },
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          studentCode: true,
          status: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!academicClass) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy lớp học!");
  }

  return academicClass;
};

/**
 * Admin: Thêm lớp mới
 */
const createClass = async ({
  code,
  name,
  majorId,
  cohort,
  status = "ACTIVE",
  allowRegistration = true,
}) => {
  if (!code || !code.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Mã lớp không được để trống!");
  }
  if (!name || !name.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Tên lớp không được để trống!");
  }
  if (!majorId || !majorId.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn ngành cho lớp học!");
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanName = name.trim();

  // Kiểm tra ngành tồn tại
  const major = await prisma.major.findUnique({
    where: { id: majorId.trim() },
  });
  if (!major) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Ngành học không tồn tại!");
  }

  // Kiểm tra trùng mã lớp
  const existing = await prisma.academicClass.findUnique({
    where: { code: cleanCode },
  });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, `Mã lớp ${cleanCode} đã tồn tại!`);
  }

  const newClass = await prisma.academicClass.create({
    data: {
      code: cleanCode,
      name: cleanName,
      majorId: major.id,
      cohort: cohort ? cohort.trim() : null,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      allowRegistration: Boolean(allowRegistration),
    },
    include: {
      major: { select: { id: true, code: true, name: true } },
    },
  });

  return newClass;
};

/**
 * Admin: Cập nhật lớp
 */
const updateClass = async (id, data) => {
  const existing = await prisma.academicClass.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy lớp học!");
  }

  const updateData = {};

  if (data.code !== undefined && data.code.trim()) {
    const cleanCode = data.code.trim().toUpperCase();
    if (cleanCode !== existing.code) {
      const codeDuplicate = await prisma.academicClass.findUnique({
        where: { code: cleanCode },
      });
      if (codeDuplicate && codeDuplicate.id !== id) {
        throw new ApiError(StatusCodes.CONFLICT, `Mã lớp ${cleanCode} đã được dùng!`);
      }
      updateData.code = cleanCode;
    }
  }

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.cohort !== undefined) updateData.cohort = data.cohort?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  if (data.allowRegistration !== undefined) updateData.allowRegistration = Boolean(data.allowRegistration);

  if (data.majorId && data.majorId !== existing.majorId) {
    const major = await prisma.major.findUnique({ where: { id: data.majorId } });
    if (!major) throw new ApiError(StatusCodes.BAD_REQUEST, "Ngành học không tồn tại!");
    updateData.majorId = major.id;
  }

  const updated = await prisma.academicClass.update({
    where: { id },
    data: updateData,
    include: {
      major: { select: { id: true, code: true, name: true } },
    },
  });

  return updated;
};

/**
 * Admin: Xóa lớp (nếu có sinh viên thì chuyển INACTIVE)
 */
const deleteClass = async (id) => {
  const academicClass = await prisma.academicClass.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!academicClass) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy lớp học!");
  }

  if (academicClass._count.students > 0) {
    await prisma.academicClass.update({
      where: { id },
      data: { status: "INACTIVE", allowRegistration: false },
    });
    return {
      softDeleted: true,
      message: "Lớp học đã có sinh viên nên đã được chuyển sang trạng thái ngừng hoạt động.",
    };
  }

  await prisma.academicClass.delete({ where: { id } });
  return {
    softDeleted: false,
    message: "Xóa lớp học thành công!",
  };
};

/**
 * Admin: Xóa hoặc ngừng hoạt động nhiều lớp học (Bulk Delete)
 */
const bulkDeleteClasses = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Danh sách ID lớp học không hợp lệ!");
  }

  const results = {
    total: ids.length,
    hardDeleted: 0,
    softDeactivated: 0,
    errors: [],
  };

  for (const id of ids) {
    try {
      const cls = await prisma.academicClass.findUnique({
        where: { id },
        include: { _count: { select: { students: true } } },
      });

      if (!cls) {
        results.errors.push({ id, error: "Không tìm thấy lớp học" });
        continue;
      }

      if (cls._count.students > 0) {
        await prisma.academicClass.update({
          where: { id },
          data: { status: "INACTIVE", allowRegistration: false },
        });
        results.softDeactivated++;
      } else {
        await prisma.academicClass.delete({ where: { id } });
        results.hardDeleted++;
      }
    } catch (err) {
      results.errors.push({ id, error: err.message || "Lỗi xóa lớp" });
    }
  }

  return results;
};

/**
 * Admin: Cập nhật trạng thái / đăng ký hàng loạt theo ID hoặc theo Khóa học (Cohort)
 * Ví dụ: Chuyển toàn bộ Khóa 28, 29 sang INACTIVE (đã ra trường)
 */
const bulkUpdateStatus = async ({ ids, cohort, status, allowRegistration }) => {
  const data = {};
  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    data.status = status;
  }
  if (allowRegistration !== undefined) {
    data.allowRegistration = Boolean(allowRegistration);
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu thông tin cập nhật trạng thái!");
  }

  let where = {};

  if (cohort && cohort.trim()) {
    const rawCohort = cohort.trim();
    where = {
      cohort: {
        contains: rawCohort,
        mode: "insensitive",
      },
    };
  } else if (Array.isArray(ids) && ids.length > 0) {
    where = { id: { in: ids } };
  } else {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cần cung cấp danh sách ID hoặc tên Khóa!");
  }

  const result = await prisma.academicClass.updateMany({
    where,
    data,
  });

  return {
    updatedCount: result.count,
    status: data.status,
    allowRegistration: data.allowRegistration,
    target: cohort ? `Khóa ${cohort}` : `${ids?.length || 0} lớp được chọn`,
  };
};

/**
 * Admin: Nhập danh sách lớp học từ Excel hàng loạt
 */
const bulkImportClasses = async ({ items, updateExisting = false }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Danh sách lớp học rỗng!");
  }

  const allMajors = await prisma.major.findMany({
    select: { id: true, code: true, name: true },
  });

  const majorCodeMap = new Map();
  const majorNameMap = new Map();
  for (const m of allMajors) {
    majorCodeMap.set(m.code.toUpperCase().trim(), m);
    majorNameMap.set(m.name.toLowerCase().trim(), m);
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
    let majorId = item.majorId ? String(item.majorId).trim() : "";
    const rawMajor = item.majorCodeOrName ? String(item.majorCodeOrName).trim() : "";
    const cohort = item.cohort ? String(item.cohort).trim() : null;

    if (!rawCode || !rawName) {
      results.errors.push({
        row: i + 1,
        code: rawCode,
        name: rawName,
        error: "Thiếu mã lớp hoặc tên lớp",
      });
      results.skipped++;
      continue;
    }

    if (!majorId && rawMajor) {
      const matchByCode = majorCodeMap.get(rawMajor.toUpperCase());
      const matchByName = majorNameMap.get(rawMajor.toLowerCase());
      if (matchByCode) {
        majorId = matchByCode.id;
      } else if (matchByName) {
        majorId = matchByName.id;
      } else {
        const partial = allMajors.find(
          (m) =>
            m.name.toLowerCase().includes(rawMajor.toLowerCase()) ||
            rawMajor.toLowerCase().includes(m.name.toLowerCase()) ||
            m.code.toUpperCase().includes(rawMajor.toUpperCase())
        );
        if (partial) majorId = partial.id;
      }
    }

    if (!majorId && allMajors.length > 0) {
      majorId = allMajors[0].id;
    }

    if (!majorId) {
      results.errors.push({
        row: i + 1,
        code: rawCode,
        name: rawName,
        error: "Không tìm thấy ngành học tương ứng",
      });
      results.skipped++;
      continue;
    }

    const cleanCode = rawCode.toUpperCase();
    const cleanName = rawName;

    try {
      const existing = await prisma.academicClass.findUnique({
        where: { code: cleanCode },
      });

      if (existing) {
        if (updateExisting) {
          await prisma.academicClass.update({
            where: { id: existing.id },
            data: {
              name: cleanName,
              majorId,
              cohort: cohort || existing.cohort,
              status: item.status || existing.status,
              allowRegistration:
                item.allowRegistration !== undefined
                  ? Boolean(item.allowRegistration)
                  : existing.allowRegistration,
            },
          });
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await prisma.academicClass.create({
          data: {
            code: cleanCode,
            name: cleanName,
            majorId,
            cohort,
            status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            allowRegistration:
              item.allowRegistration !== undefined ? Boolean(item.allowRegistration) : true,
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

export const academicClassService = {
  getAdminClasses,
  getClassStudents,
  createClass,
  updateClass,
  deleteClass,
  bulkDeleteClasses,
  bulkUpdateStatus,
  bulkImportClasses,
};

