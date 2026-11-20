import service from "../../service.mjs";

// The Prisma ORM 8 client arrives through the app's service declaration.
const { db } = service.load();

export const prisma = db.client;
