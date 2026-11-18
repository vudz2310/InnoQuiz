# InnoQuiz Backend — AI Context & Guidelines

> **Tài liệu ngữ cảnh, nghiệp vụ, kiến trúc và quy tắc làm việc dành cho AI Coding Agent trên `quiz-backend`.**
> Trước khi đọc, phân tích, tạo mới, sửa đổi hoặc refactor code backend, AI bắt buộc phải đọc kỹ tài liệu này và kiểm tra database schema thực tế.

---

## 1. Tổng quan dự án & Nghiệp vụ hệ thống

**InnoQuiz** là nền tảng quản lý đề thi, ôn luyện và làm bài trắc nghiệm trực tuyến (tương tự EduQuiz, Quizizz, Kahoot) được phát triển bởi **HUBT Innovation Tech**.

### Các Domain nghiệp vụ chính:
1. **User & Authentication:**
   * Quản lý tài khoản: Thí sinh/Sinh viên (`USER`), Quản trị viên/Giáo viên (`ADMIN`).
   * Xác thực bằng JWT (Access Token + Refresh Token). Mật khẩu mã hóa bằng `bcrypt`.
2. **Category & Tag:**
   * Phân loại bài thi theo chuyên mục (Lập trình, Toán học, Tiếng Anh, v.v.).
   * Gắn thẻ từ khóa tìm kiếm nhanh (`Tag`, `QuizTag`).
3. **Quiz (Đề thi / Bài trắc nghiệm):**
   * Quản lý bài thi: Tiêu đề, mô tả, tác giả (`authorId`), danh mục (`categoryId`), thời gian làm bài (`timeLimit` tính bằng phút), số lượt làm tối đa (`maxAttempts`).
   * Trạng thái bài thi (`QuizStatus`): `DRAFT` (Bản nháp), `PUBLISHED` (Đã xuất bản - công khai), `ARCHIVED` (Lưu trữ).
4. **Question & Answer (Ngân hàng câu hỏi & đáp án):**
   * Loại câu hỏi (`QuestionType`): `MULTIPLE_CHOICE` (Trắc nghiệm nhiều lựa chọn), `TRUE_FALSE` (Đúng / Sai), `SHORT_ANSWER` (Điền đáp án ngắn).
   * Điểm số mỗi câu (`points`), thứ tự hiển thị (`order`).
   * Danh sách các đáp án (`Answer`): nội dung (`content`), cờ đúng/sai (`isCorrect`), thứ tự (`order`).
5. **Quiz Attempt & Exam Engine (Lượt thi & Chấm điểm):**
   * Theo dõi phiên thi của người dùng: bắt đầu (`startedAt`), kết thúc (`finishedAt`), trạng thái (`AttemptStatus`: `IN_PROGRESS`, `COMPLETED`, `ABANDONED`).
   * Chi tiết câu trả lời của thí sinh (`UserAnswer`): câu hỏi đã chọn, đáp án đã chọn, cờ đúng/sai, số điểm đạt được.
   * Tính điểm tự động dựa trên tổng số câu hỏi và câu trả lời đúng.
6. **Security & Session Management (Bảo mật & Quản lý phiên):**
   * Quản lý phiên đăng nhập thiết bị (`UserSession`): token hashing, IP, User-Agent, vị trí, trạng thái thu hồi phiên (`isRevoked`).
   * Nhật ký & Cảnh báo an ninh (`SecurityEvent`, `SecurityAlert`): phát hiện đăng nhập bất thường, brute-force, thay đổi mật khẩu/email.
   * Quản lý danh sách chặn (`BlockedIdentifier`): chặn theo IP, Email, User ID với thời hạn và lý do rõ ràng.
   * Cài đặt bảo mật hệ thống linh hoạt (`SecuritySetting`) và Nhật ký thao tác Admin (`AdminAuditLog`).

---

## 2. Tech Stack & Hiện trạng Repository

| Thành phần | Công nghệ / Thư viện | Ghi chú |
| :--- | :--- | :--- |
| **Runtime** | Node.js (ES Modules: `"type": "module"`) | Dùng cú pháp `import / export` |
| **Framework** | Express.js v5 | Xử lý routing, middleware |
| **Database** | PostgreSQL | Chạy qua Docker hoặc local service |
| **ORM** | Prisma ORM v7 | Schema module hóa trong `src/prisma/` |
| **Driver Adapter** | `@prisma/adapter-pg` + `pg` | Connection pooling qua node-postgres |
| **Authentication** | `jsonwebtoken`, `bcrypt` | JWT Bearer Token |
| **Status Codes** | `http-status-codes` | Chuẩn hóa HTTP Response Status |
| **Documentation** | `swagger-ui-express`, `swagger-jsdoc` | Route `/api-docs` (chỉ bật ở dev mode) |
| **Dev Tools** | `nodemon`, `cross-env` | Script `npm run dev` |

---

## 3. Kiến trúc Backend (3-Layer Clean Architecture)

Backend tuân thủ nghiêm ngặt mô hình phân tầng:

```text
HTTP Request (Client)
       ↓
Middleware (CORS, Express JSON, Auth verifyToken, Error Handling)
       ↓
Routes (`src/routes/`)
       ↓
Controllers (`src/controllers/`)
       ↓
Services (`src/services/`)
       ↓
Prisma Client (`src/config/DB.js`)
       ↓
PostgreSQL Database
```

### Chi tiết các tầng:

1. **`src/config/`**:
   * `DB.js`: Khởi tạo `pg.Pool`, `PrismaPg` adapter và export `prisma` instance dùng chung.
   * `environment.js` / `utils/constants.js`: Quản lý biến môi trường (`PORT`, `DATABASE_URL`, `BUILD_MODE`, secret keys).
   * `corsOptions.js`: Cấu hình domain được phép gọi API.
2. **`src/middlewares/`**:
   * `auth.middleware.js`: Kiểm tra Bearer JWT Token, giải mã payload và gán vào `req.jwtDecoded` hoặc `req.user`.
   * `errorHandlingMiddleware.js`: Bắt lỗi tập trung (Error Handler), định dạng response lỗi chuẩn.
3. **`src/routes/`**:
   * Định nghĩa URL endpoint, gắn middleware bảo vệ (`verifyToken`) và gọi controller tương ứng.
   * Tất cả routes được tổng hợp tại `src/routes/index.js` và mount vào `server.js` dưới cả 2 prefix: `app.use(['/v1', '/api/v1'], indexRouter)`.
4. **`src/controllers/`**:
   * Nhận `req` (params, query, body), validate dữ liệu đầu vào.
   * Gọi Service xử lý logic nghiệp vụ.
   * Trả về HTTP status code (`http-status-codes`) và JSON payload.
   * Luôn bọc trong khối `try...catch` và chuyển lỗi sang `next(error)`.
5. **`src/services/`**:
   * Chứa toàn bộ **Business Logic** và các truy vấn Prisma (`prisma.<model>.findMany`, `create`, `update`, etc.).
   * Không phụ thuộc vào Express `req` hay `res`.

---

## 4. Cấu trúc thư mục chi tiết (`quiz-backend/`)

```text
quiz-backend/
├── src/
│   ├── config/
│   │   ├── DB.js                   # Prisma Client + pg Pool
│   │   ├── corsOptions.js          # CORS whitelist
│   │   ├── environment.js          # Load env vars
│   │   └── swagger.js              # Cấu hình Swagger OpenAPI
│   ├── controllers/
│   │   ├── auth.controller.js      # Đăng ký, đăng nhập, refresh token
│   │   ├── category.controller.js  # Lấy danh sách danh mục
│   │   ├── quiz.controller.js      # Lấy danh sách đề thi, lọc, tìm kiếm
│   │   ├── question.controller.js  # Thêm, sửa, xóa câu hỏi
│   │   ├── attempt.controller.js   # Bắt đầu, nộp bài, kết quả, lịch sử
│   │   ├── user.controller.js      # Thông tin user cá nhân
│   │   ├── upload.controller.js    # Upload ảnh
│   │   └── profile.controller.js   # Cập nhật hồ sơ
│   ├── middlewares/
│   │   ├── authMiddleware.js       # Xác thực JWT (verifyToken, optionalAuth)
│   │   ├── uploadMiddleware.js     # Multer config cho upload
│   │   └── errorHandlingMiddleware.js # Bắt lỗi tập trung
│   ├── prisma/
│   │   ├── base.prisma             # datasource db, generator client
│   │   ├── User.prisma             # Model User, Enum UserRole
│   │   ├── Category.prisma         # Model Category
│   │   ├── Quiz.prisma             # Model Quiz, Enum QuizStatus
│   │   ├── Question.prisma         # Model Question, Enum QuestionType
│   │   ├── Answer.prisma           # Model Answer
│   │   ├── QuizAttempt.prisma      # Model QuizAttempt, UserAnswer, Enum AttemptStatus
│   │   ├── Tag.prisma              # Model Tag, QuizTag
│   │   ├── EmailVerification.prisma # Model EmailVerification (OTP)
│   │   ├── seed.js                 # Script seed dữ liệu mẫu (bao gồm câu hỏi và đáp án)
│   │   ├── seedAnswers.js          # Script thêm đáp án vào câu hỏi chưa có đáp án
│   │   └── migrations/             # Lịch sử migration Prisma
│   ├── routes/
│   │   ├── index.js                # Router tổng hợp
│   │   ├── auth.route.js           # /auth
│   │   ├── category.route.js       # /categories
│   │   ├── quiz.route.js           # /quizzes
│   │   ├── question.route.js       # /questions
│   │   ├── attempt.route.js        # /attempts
│   │   ├── user.route.js           # /users
│   │   ├── profile.route.js        # /profile
│   │   └── upload.route.js         # /upload
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── category.service.js
│   │   ├── quiz.service.js
│   │   ├── question.service.js
│   │   ├── attempt.service.js      # Quiz Attempt Engine: startAttempt, submitAttempt, getAttemptResult, getUserHistory
│   │   ├── dashboard.service.js
│   │   ├── mail.service.js         # Gửi email OTP qua Gmail SMTP
│   │   ├── otp.service.js          # Tạo, lưu, xác minh OTP
│   │   ├── user.service.js
│   │   └── profile.service.js
│   ├── utils/
│   │   └── constants.js
│   └── server.js                   # Entry point server Express
├── uploads/                        # Thư mục lưu ảnh upload (phục vụ static tại /uploads)
├── database.sql                    # File SQL schema trích xuất đầy đủ
├── package.json
└── prisma.config.js
```

---

## 5. Quy chuẩn Thiết kế API & Format Phản hồi

### Chuẩn hóa Response JSON:
* **Thành công (Success):**
  ```json
  {
    "success": true,
    "data": { ... } // hoặc mảng [ ... ]
  }
  ```
* **Thất bại / Lỗi (Error):**
  ```json
  {
    "statusCode": 400,
    "message": "Thông báo lỗi chi tiết dành cho client",
    "stack": "..." // Chỉ hiển thị khi BUILD_MODE !== 'production'
  }
  ```

### Quy chuẩn API Danh sách & Phân trang BẮT BUỘC (MANDATORY PAGINATION):
> **QUY TẮC BẮT BUỘC:** Mọi API lấy danh sách (Collection / List endpoints) ở cả Client, Admin và Teacher **BẮT BUỘC PHẢI HỖ TRỢ PHÂN TRANG (PAGINATION)**. Tuyệt đối không viết các truy vấn `prisma.<model>.findMany` không giới hạn (`unbounded queries`) gây sập database hoặc nghẽn băng thông.

* **Query Params chuẩn:**
  * `page` (default: 1, integer >= 1)
  * `limit` (default: 10 hoặc 15, max: 100)
  * `search` (chuỗi tìm kiếm)
  * Các bộ lọc chuyên biệt (`majorId`, `cohort`, `status`, `categoryId`, v.v.)
* **Logic Service chuẩn:**
  * Chạy song song `prisma.<model>.findMany({ skip: (page - 1) * limit, take: limit, where, orderBy })` và `prisma.<model>.count({ where })`.
* **Cấu trúc payload trả về chuẩn hóa 100%:**
  ```json
  {
    "success": true,
    "data": {
      "items": [ ... ],
      "total": 128,
      "page": 1,
      "limit": 15,
      "totalPages": 9
    }
  }
  ```

---

## 6. Quy tắc Vàng cho AI Coding Agent (BẮT BUỘC TUÂN THỦ)

1. **Bảo mật dữ liệu:**
   * **Tuyệt đối KHÔNG** trả về `password`, secret keys trong bất kỳ API nào (sử dụng Prisma `select` để chọn rõ ràng các cột).
   * **Tuyệt đối KHÔNG** trả về `isCorrect` của `Answer` khi trả danh sách câu hỏi cho thí sinh đang làm bài thi.
2. **Không tự ý phá vỡ Prisma Schema:**
   * Các model đã có quan hệ chặt chẽ: `User` -> `Quiz` -> `Question` -> `Answer`, `Quiz` -> `QuizAttempt` -> `UserAnswer`.
   * Khi cần migrate: dùng `npx prisma db push` hoặc `npx prisma migrate dev`.
3. **Import đúng Prisma Client:**
   * Luôn import prisma từ: `import { prisma } from "../config/DB.js";` (không import trực tiếp từ `@prisma/client` trong services).
4. **Không đưa Business Logic vào Controller hay Route:**
   * Controller chỉ parse dữ liệu và trả response; toàn bộ query database và logic tính toán phải nằm trong `services/`.
5. **Xử lý lỗi Async:**
   * Mọi hàm controller async đều phải có `try...catch(error) { next(error); }`.
6. **Kiểm tra trạng thái bài thi (`QuizStatus`):**
   * Các API công khai cho thí sinh chỉ được lấy `status: "PUBLISHED"`. Không trả về các bài thi `DRAFT` hoặc `ARCHIVED`.
7. **Mọi User đã đăng nhập đều có quyền Tạo Quiz:**
   * Không giới hạn quyền tạo đề thi cho `ADMIN` hay `TEACHER`. Bất kỳ sinh viên/người dùng nào đã xác thực đều có thể tạo Quiz, lưu Draft, chỉnh sửa và Publish đề thi của chính mình.
   * Quyền chỉnh sửa, cập nhật hoặc xóa Quiz của người dùng được xác định dựa trên: `authorId === req.user.id`.

---

## 7. Quy chuẩn Commit & Quy trình Quản lý Nhánh Git (Git Branching & Commit Workflow)

> **QUY TẮC BẮT BUỘC TỪ BÂY GIỜ:** Mọi thay đổi code trên repository `quiz-backend` bắt buộc phải tuân theo đúng định dạng Commit tiếng Việt và quy trình luân chuyển nhánh Git tiêu chuẩn.

### 7.1. Định dạng Tiền tố Commit (Commit Prefix Convention)
* `feat: <nội dung>` — Khi phát triển tính năng mới (New Feature).
* `update: <nội dung>` — Khi nâng cấp, cải tiến hoặc cập nhật tính năng đã có.
* `fix: <nội dung>` hoặc `hotfix: <nội dung>` — Khi sửa lỗi logic, API, database hoặc bảo mật.
* `delete: <nội dung>` — Khi xóa bỏ tính năng, tệp tin hoặc logic cũ không còn sử dụng.
* `refactor: <nội dung>` — Khi tái cấu trúc mã nguồn mà không làm thay đổi hành vi nghiệp vụ.
* `docs: <nội dung>` — Khi cập nhật tài liệu hoặc `AI_CONTEXT.md`.

### 7.2. Quy trình Luân chuyển Nhánh Git Chuẩn (Branching Strategy for BE)
1. **Tạo nhánh tính năng (Feature Branch):**
   - Trước khi thực hiện task, luôn tạo nhánh tính năng từ `develop` hoặc `master` với tiền tố `feature/<tên-tính-năng>` (hoặc `fix/<tên-lỗi>`) nếu nhánh đó chưa tồn tại.
   - Ví dụ: `git checkout -b feature/security-session-management`
2. **Commit công việc:**
   - Commit toàn bộ các thay đổi vào chính nhánh tính năng đó với format tiếng Việt quy chuẩn.
3. **Merge vào nhánh `develop`:**
   - Sau khi hoàn thành logic và kiểm tra kết nối API, chuyển sang nhánh `develop` và merge nhánh tính năng vào:
   ```bash
   git checkout develop
   git merge feature/<tên-tính-năng> --no-ff -m "merge: hop nhat feature/<tên-tính-năng> vao nhanh develop"
   ```
4. **Merge từ `develop` vào `master`:**
   - Chuyển sang nhánh `master` và merge `develop` vào:
   ```bash
   git checkout master
   git merge develop --no-ff -m "merge: hop nhat nhanh develop vao master"
   ```

