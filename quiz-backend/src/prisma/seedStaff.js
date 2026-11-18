import { prisma } from "../config/DB.js";
import bcrypt from "bcrypt";

async function seedAdminAndTeacher() {
  const hashAdmin = await bcrypt.hash("Admin@123", 10);
  const hashTeacher = await bcrypt.hash("Teacher@123", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@hubt.edu.vn" },
    update: { role: "ADMIN", emailVerified: true },
    create: {
      email: "admin@hubt.edu.vn",
      name: "Quản trị viên HUBT",
      password: hashAdmin,
      role: "ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  // Teacher
  await prisma.user.upsert({
    where: { email: "teacher@hubt.edu.vn" },
    update: { role: "TEACHER", emailVerified: true },
    create: {
      email: "teacher@hubt.edu.vn",
      name: "Giảng viên CNTT",
      password: hashTeacher,
      role: "TEACHER",
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log("Admin and Teacher accounts seeded successfully!");
}

seedAdminAndTeacher().finally(() => process.exit(0));
