# 📚 Quiz App - Backend Server

Hướng dẫn chi tiết cài đặt, cấu hình và triển khai ứng dụng **Backend Server** được xây dựng bằng Node.js (Express 5), Prisma ORM và PostgreSQL.

---

## 🛠️ 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

- **Node.js**: Phiên bản `v18.x` trở lên (Khuyến nghị `v20.x` hoặc `v22.x LTS`).
- **npm**: Đi kèm với Node.js.
- **PostgreSQL**: Cơ sở dữ liệu PostgreSQL đang chạy (Local hoặc Cloud như Supabase, Neon, AWS RDS, Aiven...).

---

## 🚀 2. Hướng dẫn cài đặt & Khởi chạy (Step-by-Step Setup)

### Bước 1: Cài đặt các gói phụ thuộc (Dependencies)
Mở terminal tại thư mục `server` và chạy lệnh:
```bash
npm install
```
> 💡 **Tự động:** Script `postinstall` sẽ tự động thực thi `prisma generate` để sinh mã nguồn Prisma Client ngay sau khi cài đặt.

---

### Bước 2: Cấu hình biến môi trường (`.env`)

Dự án áp dụng chuẩn **12-Factor App**: sử dụng file `.env` cho môi trường cục bộ (Local) và quản lý biến hệ thống khi lên Production.

1. **Tạo file `.env` từ file mẫu `.env.example`:**
   ```bash
   cp .env.example .env
   ```

2. **Cấu hình các thông số trong `.env`:**
   ```env
  

   # Cổng chạy của Server
   PORT=3201

   # Chuỗi kết nối Database PostgreSQL (thay user, password, port, db_name tương ứng)
   DATABASE_URL="postgresql://admin:121205@localhost:5434/DB_test?schema=public"

   # Domain Frontend được phép gọi API (CORS)
   CORS_ORIGIN=http://localhost:5173

   # Khóa bí mật mã hóa JWT Token (Access Token & Refresh Token)
   SECRETKEY_ACCESSTOKEN=your_access_token_secret_key
   SECRETKEY_REFRESHTOKEN=your_refresh_token_secret_key
   ```

> ⚠️ **Bảo mật:** File `.env` chứa mật khẩu và khóa bí mật nên đã được khai báo trong `.gitignore`. Tuyệt đối không commit file `.env` lên GitHub/GitLab.

---

### Bước 3: Cấu hình Cơ sở dữ liệu với Prisma

1. **Khởi tạo và đồng bộ bảng dữ liệu vào PostgreSQL:**
   ```bash
   npm run db:migrate
   ```
   *(Nếu bạn chỉ muốn đồng bộ nhanh schema mà không cần tạo file migration lịch sử, có thể dùng `npx prisma db push`)*.

2. **Sinh lại Prisma Client (nếu có chỉnh sửa trong `schema.prisma`):**
   ```bash
   npm run db:generate
   ```

---

### Bước 4: Khởi chạy Server

- **Chạy môi trường phát triển (Development) - Có Nodemon tự động reload:**
  ```bash
  npm run dev
  ```
  Khi khởi chạy thành công, terminal sẽ thông báo:
  ```text
  [Swagger] Documentation available at: http://localhost:3201/api-docs
  Server lắng nghe ở cổng: 3201
  ```

- **Chạy môi trường Production (Tối ưu hiệu năng):**
  ```bash
  npm start
  ```

---

## 📖 3. Tài liệu API (Swagger UI)

Dự án đã tích hợp sẵn tài liệu tương tác Swagger UI. Khi chạy server ở chế độ Development (`npm run dev`), bạn có thể truy cập:

- **Swagger Documentation:** [http://localhost:3201/api-docs](http://localhost:3201/api-docs)
- **URL chuyển hướng nhanh:** [http://localhost:3201/swagger](http://localhost:3201/swagger)

### Danh sách Endpoint cơ bản (`/v1`):

| Method | Endpoint | Mô tả | Yêu cầu xác thực |
| :--- | :--- | :--- | :---: |
| `POST` | `/v1/auth/register` | Đăng ký tài khoản người dùng mới | ❌ |
| `POST` | `/v1/auth/login` | Đăng nhập hệ thống (nhận Access & Refresh Token) | ❌ |
| `POST` | `/v1/auth/refresh_token` | Cấp mới Access Token từ Refresh Token | ❌ |
| `GET` | `/v1/dashboards` | Lấy thông tin người dùng / Dashboard | ✅ (Bearer Token) |

> 🔒 **Lưu ý bảo mật:** Khi ứng dụng chạy ở chế độ Production (`BUILD_MODE=production`), Swagger UI sẽ tự động bị vô hiệu hóa (trả về lỗi HTTP 403) để tránh lộ thông tin cấu trúc API.

---

## 💻 4. Danh sách lệnh (Scripts Reference)

| Lệnh | Chi tiết thực thi | Mô tả |
| :--- | :--- | :--- |
| `npm run dev` | `cross-env BUILD_MODE=development nodemon src/server.js` | Chạy dev server tự reload + bật Swagger |
| `npm start` | `cross-env BUILD_MODE=production node src/server.js` | Chạy production server qua Node thuần |
| `npm run build` | `prisma generate` | Build step tạo Prisma Client khi deploy |
| `npm run db:generate` | `prisma generate` | Khởi tạo lại Prisma Client |
| `npm run db:migrate` | `prisma migrate dev` | Tạo và áp dụng migration trên máy dev |

---

## 🌐 5. Hướng dẫn Triển khai Production (Deployment)

Khi đưa ứng dụng lên các dịch vụ hosting (Render, Railway, VPS, Docker, AWS, v.v.):

1. **Không tạo file `.env` thủ công trên server.**
2. Nhập trực tiếp các biến môi trường vào phần **Environment Variables / Settings** của hosting:
   - `PORT`: `3201` (hoặc cổng mà hosting tự cấp)
   - `DATABASE_URL`: URL kết nối đến cơ sở dữ liệu PostgreSQL online
   - `CORS_ORIGIN`: Domain trang web Frontend của bạn (ví dụ `https://my-quiz-app.com`)
   - `SECRETKEY_ACCESSTOKEN`: Chuỗi bí mật ngẫu nhiên bảo mật
   - `SECRETKEY_REFRESHTOKEN`: Chuỗi bí mật ngẫu nhiên bảo mật
3. Cấu hình lệnh trên Hosting:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

---

## 📁 6. Cấu trúc thư mục (Project Structure)

```text
server/
├── prisma.config.js     # Cấu hình Prisma CLI
├── .env.example         # File mẫu định nghĩa các biến môi trường
├── .gitignore           # Danh sách các file/thư mục không commit lên Git
├── package.json         # Danh sách thư viện & scripts
├── package-lock.json    # Khóa phiên bản các package
├── README.md            # Tài liệu hướng dẫn dự án
└── src/                 # Mã nguồn chính của ứng dụng
    ├── config/          # Cấu hình hệ thống (CORS, Database, Environment, Swagger)
    ├── controllers/     # Điều hướng và xử lý request/response
    ├── middlewares/     # Middleware xác thực (JWT), phân quyền, xử lý lỗi tập trung
    ├── prisma/          # Schema Prisma và các file migration
    ├── providers/       # Dịch vụ Token, mã hóa và tiện ích mở rộng
    ├── routes/          # Định nghĩa các API endpoints (/v1/auth, /v1/dashboards)
    ├── services/        # Xử lý logic nghiệp vụ và tương tác Database
    ├── utils/           # Hàm tiện ích dùng chung và hằng số
    └── server.js        # Entry point khởi tạo và chạy server Express
```

---

## 🛠️ 7. Công nghệ sử dụng (Tech Stack)

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5
- **ORM & Database**: Prisma 7 (với `@prisma/adapter-pg`), PostgreSQL
- **Bảo mật & Xác thực**: JSON Web Token (`jsonwebtoken`), Mã hóa mật khẩu (`bcrypt`), `cors`
- **Tài liệu API**: Swagger UI (`swagger-jsdoc`, `swagger-ui-express`)
- **Dev Tools**: `nodemon`, `cross-env`, `dotenv`

