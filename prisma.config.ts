import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as orm, prisma7Schema } from "@prisma/orm-postgres/config";
import { defineConfig as composer } from "@prisma/composer/config";
import { nodeBuild } from "@prisma/composer/node/control";
import { prismaCloud, prismaState } from "@prisma/composer-prisma-cloud/control";

export default definePrismaConfig({
  orm: orm({
    // The Prisma 7 schema files remain the contract source during adoption.
    contract: prisma7Schema("quiz-backend/src/prisma"),
    output: "quiz-backend/src/prisma",
    db: { connection: process.env["DATABASE_URL"] },
    migrations: { dir: "quiz-backend/src/prisma/migrations" },
  }),
  composer: composer({
    entry: "./module.mjs",
    extensions: [prismaCloud(), nodeBuild()],
    state: prismaState(),
  }),
});
