# 🎓 INNO QUIZ — HUBT EDTECH PLATFORM

<p align="center">
  <b>Hệ thống ôn tập, ngân hàng đề thi và tổ chức thi trắc nghiệm trực tuyến thế hệ mới dành riêng cho sinh viên Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT).</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 📋 Mục Lục

- [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
- [2. Cấu trúc học thuật cố định (HUBT Context)](#2-cấu-trúc-học-thuật-cố-định-hubt-context)
- [3. Cấu trúc Monorepo](#3-cấu-trúc-monorepo)
- [4. Các tính năng cốt lõi](#4-các-tính-năng-cốt-lõi)
- [5. Công nghệ sử dụng (Tech Stack)](#5-công-nghệ-sử-dụng-tech-stack)
- [6. Hướng dẫn cài đặt & Khởi chạy (Quick Start)](#6-hướng-dẫn-cài-đặt--khởi-chạy-quick-start)
  - [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
  - [Cài đặt & Chạy Backend](#bước-1-cài-đặt--chạy-quiz-backend)
  - [Cài đặt & Chạy Frontend](#bước-2-cài-đặt--chạy-front-end)
- [7. Kế hoạch phát triển tính năng: Chia phần đề thi (Quiz Sections)](#7-kế-hoạch-phát-triển-tính-năng-chia-phần-đề-thi-quiz-sections)
- [8. Quy chuẩn lập trình & Đóng góp](#8-quy-chuẩn-lập-trình--đóng-góp)

---

## 1. Giới thiệu tổng quan

**Inno Quiz (HUBT Innovation Tech)** là giải pháp công nghệ giáo dục toàn diện được thiết kế riêng nhằm phục vụ nhu cầu học tập, ôn luyện và kiểm tra trắc nghiệm của sinh viên và giảng viên **Trường Đại học Kinh doanh và Công nghệ Hà Nội**.

Hệ thống giải quyết bài toán ôn thi cao điểm, cung cấp kho tài liệu đề thi giữa kỳ, cuối kỳ chuẩn hóa theo từng học phần, cùng các công cụ hỗ trợ thông minh như trích xuất đề thi tự động từ file Word/PDF, phòng thi bấm giờ mô phỏng áp lực thực tế và ôn tập câu hỏi sai.

---

## 2. Cấu trúc học thuật cố định (HUBT Context)

Dữ liệu và giao diện của Inno Quiz tuân theo hệ thống phân cấp chuẩn học chế tín chỉ của HUBT:

```text
HUBT (Trường Đại học Kinh doanh và Công nghệ Hà Nội)
  └── Khoa (CNTT, Kinh tế, Quản trị kinh doanh, Ngôn ngữ Anh...)
        └── Ngành / Chuyên ngành (Kỹ thuật phần mềm, Hệ thống thông tin...)
              └── Môn học (Cơ sở dữ liệu, Cấu trúc dữ liệu và giải thuật...)
                    └── Đề thi (Giữa kỳ, Cuối kỳ, Ôn tập chương...)
                          └── Phần thi (Quiz Sections: Phần 1, Phần 2...)
                                └── Câu hỏi (Trắc nghiệm, Đúng/Sai, Điền từ...)
```

---

## 3. Cấu trúc Monorepo

Dự án được tổ chức thành 2 phân hệ độc lập: Frontend (Giao diện Client) và Backend (Dịch vụ API RESTful).

```text
Quiz-Hubt/
├── front-end/               # Ứng dụng Client SPA (React 19, TypeScript, Tailwind CSS v4, Vite 8)
│   ├── src/
│   │   ├── components/      # UI components tái sử dụng (Header, Sidebar, Notification...)
│   │   ├── features/        # Kiến trúc Feature-based (quizzes, exam, quiz-builder, auth...)
│   │   ├── services/api/    # Axios HTTP Client instance & API calls
│   │   └── store/           # Redux Toolkit store & slices
│   ├── package.json
│   └── README.md
│
├── quiz-backend/            # Máy chủ RESTful API (Node.js, Express 5, Prisma 7, PostgreSQL)
│   ├── src/
│   │   ├── controllers/     # Điều hướng request/response
│   │   ├── services/        # Nghiệp vụ logic chính (Quiz, Exam, User, Subject...)
│   │   ├── prisma/          # Prisma schema module hóa & migrations
│   │   └── middlewares/     # Xác thực JWT, phân quyền, rate limit
│   ├── package.json
│   └── README.md
│
├── QUIZ_SECTIONS_PLAN.md    # Tài liệu kiến trúc & kế hoạch triển khai Quiz Sections
└── README.md                # Tài liệu tổng quan toàn bộ dự án
```

---

## 4. Các tính năng cốt lõi

1. **Khám phá đề thi HUBT (`/explore`, `/quiz`):**
   - Tìm kiếm tức thời theo môn học, khoa/ngành và độ khó.
   - Phân loại trực quan: Đề thi mới nhất, Đề thi nổi bật, Đề thi theo Khoa.

2. **Làm bài & Thi thử trực tuyến (`/exam/:quizId`):**
   - Phòng thi bấm giờ với đồng hồ đếm ngược thông minh.
   - Bảng điều hướng câu hỏi (Question Palette), đánh dấu câu phân vân, nộp bài có xác nhận.
   - Hỗ trợ thi theo từng Phần (Section) độc lập với số câu đánh lại từ đầu (Câu 1/n).

3. **Ôn tập thông minh & Thống kê (`/practice`, `/wrong-questions`, `/history`):**
   - Ôn tập không giới hạn thời gian, hiển thị giải thích chi tiết ngay sau khi chọn đáp án.
   - Hệ thống tự động thu thập và hỗ trợ làm lại ngân hàng câu hỏi sai.
   - Xem lại lịch sử thi, phân tích tỷ lệ chính xác và thời gian hoàn thành.

4. **Trình tạo đề thi Quiz Builder (`/create-quiz`, `/quizzes/:id/edit`):**
   - Bố cục 3 cột chuyên nghiệp: Quản lý danh sách câu hỏi & phần thi (Trái) — Trình soạn thảo (Giữa) — Xem trước Live Preview & Cài đặt (Phải).
   - Hỗ trợ đầy đủ các loại câu hỏi: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Điền đáp án.
   - Cho phép tất cả người dùng tạo và lưu bản nháp (Draft), chỉnh sửa hoặc xuất bản (Publish).

5. **Trích xuất đề từ tài liệu (PDF / DOCX Converter):**
   - Phân tích tự động nội dung file đề thi sẵn có của giảng viên/sinh viên.
   - Nhận diện các đề thi phân chia nhiều Phần (`Phần 1: Trắc nghiệm`, `Phần 2: Đúng/Sai`) và chuẩn hóa thứ tự câu.

---

## 5. Công nghệ sử dụng (Tech Stack)

### Frontend

- **Core:** [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) (`verbatimModuleSyntax`)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- **State Management:** [Redux Toolkit v2](https://redux-toolkit.js.org/)
- **HTTP Client:** [Axios](https://axios-http.com/) với Bearer token interceptor
- **Icons:** [Lucide React](https://lucide.dev/)
- **Xử lý tài liệu:** `mammoth` (DOCX), `pdfjs-dist` (PDF), `xlsx` (Excel)

### Backend

- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules: `"type": "module"`)
- **Framework:** [Express.js v5](https://expressjs.com/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM v7](https://www.prisma.io/) (`@prisma/adapter-pg`)
- **Authentication:** JWT ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)), mật khẩu mã hóa [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **Email Service:** [Nodemailer](https://nodemailer.com/)
- **Tài liệu API:** Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)

---

## 6. Hướng dẫn cài đặt & Khởi chạy (Quick Start)

### Yêu cầu hệ thống

- **Node.js**: Phiên bản `v20.x` hoặc `v22.x LTS` (tối thiểu `v18.x`).
- **PostgreSQL**: Đang chạy cục bộ (port `5432` hoặc `5434`) hoặc trên cloud.
- **npm** (đi kèm Node.js).

---

### Bước 1: Cài đặt & Chạy `quiz-backend`

1. **Di chuyển vào thư mục backend:**

   ```bash
   cd quiz-backend
   ```

2. **Cài đặt các gói phụ thuộc:**

   ```bash
   npm install
   ```

   _(Lệnh postinstall sẽ tự động sinh mã nguồn Prisma Client qua `prisma generate`)_.

3. **Cấu hình biến môi trường (`.env`):**
   Sao chép từ `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Chỉnh sửa các giá trị kết nối PostgreSQL và Port trong `.env`:

   ```env
   BUILD_MODE=development
   PORT=3200
   DATABASE_URL="postgresql://postgres:password@localhost:5432/InnoQuiz?schema=public"
   CORS_ORIGIN=http://localhost:5173
   SECRETKEY_ACCESSTOKEN=your_access_token_secret_key
   SECRETKEY_REFRESHTOKEN=your_refresh_token_secret_key
   ```

4. **Đồng bộ cơ sở dữ liệu:**

   ```bash
   npx prisma db push
   # Hoặc chạy migration
   npm run db:migrate
   ```

5. **Khởi chạy máy chủ Backend:**
   ```bash
   npm run dev
   ```
   API Server sẽ chạy tại: `http://localhost:3200` (hoặc port đã cấu hình).

---

### Bước 2: Cài đặt & Chạy `front-end`

1. **Mở terminal mới và di chuyển vào thư mục frontend:**

   ```bash
   cd front-end
   ```

2. **Cài đặt các gói phụ thuộc:**

   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Kiểm tra hoặc tạo file `.env`:

   ```env
   VITE_BASE_URL=http://localhost:3200/v1
   ```

4. **Khởi chạy máy chủ phát triển (Dev Server):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:5173`. Mở trình duyệt để trải nghiệm Inno Quiz.

---

## 7. Kế hoạch phát triển tính năng: Chia phần đề thi (Quiz Sections)

Hệ thống đang được nâng cấp tính năng **Chia phần đề thi (Quiz Sections)**, cho phép:

- Đề thi chia thành nhiều phần độc lập (Ví dụ: _Phần 1: Trắc nghiệm 50 câu_, _Phần 2: Đúng / Sai 20 câu_).
- Thứ tự câu hỏi được đánh số lại từ `Câu 1` theo từng phần.
- Parser tự động trích xuất cấu trúc phần từ file Word / PDF.
- Phòng thi hỗ trợ điều hướng theo tab phần và modal chuyển phần khi hoàn thành.

👉 Chi tiết kiến trúc Database, API và giao diện được mô tả đầy đủ tại: **[QUIZ_SECTIONS_PLAN.md](./QUIZ_SECTIONS_PLAN.md)**.

---

## 8. Quy chuẩn lập trình & Đóng góp

Để đảm bảo chất lượng mã nguồn và tính ổn định của hệ thống:

- **TypeScript Strict:** Tuyệt đối không sử dụng `any`, không dùng `as any` hay `Record<string, any>`. Luôn khai báo interface/type cụ thể.
- **Thông báo & UI:** Không sử dụng `window.alert()`. Mọi phản hồi phải sử dụng hệ thống Toast nội bộ `useNotification()`.
- **Quyền sở hữu đề thi:** Mọi thao tác chỉnh sửa hoặc xóa đề thi bắt buộc phải kiểm tra quyền tác giả (`quiz.authorId === req.user.id`).
- **Kiểm thử trước khi commit:**

  ```bash
  # Tại thư mục front-end
  npm run build    # Kiểm tra typecheck & build không lỗi

  # Tại thư mục quiz-backend
  npx prisma format
  ```

- **Quy tắc Commit Message:** Tuân thủ chuẩn Conventional Commits:
  - `feat: ...` (Tính năng mới)
  - `fix: ...` (Sửa lỗi)
  - `refactor: ...` (Tái cấu trúc code)
  - `docs: ...` (Cập nhật tài liệu)

---

<p align="center">
  Phát triển bởi <b>Huy Vũ Dev</b> • Dành riêng cho sinh viên <b>Đại học Kinh doanh và Công nghệ Hà Nội</b>
</p>
