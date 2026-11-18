import { env } from "./environment.js";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as PrismaAll from "@prisma/client";

// Establish connection pool using node-postgres
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

// Instantiate client with the driver adapter
export const prisma = new PrismaAll.PrismaClient({ adapter });
