CREATE EXTENSION IF NOT EXISTS "pgcrypto";


DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Loại câu hỏi trắc nghiệm
DO $$ BEGIN
    CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trạng thái bài thi trắc nghiệm
DO $$ BEGIN
    CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trạng thái lượt làm bài
DO $$ BEGIN
    CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. TABLES (Bảng dữ liệu)
-- ============================================================

-- ------------------------------------------------------------
-- Bảng: User (Người dùng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: Category (Danh mục bài thi)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: Tag (Thẻ nhãn)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: Quiz (Bài thi / Đề trắc nghiệm)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Quiz" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "timeLimit" INTEGER,
    "maxAttempts" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: QuizTag (Quan hệ N-N giữa Quiz và Tag)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "QuizTag" (
    "quizId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "QuizTag_pkey" PRIMARY KEY ("quizId", "tagId")
);

-- ------------------------------------------------------------
-- Bảng: Question (Câu hỏi)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "content" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: Answer (Các đáp án lựa chọn cho câu hỏi)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Answer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "content" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: QuizAttempt (Lượt làm bài thi của thí sinh)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- Bảng: UserAnswer (Câu trả lời chi tiết của thí sinh)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "UserAnswer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerId" TEXT,
    "isCorrect" BOOLEAN,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- 3. UNIQUE INDEXES (Chỉ mục duy nhất)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "UserAnswer_attemptId_questionId_key" ON "UserAnswer"("attemptId", "questionId");

-- ============================================================
-- 4. FOREIGN KEYS (Khóa ngoại & Quan hệ)
-- ============================================================

-- Quiz -> User (authorId)
ALTER TABLE "Quiz" 
    DROP CONSTRAINT IF EXISTS "Quiz_authorId_fkey",
    ADD CONSTRAINT "Quiz_authorId_fkey" 
    FOREIGN KEY ("authorId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quiz -> Category (categoryId)
ALTER TABLE "Quiz" 
    DROP CONSTRAINT IF EXISTS "Quiz_categoryId_fkey",
    ADD CONSTRAINT "Quiz_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Question -> Quiz (quizId)
ALTER TABLE "Question" 
    DROP CONSTRAINT IF EXISTS "Question_quizId_fkey",
    ADD CONSTRAINT "Question_quizId_fkey" 
    FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Answer -> Question (questionId)
ALTER TABLE "Answer" 
    DROP CONSTRAINT IF EXISTS "Answer_questionId_fkey",
    ADD CONSTRAINT "Answer_questionId_fkey" 
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- QuizAttempt -> User (userId)
ALTER TABLE "QuizAttempt" 
    DROP CONSTRAINT IF EXISTS "QuizAttempt_userId_fkey",
    ADD CONSTRAINT "QuizAttempt_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- QuizAttempt -> Quiz (quizId)
ALTER TABLE "QuizAttempt" 
    DROP CONSTRAINT IF EXISTS "QuizAttempt_quizId_fkey",
    ADD CONSTRAINT "QuizAttempt_quizId_fkey" 
    FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- UserAnswer -> QuizAttempt (attemptId)
ALTER TABLE "UserAnswer" 
    DROP CONSTRAINT IF EXISTS "UserAnswer_attemptId_fkey",
    ADD CONSTRAINT "UserAnswer_attemptId_fkey" 
    FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- UserAnswer -> Question (questionId)
ALTER TABLE "UserAnswer" 
    DROP CONSTRAINT IF EXISTS "UserAnswer_questionId_fkey",
    ADD CONSTRAINT "UserAnswer_questionId_fkey" 
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- UserAnswer -> Answer (answerId)
ALTER TABLE "UserAnswer" 
    DROP CONSTRAINT IF EXISTS "UserAnswer_answerId_fkey",
    ADD CONSTRAINT "UserAnswer_answerId_fkey" 
    FOREIGN KEY ("answerId") REFERENCES "Answer"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- QuizTag -> Quiz (quizId)
ALTER TABLE "QuizTag" 
    DROP CONSTRAINT IF EXISTS "QuizTag_quizId_fkey",
    ADD CONSTRAINT "QuizTag_quizId_fkey" 
    FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- QuizTag -> Tag (tagId)
ALTER TABLE "QuizTag" 
    DROP CONSTRAINT IF EXISTS "QuizTag_tagId_fkey",
    ADD CONSTRAINT "QuizTag_tagId_fkey" 
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 5. PERFORMANCE INDEXES (Chỉ mục tối ưu hóa truy vấn)
-- ============================================================

CREATE INDEX IF NOT EXISTS "idx_quiz_author" ON "Quiz"("authorId");
CREATE INDEX IF NOT EXISTS "idx_quiz_category" ON "Quiz"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_question_quiz" ON "Question"("quizId");
CREATE INDEX IF NOT EXISTS "idx_answer_question" ON "Answer"("questionId");
CREATE INDEX IF NOT EXISTS "idx_attempt_user" ON "QuizAttempt"("userId");
CREATE INDEX IF NOT EXISTS "idx_attempt_quiz" ON "QuizAttempt"("quizId");
CREATE INDEX IF NOT EXISTS "idx_user_answer_attempt" ON "UserAnswer"("attemptId");
CREATE INDEX IF NOT EXISTS "idx_user_answer_question" ON "UserAnswer"("questionId");
