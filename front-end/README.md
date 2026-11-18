# 🎓 INNO QUIZ — FRONTEND ARCHITECTURE & DOCUMENTATION

<p align="center">
  <b>Nền tảng tạo, quản lý và thi trắc nghiệm trực tuyến thế hệ mới</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-v2-764ABC?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit" />
</p>

---

## 📋 Mục Lục

- [1. Giới thiệu](#1-giới-thiệu)
- [2. Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
- [3. Cấu trúc thư mục tổng thể](#3-cấu-trúc-thư-mục-tổng-thể)
- [4. Chi tiết các thư mục chính](#4-chi-tiết-các-thư-mục-chính)
- [5. Luồng hoạt động hệ thống (Workflows)](#5-luồng-hoạt-động-hệ-thống-workflows)
- [6. Quy tắc lập trình & Phân chia Code](#6-quy-tắc-lập-trình--phân-chia-code)
- [7. Hướng dẫn cài đặt & Chạy ứng dụng](#7-hướng-dẫn-cài-đặt--chạy-ứng-dụng)

---

## 1. Giới thiệu

**InnoQuiz Frontend** là phần giao diện người dùng (Client-side) thuộc hệ thống **InnoQuiz** — nền tảng quản lý ngân hàng câu hỏi, tạo đề thi và tổ chức thi trắc nghiệm trực tuyến chuyên nghiệp.

### 🎯 Nhiệm vụ chính của Frontend:

- 🎨 **Hiển thị Giao diện & Trải nghiệm (UI/UX)**: Màn hình luyện thi trắc nghiệm, quản lý trang cá nhân, tin tức, liên hệ.
- 🧭 **Điều hướng (Routing)**: Phân tuyến điều hướng thông minh bằng React Router v7.
- ⚡ **Quản lý Trạng thái (State Management)**: Sử dụng **Redux Toolkit** quản lý thông tin xác thực (`authSlice`), `user` và token.
- 🛡️ **Xác thực Real-time & Validation**: Kiểm tra tính hợp lệ của dữ liệu nhập từ Form ngay khi người dùng gõ hoặc rời focus (`auth.validate.ts` kết hợp với Custom Hook `useAuthForm`).
- 📡 **Giao tiếp API (HTTP Client)**: Tương tác với Backend qua `axiosInstance` (`publicAPI` cho không cần auth và `privateAPI` tự động gắn Bearer Token & Interceptors).

> [!NOTE]
> **Kiến trúc Feature-based**: Codebase được tổ chức theo từng tính năng (Feature-based Architecture) giúp dễ dàng mở rộng, bảo trì và phát triển song song.

---

## 2. Công nghệ sử dụng

| Công nghệ               | Phiên bản | Mục đích sử dụng                                                    |
| :---------------------- | :-------- | :------------------------------------------------------------------ |
| ⚛️ **React**            | 19.x      | Thư viện xây dựng giao diện người dùng theo Component               |
| 📘 **TypeScript**       | 5.x       | Đảm bảo tính an toàn kiểu dữ liệu (Type-safety) toàn dự án          |
| ⚡ **Vite**             | 8.x       | Build tool & Dev server siêu tốc                                    |
| 🎨 **Tailwind CSS**     | v4.x      | Utility-first CSS framework cho styling linh hoạt                   |
| 🚥 **React Router**     | v7.x      | Quản lý điều hướng trang và Layouts                                 |
| ⚛️ **Redux Toolkit**    | v2.x      | Quản lý State toàn cục (`store/index.ts`, `store/slices/auth.slice`) |
| 📡 **Axios**            | 1.x       | HTTP Client hỗ trợ Interceptors tự động đính kèm Token            |
| 🎨 **Lucide React**     | Latest    | Thư viện Icon hiện đại, tối ưu dung lượng                           |

---

## 3. Cấu trúc thư mục tổng thể

```text
front-end/
├── public/                     # Static assets (logo, favicon, static icons)
├── src/                        # Mã nguồn chính của ứng dụng
│   ├── assets/                 # Image & Stylesheet tài nguyên (CSS, SVGs, Fonts)
│   ├── components/             # Components giao diện dùng chung
│   │   ├── layout/             # Header, Footer, Taskbar, Navigation
│   │   ├── loading/            # Spinners & Loaders
│   │   └── ui/                 # Core UI Elements (Button, Input, Table, Card, Badge, Modal, ...)
│   ├── features/               # Các mô-đun tính năng chính (Feature-based)
│   │   ├── auth/               # Xác thực: LoginPage.tsx, RegisterPage.tsx
│   │   ├── contact/            # Trang liên hệ & phản hồi
│   │   ├── home/               # Trang chủ & thông tin nền tảng
│   │   ├── news/               # Tin tức, kinh nghiệm luyện thi, cấu trúc đề thi
│   │   └── profile/            # Trang cá nhân (Modular Sub-components)
│   │       └── pages/          # ProfileBanner, ProfileStats, ProfileTabsNav, ProfileInfoTab, ...
│   ├── hooks/                  # Custom React Hooks dùng chung (useAuthForm, ...)
│   ├── layouts/                # Các khung giao diện chung (MainLayout, AuthLayout)
│   ├── router/                 # Cấu hình danh sách tuyến đường (index.tsx & Private Routes)
│   ├── services/               # Cấu hình API Client (Auth.api.ts, ...)
│   ├── store/                  # Quản lý State toàn cục Redux Toolkit
│   │   └── slices/             # Redux slices (auth.slice.ts)
│   ├── types/                  # Định nghĩa TypeScript Interfaces & Types (auth.interface.ts)
│   ├── utils/                  # Utility helper functions & axiosInstance (publicAPI, privateAPI)
│   ├── validations/            # Logic kiểm tra dữ liệu Form (auth.validate.ts)
│   ├── App.css                 # Custom CSSstyles
│   ├── App.tsx                 # Root Component
│   ├── index.css               # Global Tailwind CSS import
│   └── main.tsx                # Entry point ứng dụng React với Redux Provider
│
├── package.json                # Dependencies & npm scripts
├── tsconfig.json               # Cấu hình TypeScript
└── vite.config.ts              # Cấu hình Vite & Tailwind CSS
```

---

## 4. Chi tiết các thư mục chính

### 🧩 4.1. `src/components/` (Shared UI & Layouts)

Chứa các phần tử giao diện dùng chung được chuẩn hóa:

```text
components/
├── layout/     # Header (gắn Redux User), Footer, Taskbar
├── loading/    # Loading indicator cho API call
└── ui/         # Core Elements: Button, Input, Table, Card, Badge
```

### 📦 4.2. `src/features/` (Feature-based Modules)

Phân chia theo nghiệp vụ thực tế của hệ thống:

- **`features/auth/`**: Chứa `LoginPage.tsx` và `RegisterPage.tsx`. Giao diện đăng nhập/đăng ký tích hợp validate real-time.
- **`features/profile/`**: Tách hoàn toàn theo kiến trúc Modular:
  - `ProfileBanner.tsx`: Hiển thị ảnh bìa, avatar, tên người dùng.
  - `ProfileStats.tsx`: Thống kê tổng bài thi, tỷ lệ đúng, điểm trung bình.
  - `ProfileTabsNav.tsx`: Chuyển tab linh hoạt.
  - `ProfileInfoTab.tsx`: Xem và chỉnh sửa thông tin cá nhân.
  - `ProfileHistoryTab.tsx`: Lịch sử làm bài thi.
  - `ProfileProgressTab.tsx`: Tiến độ học tập & huy hiệu.
  - `index.tsx`: Component tổng hợp kết nối các sub-components.

### ⚓ 4.3. `src/hooks/` & `src/validations/`

Sự kết hợp giữa **Custom Hook** và **Pure Validation Functions**:

- **`validations/auth.validate.ts`**: Chứa các hàm validate thuần túy (`emailValidate`, `passwordValidate`, `nameValidate`, `confirmPasswordValidate`, `validateLoginForm`, `validateRegisterForm`).
- **`hooks/useAuthForm.ts`**: Custom Hook quản lý state `values`, `errors`, `touched`, tự động báo lỗi trực tiếp khi đang gõ (`onChange`) và khi rời khỏi ô nhập (`onBlur`).

### 📡 4.4. `src/utils/axiosInstance.ts` & `src/services/`

Hệ thống API Client được cấu hình sẵn 2 luồng:

- **`publicAPI`**: Gọi các endpoint không cần đăng nhập.
- **`privateAPI`**: Tự động đính kèm Token từ `localStorage` vào `Authorization: Bearer <token>` và xử lý làm mới Token/Lỗi 401 tự động.

---

## 5. Luồng hoạt động hệ thống (Workflows)

### 🔄 5.1. Luồng Xác thực & Phân quyền (Authentication Flow)

```text
User ➔ LoginPage / RegisterPage ➔ useAuthForm (validate real-time)
                                          ↓
                                    Auth.api.ts
                                          ↓
                              localStorage (Save Token)
                                          ↓
                              Redux Store (dispatch setUser)
                                          ↓
                              Header (Cập nhật Avatar & Tên) ➔ Router redirect "/"
```

---

## 6. Quy tắc lập trình & Phân chia Code

### 🏷️ 6.1. Quy tắc đặt tên File (Naming Conventions)

| Loại tập tin      | Chuẩn đặt tên                     | Ví dụ                                            |
| :---------------- | :-------------------------------- | :----------------------------------------------- |
| **Component**     | PascalCase                        | `ProfileBanner.tsx`, `Button.tsx`                |
| **Page**          | PascalCase + `Page` / `index.tsx` | `LoginPage.tsx`, `src/features/profile/pages/`  |
| **Hook**          | camelCase + `use` prefix          | `useAuthForm.ts`                                 |
| **Service API**   | PascalCase + `.api` suffix        | `Auth.api.ts`                                    |
| **Redux Slice**   | camelCase + `.slice` suffix       | `auth.slice.ts`                                  |
| **Validate File** | camelCase + `.validate` suffix    | `auth.validate.ts`                               |

---

## 7. Hướng dẫn cài đặt & Chạy ứng dụng

### ⚙️ Yêu cầu hệ thống

- **Node.js**: `v18.x` hoặc `v20.x` trở lên
- **npm**: `v9.x` trở lên

### 🚀 Các bước khởi chạy

1. **Di chuyển vào thư mục front-end**:

   ```bash
   cd front-end
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:

   ```bash
   npm install
   ```

3. **Khởi chạy ứng dụng ở chế độ Development**:

   ```bash
   npm run dev
   ```

   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

4. **Biên dịch cho Production**:
   ```bash
   npm run build
   ```

---

<p align="center">
  Developed with ❤️ by <b>HUBT Innovation Tech Team</b>
</p>
