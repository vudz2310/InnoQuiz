# 📚 Tài Liệu Thiết Kế Cơ Sở Dữ Liệu Inno Quiz (Prisma & PostgreSQL)

Hệ thống cơ sở dữ liệu của **Inno Quiz** được xây dựng trên nền tảng **PostgreSQL**, quản lý ORM qua **Prisma ORM (v7+)** và được module hóa thành các file schema riêng biệt trong thư mục `src/prisma/`.

---

## 🗺️ 1. Sơ Đồ Kiến Trúc & Quan Hệ Tổng Thể (ERD)

```
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                 ┌──────────────┴──────────────┐
                 │ 1                           │ 1
                 ▼ N                           ▼ N
           ┌───────────┐                 ┌──────────────┐
           │   Quiz    │                 │ QuizAttempt  │
           └─────┬─────┘                 └──────┬───────┘
                 │                              │ 1
     ┌───────────┼───────────┐                  │
     │ 1         │ 1         │ 1                │ N
     ▼ N         ▼ N         ▼ N                ▼
 ┌────────┐ ┌──────────┐ ┌─────────┐     ┌──────────────┐
 │Category│ │ Question │ │ QuizTag │     │  UserAnswer  │
 └────────┘ └────┬─────┘ └────┬────┘     └──────┬───────┘
                 │ 1          │ N               │
                 ▼ N          ▼                 │
              ┌──────┐     ┌─────┐              │
              │Answer│     │ Tag │              │
              └──┬───┘     └─────┘              │
                 ▲                              │
                 └──────────────────────────────┘
```

---

## 🗂️ 2. Danh Sách Các File Schema (`src/prisma/`)

| File | Chức Năng | Các Model & Enum |
| :--- | :--- | :--- |
| [`base.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/base.prisma) | Cấu hình nguồn kết nối và Client | `datasource db`, `generator client` |
| [`User.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/User.prisma) | Quản lý người dùng, tài khoản | `User`, `enum UserRole` |
| [`Quiz.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/Quiz.prisma) | Quản lý bài trắc nghiệm / đề thi | `Quiz`, `enum QuizStatus` |
| [`Category.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/Category.prisma) | Danh mục phân loại bài thi | `Category` |
| [`Question.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/Question.prisma) | Danh sách câu hỏi trong đề | `Question`, `enum QuestionType` |
| [`Answer.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/Answer.prisma) | Các phương án trả lời của câu hỏi | `Answer` |
| [`QuizAttempt.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/QuizAttempt.prisma) | Lượt làm bài & câu trả lời của thí sinh | `QuizAttempt`, `UserAnswer`, `enum AttemptStatus` |
| [`Tag.prisma`](file:///c:/Users/nitro/Desktop/Quiz-Hubt/quiz-backend/src/prisma/Tag.prisma) | Nhãn gắn thẻ tìm kiếm & lọc | `Tag`, `QuizTag` |

---

## 📋 3. Chi Tiết Các Bảng và Trường Dữ Liệu

### 3.1. `User` (Người dùng)
Lưu trữ thông tin tài khoản của hệ thống (giáo viên, admin, sinh viên/học viên).

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính |
| `email` | `String` | `@unique` | Email đăng nhập duy nhất |
| `name` | `String?` | Nullable | Tên hiển thị của người dùng |
| `avatar` | `String?` | Nullable | URL ảnh đại diện |
| `password` | `String` | Not Null | Mật khẩu đã băm (Bcrypt) |
| `role` | `UserRole` | `@default(USER)` | Phân quyền: `USER` hoặc `ADMIN` |
| `createdAt` | `DateTime` | `@default(now())` | Ngày tạo tài khoản |
| `updatedAt` | `DateTime` | `@updatedAt` | Ngày cập nhật gần nhất |

**Quan hệ:**
- `quizzes`: `Quiz[]` - 1 User có thể tạo ra nhiều bài Quiz (vai trò tác giả/Author).
- `attempts`: `QuizAttempt[]` - 1 User có thể tham gia thi nhiều lần.

---

### 3.2. `Quiz` (Bài thi / Đề trắc nghiệm)
Quản lý thông tin cấu hình của một đề thi trắc nghiệm.

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính của Quiz |
| `title` | `String` | Not Null | Tiêu đề bài trắc nghiệm |
| `description` | `String?` | Nullable | Mô tả bài thi / hướng dẫn |
| `authorId` | `String` | FK -> `User(id)` | ID người tạo bài thi |
| `categoryId` | `String?` | FK -> `Category(id)` | ID danh mục chủ đề (Nullable) |
| `status` | `QuizStatus` | `@default(DRAFT)` | Trạng thái: `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `timeLimit` | `Int?` | Nullable | Giới hạn thời gian (phút hoặc giây) |
| `maxAttempts` | `Int?` | Nullable | Số lần làm bài tối đa (null = không giới hạn) |
| `createdAt` | `DateTime` | `@default(now())` | Thời điểm tạo bài |
| `updatedAt` | `DateTime` | `@updatedAt` | Thời điểm chỉnh sửa |

**Quan hệ:**
- `author`: `User` - Tham chiếu đến người tạo.
- `category`: `Category?` - Thuộc về một danh mục cụ thể.
- `questions`: `Question[]` - Danh sách câu hỏi trong đề.
- `attempts`: `QuizAttempt[]` - Lịch sử các lượt thí sinh đã tham gia làm bài này.
- `tags`: `QuizTag[]` - Các tag gắn với bài thi (N-N).

---

### 3.3. `Category` (Danh mục bài thi)
Phân loại bài thi theo môn học, chủ đề lớn (ví dụ: *Lập trình Web*, *Cơ sở dữ liệu*, *Java*, *Tiếng Anh*...).

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính |
| `name` | `String` | Not Null | Tên danh mục hiển thị |
| `slug` | `String` | `@unique` | URL slug thân thiện (vd: `lap-trinh-web`) |
| `createdAt` | `DateTime` | `@default(now())` | Ngày tạo |
| `updatedAt` | `DateTime` | `@updatedAt` | Ngày cập nhật |

---

### 3.4. `Question` (Câu hỏi trong đề)
Lưu nội dung từng câu hỏi thuộc một bài Quiz.

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính câu hỏi |
| `content` | `String` | Not Null | Nội dung câu hỏi |
| `quizId` | `String` | FK -> `Quiz(id)` | Thuộc về bài Quiz nào (`onDelete: Cascade`) |
| `type` | `QuestionType` | `@default(MULTIPLE_CHOICE)` | `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER` |
| `points` | `Float` | `@default(1)` | Điểm số của câu hỏi |
| `order` | `Int` | Not Null | Thứ tự hiển thị câu hỏi (1, 2, 3...) |
| `createdAt` | `DateTime` | `@default(now())` | Ngày tạo |
| `updatedAt` | `DateTime` | `@updatedAt` | Ngày cập nhật |

**Quy tắc:** Khi xóa một Quiz, toàn bộ Question của Quiz đó tự động bị xóa theo nhờ `onDelete: Cascade`.

---

### 3.5. `Answer` (Đáp án lựa chọn)
Lưu danh sách các phương án trả lời cho từng câu hỏi (ví dụ: A, B, C, D).

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính đáp án |
| `content` | `String` | Not Null | Nội dung phương án |
| `questionId` | `String` | FK -> `Question(id)` | Thuộc về câu hỏi nào (`onDelete: Cascade`) |
| `isCorrect` | `Boolean` | `@default(false)` | Đánh dấu đáp án đúng (`true`/`false`) |
| `order` | `Int` | Not Null | Thứ tự đáp án hiển thị (1, 2, 3, 4) |
| `createdAt` | `DateTime` | `@default(now())` | Thời điểm tạo |

---

### 3.6. `QuizAttempt` (Lượt làm bài thi)
Lưu lại mỗi lần một User tham gia làm một bài Quiz.

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính lượt thi |
| `userId` | `String` | FK -> `User(id)` | Thí sinh làm bài |
| `quizId` | `String` | FK -> `Quiz(id)` | Bài Quiz được làm |
| `score` | `Float` | `@default(0)` | Tổng điểm đạt được |
| `totalQuestions`| `Int` | Not Null | Tổng số câu hỏi của đề tại thời điểm thi |
| `correctAnswers`| `Int` | Not Null | Số câu trả lời đúng |
| `startedAt` | `DateTime` | `@default(now())` | Thời điểm bắt đầu vào làm |
| `finishedAt` | `DateTime?` | Nullable | Thời điểm nộp bài (null = đang làm) |
| `status` | `AttemptStatus` | `@default(IN_PROGRESS)` | `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |

---

### 3.7. `UserAnswer` (Chi tiết câu trả lời của thí sinh)
Lưu phương án mà thí sinh đã chọn cho từng câu hỏi trong một lần làm bài.

| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính |
| `attemptId` | `String` | FK -> `QuizAttempt(id)` | Thuộc lượt thi nào (`onDelete: Cascade`) |
| `questionId` | `String` | FK -> `Question(id)` | Đang trả lời cho câu hỏi nào |
| `answerId` | `String?` | FK -> `Answer(id)` | Thí sinh đã chọn đáp án nào (Nullable) |
| `isCorrect` | `Boolean?` | Nullable | Kết quả đúng/sai sau khi chấm |
| `points` | `Float` | `@default(0)` | Điểm số đạt được của câu này |
| `createdAt` | `DateTime` | `@default(now())` | Thời điểm trả lời |

**Ràng buộc duy nhất:** `@@unique([attemptId, questionId])`
> Đảm bảo trong 1 lần làm bài (`QuizAttempt`), thí sinh chỉ có duy nhất 1 bản ghi trả lời cho mỗi câu hỏi (`Question`).

---

### 3.8. `Tag` & `QuizTag` (Thẻ phân loại N-N)
Cho phép gắn nhiều nhãn linh hoạt cho Quiz (ví dụ: `beginner`, `k18`, `react-hook`, `frontend`...).

- **`Tag`**:
  - `id`: UUID khóa chính
  - `name`: Tên nhãn (unique, ví dụ: "Beginner")
  - `slug`: URL slug (unique, ví dụ: "beginner")
- **`QuizTag`** (Bảng trung gian N - N):
  - `quizId`: FK -> `Quiz(id)` (`onDelete: Cascade`)
  - `tagId`: FK -> `Tag(id)` (`onDelete: Cascade`)
  - Khóa chính tổng hợp: `@@id([quizId, tagId])`

---

## 🧩 4. Chi Tiết Các Enum Trong Hệ Thống

```prisma
// 1. Phân quyền người dùng
enum UserRole {
  USER    // Người dùng thông thường (học viên, thí sinh)
  ADMIN   // Quản trị viên hệ thống (giáo viên, admin)
}

// 2. Trạng thái xuất bản bài Quiz
enum QuizStatus {
  DRAFT       // Bản nháp (chỉ người tạo xem & chỉnh sửa được)
  PUBLISHED   // Đã công khai (cho phép mọi người vào làm bài)
  ARCHIVED    // Lưu trữ / Đóng (không nhận thêm lượt thi mới)
}

// 3. Loại câu hỏi
enum QuestionType {
  MULTIPLE_CHOICE // Trắc nghiệm chọn 1 hoặc nhiều đáp án
  TRUE_FALSE      // Đúng / Sai
  SHORT_ANSWER    // Điền câu trả lời ngắn / Tự luận
}

// 4. Trạng thái của một lượt thi
enum AttemptStatus {
  IN_PROGRESS // Đang làm bài (chưa hết giờ, chưa bấm nộp)
  COMPLETED   // Đã nộp bài và chấm điểm xong
  ABANDONED   // Bỏ dở giữa chừng / Hủy lượt thi
}
```

---

## 🛠️ 5. Lệnh Quản Lý Cơ Sở Dữ Liệu Thường Dùng

```bash
# 1. Đồng bộ Schema và tạo Migration mới khi thay đổi file .prisma
npm run db:migrate

# 2. Sinh lại Prisma Client (@prisma/client) để có gợi ý code trong Node.js
npm run db:generate

# 3. Đồng bộ nhanh schema vào DB trực tiếp (không tạo file migration, hữu ích khi test nhanh)
npx prisma db push

# 4. Mở giao diện trực quan Prisma Studio trên trình duyệt để xem và sửa dữ liệu
npx prisma studio

# 5. Kiểm tra tính hợp lệ của toàn bộ schema
npx prisma validate
```

---

## 💡 6. Ví Dụ Truy Vấn Thực Tế Bằng Prisma Client

### Lấy danh sách Quiz đã xuất bản kèm Category và Tags:
```javascript
import { prisma } from "../config/DB.js";

const quizzes = await prisma.quiz.findMany({
  where: { status: "PUBLISHED" },
  include: {
    author: {
      select: { id: true, name: true, avatar: true },
    },
    category: true,
    tags: {
      include: { tag: true },
    },
    _count: {
      select: { questions: true, attempts: true },
    },
  },
});
```

### Bắt đầu một lượt làm bài (`QuizAttempt`):
```javascript
const attempt = await prisma.quizAttempt.create({
  data: {
    userId: currentUserId,
    quizId: targetQuizId,
    totalQuestions: totalQuestionsCount,
    status: "IN_PROGRESS",
  },
});
```

### Nộp bài và lưu câu trả lời của thí sinh:
```javascript
await prisma.$transaction([
  // 1. Lưu các câu trả lời của user
  prisma.userAnswer.createMany({
    data: formattedAnswers,
  }),
  // 2. Cập nhật kết quả lượt thi
  prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score: calculatedScore,
      correctAnswers: totalCorrect,
      finishedAt: new Date(),
      status: "COMPLETED",
    },
  }),
]);
```
