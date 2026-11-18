-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizSection" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizSection_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizSection_quizId_idx" ON "QuizSection"("quizId");
CREATE UNIQUE INDEX IF NOT EXISTS "QuizSection_quizId_order_key" ON "QuizSection"("quizId", "order");
CREATE INDEX IF NOT EXISTS "Question_sectionId_idx" ON "Question"("sectionId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizSection_quizId_fkey') THEN
        ALTER TABLE "QuizSection" ADD CONSTRAINT "QuizSection_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Question_sectionId_fkey') THEN
        ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "QuizSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
