import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/DB.js";
import bcrypt from "bcrypt";
import ApiError from "../utils/ApiError.js";

const ALLOWED_UPDATE_FIELDS = [
  "name",
  "email",
  "avatar",
  "studentCode",
  "majorId",
  "classId",
];

const getMyProfile = async (jwtDecoded) => {
  if (!jwtDecoded?.id) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Vui lòng đăng nhập để thực hiện chức năng này",
    );
  }

  const userInfo = await prisma.user.findUnique({
    where: { id: jwtDecoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      studentCode: true,
      avatar: true,
      role: true,
      majorId: true,
      major: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      classId: true,
      academicClass: {
        select: {
          id: true,
          code: true,
          name: true,
          cohort: true,
        },
      },
      createdAt: true,
    },
  });

  if (!userInfo) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Tài khoản người dùng không tồn tại",
    );
  }

  return userInfo;
};

const updateProfile = async (jwtDecoded, payload) => {
  if (!jwtDecoded?.id) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Vui lòng đăng nhập để thực hiện chức năng này",
    );
  }

  const dataToUpdate = {};

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (payload[field] !== undefined) {
      dataToUpdate[field] = payload[field];
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Không có dữ liệu hợp lệ để cập nhật",
    );
  }

  if (dataToUpdate.name !== undefined) {
    if (typeof dataToUpdate.name !== "string" || !dataToUpdate.name.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Tên không hợp lệ");
    }
    dataToUpdate.name = dataToUpdate.name.trim();
  }

  if (dataToUpdate.studentCode !== undefined) {
    const cleanCode = String(dataToUpdate.studentCode || "").trim();
    if (cleanCode) {
      const duplicate = await prisma.user.findFirst({
        where: {
          studentCode: cleanCode,
          id: { not: jwtDecoded.id },
        },
      });
      if (duplicate) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          `Mã sinh viên ${cleanCode} đã được sử dụng bởi tài khoản khác.`,
        );
      }
      dataToUpdate.studentCode = cleanCode;
    } else {
      dataToUpdate.studentCode = null;
    }
  }

  if (dataToUpdate.email !== undefined) {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = String(dataToUpdate.email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email không hợp lệ");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser && existingUser.id !== jwtDecoded.id) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `Email ${cleanEmail} đã được sử dụng bởi tài khoản khác`,
      );
    }

    dataToUpdate.email = cleanEmail;
  }

  // Cập nhật Ngành đào tạo
  if (dataToUpdate.majorId !== undefined) {
    if (dataToUpdate.majorId && String(dataToUpdate.majorId).trim()) {
      const major = await prisma.major.findUnique({
        where: { id: String(dataToUpdate.majorId).trim() },
      });
      if (!major) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Ngành học không tồn tại.");
      }
      dataToUpdate.majorId = major.id;
    } else {
      dataToUpdate.majorId = null;
    }
  }

  // Cập nhật Lớp học phần
  if (dataToUpdate.classId !== undefined) {
    if (dataToUpdate.classId && String(dataToUpdate.classId).trim()) {
      const academicClass = await prisma.academicClass.findUnique({
        where: { id: String(dataToUpdate.classId).trim() },
      });
      if (!academicClass) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Lớp học phần không tồn tại.");
      }

      const currentMajorId =
        dataToUpdate.majorId ||
        (await prisma.user.findUnique({ where: { id: jwtDecoded.id } }))?.majorId;

      if (currentMajorId && academicClass.majorId !== currentMajorId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Lớp học phần không thuộc ngành học đã chọn.",
        );
      }

      dataToUpdate.classId = academicClass.id;
      if (!dataToUpdate.majorId) {
        dataToUpdate.majorId = academicClass.majorId;
      }
    } else {
      dataToUpdate.classId = null;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: jwtDecoded.id },
    data: dataToUpdate,
    select: {
      id: true,
      email: true,
      name: true,
      studentCode: true,
      avatar: true,
      role: true,
      majorId: true,
      major: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      classId: true,
      academicClass: {
        select: {
          id: true,
          code: true,
          name: true,
          cohort: true,
        },
      },
      createdAt: true,
    },
  });

  return updatedUser;
};

const changePassword = async (jwtDecoded, newPassword) => {
  if (!jwtDecoded?.id) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Vui lòng đăng nhập để thực hiện chức năng này",
    );
  }

  if (!newPassword || typeof newPassword !== "string") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu mới không được để trống",
    );
  }

  if (newPassword.length < 8) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu mới phải có ít nhất 8 ký tự",
    );
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: jwtDecoded.id },
    data: { password: hashPassword },
  });

  return { message: "Đổi mật khẩu thành công" };
};

const deleteAccount = async (jwtDecoded) => {
  if (!jwtDecoded?.id) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Vui lòng đăng nhập để thực hiện chức năng này",
    );
  }

  const userExist = await prisma.user.findUnique({
    where: { id: jwtDecoded.id },
  });

  if (!userExist) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Tài khoản không tồn tại hoặc đã bị xoá",
    );
  }

  await prisma.user.delete({
    where: { id: jwtDecoded.id },
  });
  return { message: "Xoá tài khoản thành công" };
};


export const profileService = {
  getMyProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};