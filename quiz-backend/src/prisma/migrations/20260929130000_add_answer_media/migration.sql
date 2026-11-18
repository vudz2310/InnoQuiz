-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionMediaType') THEN
        CREATE TYPE "QuestionMediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AnswerMedia" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "type" "QuestionMediaType" NOT NULL DEFAULT 'IMAGE',
    "originalName" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnswerMedia_answerId_idx" ON "AnswerMedia"("answerId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnswerMedia_answerId_fkey') THEN
        ALTER TABLE "AnswerMedia" ADD CONSTRAINT "AnswerMedia_answerId_fkey"
          FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
