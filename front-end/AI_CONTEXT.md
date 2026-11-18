# INNO QUIZ — HUBT UI/UX REDESIGN & SYSTEM ARCHITECTURE
## TÀI LIỆU AI CONTEXT & QUY CHUẨN PHÁT TRIỂN TOÀN DIỆN (FRONTEND & UX)

> **QUY TẮC BẮT BUỘC:** Mỗi lần AI Coding Agent thực thi bất kỳ yêu cầu, prompt hay task nào trên repository, **BẮT BUỘC PHẢI ĐỌC VÀ TUÂN THỦ TỪ ĐẦU ĐẾN CUỐI** tài liệu này.

---

### 0. VAI TRÒ CỦA AI CODING AGENT
Bạn đóng vai trò là **Senior Product Designer + Senior Frontend Engineer** phát triển **Inno Quiz** — nền tảng quiz/test trực tuyến dành riêng cho **Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT)**.
* **Tham khảo EduQuiz:** Sử dụng EduQuiz để học hỏi về Information Architecture, Quiz Discovery, Quiz Detail, Exam Taking, Quiz Creation, Quiz Management, Result Presentation.
* **KHÔNG CLONE NGUYÊN BẢN:** Inno Quiz phải có bản sắc riêng, bảng màu thương hiệu riêng, UX tối ưu cho sinh viên HUBT và cấu trúc học phần đại học.

---

### 1. PRODUCT SCOPE — BẮT BUỘC (CONTEXT HUBT CỐ ĐỊNH)
* **Inno Quiz chỉ phục vụ:** Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT).
* **Tuyệt đối KHÔNG** thiết kế như nền tảng quiz đa trường (không tạo flow "Chọn trường → Đại học A → Đại học B").
* **Cấu trúc dữ liệu và phân cấp học thuật cố định:**
  ```text
  HUBT (Đại học Kinh doanh và Công nghệ Hà Nội)
    └── Khoa (Khoa CNTT, Khoa Kinh tế, Khoa Quản trị...)
          └── Ngành (Kỹ thuật phần mềm, Hệ thống thông tin...)
                └── Môn học (Cơ sở dữ liệu, Cấu trúc dữ liệu...)
                      └── Đề thi (Giữa kỳ, Cuối kỳ, Ôn tập chương...)
                            └── Câu hỏi (Trắc nghiệm, Đúng/Sai...)
  ```
* **Cảm nhận của người dùng:** *"Đây là kho đề thi và hệ thống ôn tập chính thức dành cho sinh viên HUBT."*

---

### 2. MỤC TIÊU VÀ 5 HÀNH ĐỘNG CỐT LÕI
1. **Khám phá đề thi HUBT** (Tìm theo Môn học, Khoa/Ngành, Độ khó).
2. **Làm bài và Thi thử** (Mô phỏng áp lực phòng thi thật).
3. **Ôn tập theo môn học** (Học từng chương, xem giải thích chi tiết, flashcard, luyện câu sai).
4. **Tạo và quản lý đề thi** (Soạn đề, lưu nháp, xuất bản công khai).
5. **Theo dõi tiến độ & Lịch sử học tập** (Xem lại kết quả thi, phân tích điểm mạnh/yếu).
* **Lưu ý:** Không biến sản phẩm thành Admin Dashboard. Admin là khu vực quản trị riêng biệt.

---

### 3. BUSINESS RULES & PHÂN QUYỀN (QUAN TRỌNG NHẤT)
* **TẤT CẢ USER ĐÃ ĐĂNG NHẬP ĐỀU CÓ QUYỀN TẠO ĐỀ THI:**
  - Sinh viên thông thường hay giảng viên đều có quyền: Tạo Draft, Chỉnh sửa đề của mình, Publish đề lên Kho đề công khai, Xóa đề của mình.
* **Quy tắc sở hữu (Ownership):**
  - Backend bắt buộc kiểm tra: `quiz.authorId === req.user.id`.
  - Frontend chỉ ẩn/hiện nút Edit/Delete để tăng UX, không coi ẩn nút trên UI là giải pháp bảo mật.
* **Quy tắc Điều hướng & Đa vai trò (Multi-Role Navigation):**
  - Tài khoản Admin và Teacher là người dùng toàn quyền xem xét hệ thống: được phép xem chi tiết đề thi (`/quiz/:id`), làm bài/thi thử, xem trang cá nhân, sử dụng bộ chuyển đổi PDF mà không bị redirect cưỡng chế.
  - Cung cấp nút chuyển đổi nhanh giữa Cổng Quản trị/Giảng viên và Cổng Khám phá đề thi trên Header và Sidebar.

---

### 4. TECH STACK HIỆN TẠI (TUÂN THỦ 100%)
* **Frontend:** React 19, TypeScript (`verbatimModuleSyntax: true`), React Router DOM v7, Tailwind CSS v4 (`@tailwindcss/vite`), Redux Toolkit, Axios, `lucide-react`.
* **Backend:** Node.js, Express.js v5, Prisma ORM v7, PostgreSQL.
* **Nguyên tắc kỹ thuật:**
  - Không tự ý cài thêm UI framework lớn (AntD, MUI, Chakra) hay State Manager khác (Zustand, Recoil).
  - Sử dụng Type-Only Import: `import type { Quiz } from "..."`.
  - Giữ vững instance Axios chuẩn tại `src/utils/axiosInstance.ts`.

---

### 4.1. QUY TẮC KIỂU DỮ LIỆU TYPESCRIPT

Trong toàn bộ mã TypeScript/React, tuyệt đối không sử dụng `any`. Luôn ưu tiên kiểu dữ liệu cụ thể, generic có ràng buộc, hoặc `unknown` kết hợp với type guard/interface rõ ràng. Không dùng `as any`, `Promise<any>`, `Record<string, any>` hay `catch (error: any)` để né kiểm tra kiểu; nếu dữ liệu từ API hoặc tệp import chưa chắc chắn, phải kiểm tra và thu hẹp kiểu trước khi sử dụng.

### 4.2. QUY CHUẨN THÔNG BÁO HỆ THỐNG & CHỐNG TRÙNG LẶP (NOTIFICATION & TOAST GUIDELINES)

* **TUYỆT ĐỐI CẤM SỬ DỤNG `window.alert()`, `confirm()` HOẶC `prompt()`:**
  - Không bao giờ được dùng hàm `alert()` mặc định của trình duyệt trong bất kỳ logic hoặc component nào. `alert()` làm đứng luồng UI, mất thẩm mỹ và phá vỡ phong cách thiết kế hiện đại của InnoQuiz HUBT.
* **BẮT BUỘC SỬ DỤNG HỆ THỐNG NOTIFICATION NỘI BỘ (`src/components/Notification`):**
  - Mọi phản hồi hành động (Success, Error, Warning, Info) phải gọi qua custom hook `useNotification()`:
    * `showSuccess(title: string, message?: string)`: Dùng khi thao tác thành công (Lưu bản nháp, xuất bản đề thi, sao chép văn bản, cập nhật profile, đăng nhập...).
    * `showError(title: string, message?: string)`: Dùng khi xảy ra lỗi API, lỗi đọc tệp, ngoại lệ xử lý dữ liệu...
    * `showWarning(title: string, message?: string)`: Dùng khi người dùng chưa điền đủ trường bắt buộc, cảnh báo số lượng đáp án/phần thi, cảnh báo thoát...
    * `showInfo(title: string, message?: string)`: Dùng cho thông báo chỉ dẫn, tính năng đang phát triển/đồng bộ cổng HUBT...
    * `addNotification(data)`: Thêm thông báo lưu vào chuông thông báo (Notification Center Dropdown) khi có sự kiện hệ thống cần lưu lại lịch sử.
* **CƠ CHẾ CHỐNG TRÙNG LẶP THÔNG BÁO (DEDUPLICATION):**
  - `NotificationContext` đã tích hợp bộ đệm tự động (deduplication cache): bỏ qua các toast hoặc notification có cùng nội dung (`type`, `title`, `message`) nếu được kích hoạt liên tiếp trong khoảng thời gian ngắn (1.5s - 2s). Điều này ngăn chặn triệt để hiện tượng thông báo bị nhân đôi do:
    1. React 18/19 StrictMode kích hoạt `useEffect` hai lần trong môi trường phát triển (Dev).
    2. Người dùng nhấp chuột liên tục (double click) vào nút submit/action.
    3. Nhiều hàm xử lý sự kiện hoặc Axios Interceptors bắt cùng một mã lỗi đồng thời.
  - **Quy tắc khi viết code component:**
    * Nếu cần kích hoạt toast trong `useEffect`, luôn đảm bảo có dependency chính xác hoặc dùng `useRef` cờ kiểm soát chỉ hiển thị một lần.
    * Với các nút thao tác bất đồng bộ (Lưu nháp, Xuất bản, Upload, Submit), luôn quản lý trạng thái `loading` hoặc `disabled` để ngăn người dùng kích hoạt 2 lần.
    * Phân biệt rõ giữa Toast tức thời (`showSuccess` / `showError`) và Notification lưu trữ lâu dài trong chuông (`addNotification`). Tránh gọi cả hai cùng lúc cho cùng một hành động trừ khi hành động đó thực sự cần lưu vào lịch sử tài khoản.

### 4.3. QUY CHUẨN PHÂN TRANG BẮT BUỘC (MANDATORY PAGINATION GUIDELINES)

> **QUY TẮC BẮT BUỘC TỪ BÂY GIỜ:** Bất cứ trang nào có hiển thị danh sách dữ liệu (Table, List, Grid Cards) đều **BẮT BUỘC PHẢI CÓ PHÂN TRANG (PAGINATION)**. Tuyệt đối không được render danh sách dài vô hạn hoặc load toàn bộ dữ liệu cùng lúc.

* **Áp dụng cho 100% các màn hình có danh sách:**
  - Kho đề thi công khai (`/quiz`, `/explore`), Đề thi của tôi (`/my-quizzes`), Lịch sử thi (`/history`), Ngân hàng câu hỏi (`/practice-bank`, `/wrong-questions`), Flashcards.
  - Quản trị Admin & Giảng viên: Quản lý Ngành (`/admin/majors`), Quản lý Lớp (`/admin/classes`), Quản lý Sinh viên (`/admin/students`), Quản lý Giảng viên (`/admin/teachers`), Quản lý Môn học (`/admin/subjects`), Quản lý Đề thi (`/admin/quizzes`), Phòng thi trực tuyến (`/exam-rooms`), Nhật ký hoạt động & Báo cáo.
* **Quy chuẩn UI/UX Phân trang:**
  - **Thanh điều hướng phân trang chuẩn:** Hiển thị rõ ràng `Trang X / Y` kèm thông tin tổng số bản ghi (`Tổng cộng Z bản ghi`).
  - **Nút chuyển trang:** Nút Trang trước (`<`), Trang sau (`>`), Nút trang đầu (`<<`), Nút trang cuối (`>>`) và các nút số trang kèm dấu chấm lửng (`...`) khi có nhiều trang.
  - **Tùy chọn số lượng bản ghi / trang (Page Size):** Cho phép người dùng chuyển đổi linh hoạt (10, 15, 20, 50 bản ghi/trang).
  - **Trạng thái chuyển trang mượt mà:** Hiển thị Skeleton loader hoặc spinner khi chuyển trang, tự động scroll nhẹ lên đầu danh sách để người dùng tiện theo dõi.
  - **Đồng bộ URL Params:** Luôn lưu `page` và `limit` vào URL query params (ví dụ: `?page=2&limit=15`) để hỗ trợ F5, back/forward trình duyệt và chia sẻ đường dẫn chính xác.

### 4.4. QUY CHUẨN OPTION SELECT BẮT BUỘC KÈM Ô TÌM KIẾM (MANDATORY SEARCHABLE SELECT GUIDELINES)

> **QUY TẮC BẮT BUỘC TỪ BÂY GIỜ:** Mọi option chọn bất kỳ một mục nào (Dropdown Select, Combobox, Filter Picker, Form Select) gồm: Chọn Ngành, Chọn Lớp, Chọn Khóa, Chọn Môn học, Chọn Khoa, Chọn Giảng viên, Chọn Thẻ tag, Chọn Đề thi, Chọn Quyền hạn/Trạng thái... **BẮT BUỘC PHẢI GẮN KÈM Ô TÌM KIẾM (SEARCH INPUT)**.

* **Tuyệt đối CẤM:**
  - Không sử dụng thẻ `<select>` mặc định của HTML trần trụi cho các danh sách danh mục/dữ liệu động. Thẻ `<select>` mặc định không có ô tìm kiếm, không gõ lọc được tiếng Việt có dấu/không dấu, UI thô cứng và làm giảm trải nghiệm người dùng HUBT.
* **Quy chuẩn Component `SearchableSelect` (`src/components/ui/searchable-select`):**
  - **Tích hợp ô tìm kiếm tức thì:** Tự động focus vào ô tìm kiếm khi mở popup, lọc tức thì không giật lag.
  - **Hỗ trợ tìm kiếm thông minh:** Khớp cả tiếng Việt có dấu, không dấu (`removeVietnameseTones`), mã viết tắt (ví dụ gõ "cntt" ra "Công nghệ thông tin", gõ "k28" ra "Khóa 28"), badge, subLabel.
  - **Trực quan hóa lựa chọn:** Hiển thị Badge mã số (`CNTT`, `K28`, `TH28.01`), Tên chính (`label`), Mô tả phụ (`subLabel`), Đếm số lượng con (`count`).
  - **UX/UI chuẩn EdTech:** Đóng khi click ra ngoài (`useClickOutside`), hỗ trợ nút xóa nhanh (`handleClear`), empty state thân thiện khi không tìm thấy kết quả kèm gợi ý từ khóa, badge trạng thái chọn rõ ràng (`Check` icon).
  - **Áp dụng toàn diện:** Cả trong Form modal (Thêm/Sửa Lớp, Ngành, Sinh viên, Giảng viên, Đề thi, Profile, Register) và trên thanh Filter Bar của các trang Quản lý / Khám phá.

### 4.5. QUY CHUẨN BẢO MẬT & QUẢN LÝ PHIÊN (SECURITY & SESSION MANAGEMENT GUIDELINES)

* **Quản trị Bảo mật Hệ thống (`/admin/security`):**
  - Giám sát sự kiện bảo mật (`SecurityEvent`), cảnh báo nguy cơ cao (`SecurityAlert`), nhật ký thao tác quản trị (`AdminAuditLog`).
  - Quản lý danh sách chặn định danh (`BlockedIdentifier`: IP, Email, User).
  - Tinh chỉnh cài đặt bảo mật động (`SecuritySetting`): giới hạn số phiên đồng thời, tự động khóa khi sai mật khẩu, thời hạn hiệu lực OTP.
* **Bảo mật Tài khoản Cá nhân (`/profile` -> Tab Bảo mật):**
  - Hiển thị danh sách thiết bị và phiên đăng nhập hiện tại (`UserSession`) với thông tin IP, trình duyệt, OS, vị trí địa lý.
  - Hỗ trợ đăng xuất từ xa từng thiết bị hoặc đăng xuất tất cả các thiết bị khác.
  - Nhật ký hoạt động đăng nhập và đổi mật khẩu với cảnh báo màu sắc trực quan.

### 5. UI/UX DIRECTION & DESIGN SYSTEM
* **Phong cách:** EdTech hiện đại, sạch sẽ, chuyên nghiệp, **Content-First**, dễ scan thông tin.
* **Bảng màu & Theme ("Trắng ra trắng, Đen ra đen"):**
  - **Light Mode (Mặc định):** Background `#FFFFFF` hoặc `#F8FAFC`. Card nền trắng, viền mỏng `border-slate-200`, chữ `slate-900`, chữ phụ `slate-500`. Không để nền xám đục.
  - **Dark Mode:** Background `#090D1A`, card `#111827`, viền `#1E293B`, chữ `slate-100`.
  - **Primary Brand:** Xanh tím `#4F46E5` (Indigo-600) / Active `#818CF8`.
* **Tuyệt đối KHÔNG:**
  - Không lạm dụng gradient màu mè, glassmorphism lòe loẹt, đổ bóng nặng.
  - Không dùng animation chạy liên tục gây mất tập trung khi làm bài.
  - Không dùng icon cầu vồng đa màu trên Sidebar (đồng bộ màu trung tính `slate-400` / active Indigo).
  - Không thiết kế kiểu landing page marketing với Hero banner khổng lồ chiếm nửa màn hình.

---

### 6. HUBT INFORMATION ARCHITECTURE & MENU NAVIGATION

```text
┌──────────────────────────┐
│  Inno Quiz               │
│  HUBT EDTECH             │
├──────────────────────────┤
│                          │
│ KHÁM PHÁ                 │
│ 🔥 Khám phá              │  -> /explore (Trang tổng quan đề thi HUBT)
│ 📚 Kho đề thi            │  -> /quiz (Tìm toàn bộ đề thi công khai)
│ 📖 Môn học               │  -> /subjects (Danh mục môn học HUBT)
│ 🏫 Khoa & Chuyên ngành   │  -> /majors (Kho đề phân theo khoa HUBT)
│                          │
│ HỌC TẬP                  │
│ 🎯 Ôn tập                │  -> /practice (Ôn tập không áp lực giờ, có giải thích)
│ 📝 Thi thử               │  -> /mock-exam (Phòng thi bấm giờ chuẩn)
│ ❌ Câu hỏi sai           │  -> /wrong-questions (Ôn lại câu từng làm sai)
│ 📚 Flashcard             │  -> /flashcards (Ghi nhớ ngắt quãng)
│                          │
│ CỦA TÔI                  │
│ 📝 Đề thi của tôi        │  -> /my-quizzes (Quiz do chính user tạo)
│ 📊 Lịch sử làm bài       │  -> /history (Lịch sử các lần đã thi)
│ ❤️ Yêu thích             │  -> /favorites (Bộ sưu tập đề quan tâm)
│ 📈 Tiến độ học tập       │  -> /progress (Thống kê kết quả cá nhân)
│                          │
│ ──────────────────────── │
│ 💡 Đề xuất tính năng     │  -> /feature-requests
│ 📰 Tin tức               │  -> /news
│ 🎧 Hỗ trợ                │  -> /contact
└──────────────────────────┘
```

* **Header (Thanh tiện ích chuẩn):**
  - Logo `Inno Quiz (HUBT EDTECH)`.
  - Ô tìm kiếm ngữ cảnh: `"Tìm môn học, đề thi..."`.
  - Nút Primary CTA: `[ + Tạo đề thi ]`.
  - Nút Toggle Theme: ☀️/🌙 (Trắng / Đen).
  - Chuông thông báo `NotificationBell`.
  - Avatar & Profile User.

---

### 7. QUY CHUẨN CHI TIẾT TỪNG MÀN HÌNH (SCREEN-BY-SCREEN)

#### 7.1. Trang Khám phá đề thi (Homepage / Explore — `/quiz`, `/explore`)
* **Header gọn:**
  - Title: **Khám phá bài thi**
  - Subtitle: *Tìm đề thi, môn học và nội dung ôn tập dành cho sinh viên HUBT.*
* **Thanh tìm kiếm & Bộ lọc:**
  - Placeholder: `"Tìm môn học, đề thi..."` (kết hợp debounce 300ms).
  - Bộ lọc: Khoa, Ngành, Môn học, Loại đề, Thời lượng, Sắp xếp (Mới nhất, Làm nhiều nhất).
  - **KHÔNG CÓ** bộ lọc "Trường" vì toàn bộ hệ thống đã là HUBT.
* **Sections:** Đề thi mới nhất, Đề thi phổ biến, Môn học nổi bật, Đề thi theo Khoa, Đề thi do sinh viên đóng góp.

#### 7.2. Quiz Card (Chuẩn Exam Card HUBT)
* **Metadata bắt buộc và phân cấp thị giác:**
  ```text
  ┌─────────────────────────────────────────┐
  │ CƠ SỞ DỮ LIỆU                           │
  │ Công nghệ thông tin                     │
  │                                         │
  │ Ôn tập giữa kỳ — Chương 1 → 5          │
  │                                         │
  │ 50 câu • 45 phút                        │
  │ Nguyễn Văn A • 128 lượt làm             │
  │                                         │
  │ [ Bắt đầu làm bài → ]                   │
  └─────────────────────────────────────────┘
  ```

#### 7.3. Trang Môn học (`/subjects/:id`)
* Phân cấp: `Khoa → Ngành → Môn → Đề thi`.
* Hiển thị: Mô tả môn học, Số lượng đề, Đề mới nhất, Đề làm nhiều nhất, Ngân hàng câu hỏi theo chương/topic.

#### 7.4. Trang Chi tiết Quiz (`/quiz/:id`)
* **Thông tin:** Breadcrumb (`HUBT > Khoa CNTT > Cơ sở dữ liệu > Tên đề`), Tên đề thi, Môn học, Tác giả, Số câu hỏi, Thời gian làm bài, Lượt làm, Ngày tạo/cập nhật, Mô tả chi tiết, Tags.
* **CTA chính:** `[ Bắt đầu làm bài ]`.
* **CTA phụ:** `[ Yêu thích ]`, `[ Chia sẻ ]`.
* **Kiểm tra quyền:**
  - Nếu `currentUser.id === quiz.authorId`: Hiển thị `[ Chỉnh sửa ]`, `[ Quản lý ]`, `[ Xóa ]`.
  - Nếu không phải chủ sở hữu: Ẩn toàn bộ nút Edit/Delete.

#### 7.5. Trang Làm bài thi (`/exam/:quizId`)
* **Bố cục Desktop:**
  - Header: Tên đề thi + Đồng hồ đếm ngược `35:20` (Đổi màu cảnh báo khi < 5 phút).
  - Thanh tiến độ: `Câu 12 / 50` + Progress bar.
  - Vùng câu hỏi: Nội dung câu hỏi + 4 đáp án (A, B, C, D) click chọn mượt mà.
  - Vùng điều hướng: Question Palette chuyển câu nhanh, nút Đánh dấu câu phân vân (Mark for review).
  - Footer/Actions: `[ ← Câu trước ]`, `[ Câu tiếp theo → ]`, `[ Nộp bài ]` (kèm Modal xác nhận nộp).
* **Bố cục Mobile:** Question-first, Sticky timer, Bottom navigation chuyển câu.

#### 7.6. Trang Kết quả bài thi (`/exam/result/:attemptId`)
* **Thống kê:** Điểm số (thang điểm 10 & số câu đúng), Số câu đúng, Số câu sai, Số câu bỏ qua, Thời gian hoàn thành, Tỷ lệ chính xác (%).
* **Hành động:** `[ Làm lại bài ]`, `[ Xem chi tiết đáp án & Lời giải ]`, `[ Ôn lại câu sai ]`, `[ Quay lại môn học ]`.
* **Nguyên tắc dữ liệu:** Chỉ hiển thị số liệu phân tích thật từ backend, không hardcode mock data giả.

#### 7.7. Trang Đề thi của tôi (`/my-quizzes`)
* Dành cho tất cả người dùng đã đăng nhập.
* **Tabs trạng thái:** `Tất cả`, `Bản nháp (Draft)`, `Đã xuất bản (Published)`, `Đã lưu trữ (Archived)`.
* **Hành động mỗi đề:** Edit, Preview, Publish, Duplicate, Delete.
* **Metadata hiển thị:** Tiêu đề, Môn học, Số câu hỏi, Trạng thái (Badge), Ngày cập nhật, Số lượt làm.

#### 7.8. Quiz Builder — Trình soạn thảo đề thi (`/create-quiz`, `/quizzes/:id/edit`)
* **Bố cục 3 cột chuyên nghiệp:**
  - **Cột Trái (Left):** Thông tin cơ bản đề thi (Tiêu đề, môn học, thời gian, maxAttempts) + Danh sách & Điều hướng câu hỏi (Question List / Palette).
  - **Cột Giữa (Center):** Trình soạn thảo câu hỏi đang chọn (Nội dung câu hỏi, Loại câu: `MULTIPLE_CHOICE`, `TRUE_FALSE`, Điểm số, Danh sách đáp án A/B/C/D, Checkbox chọn đáp án đúng, Lời giải chi tiết).
  - **Cột Phải (Right):** Xem trước trực tiếp (Live Preview) & Cài đặt nâng cao (Trộn câu hỏi, công khai đề).
* **Thanh Header Builder:**
  - Nút `[ ← Quay lại ]`, Trạng thái lưu (`Đã lưu nháp lúc...`), Nút `[ Lưu nháp ]`, Nút `[ Xem trước ]`, Nút Primary `[ Xuất bản ]`.
* **Quy tắc Validate:**
  - Bản nháp (Draft): Cho phép lưu khi chưa xong câu hỏi.
  - Xuất bản (Publish): Bắt buộc có Tiêu đề, Danh mục/Môn học, Ít nhất 1 câu hỏi hoàn chỉnh (có nội dung câu hỏi, đủ đáp án, có ít nhất 1 đáp án đúng).

---

### 8. UX STATES, RESPONSIVE & ACCESSIBILITY
* **Luôn xử lý đủ 5 trạng thái UX:**
  1. `Loading`: Skeleton Loader tương ứng, không để màn hình trắng hay giật layout.
  2. `Empty`: Trạng thái trống thân thiện có icon và CTA tạo mới hoặc xóa lọc.
  3. `Error`: Thông báo lỗi rõ ràng kèm nút `[ Thử lại ]`.
  4. `Success`: Toast notification phản hồi ngay sau mỗi thao tác.
  5. `Disabled`: Nút bị vô hiệu hóa khi form chưa hợp lệ hoặc đang gửi request.
* **Responsive Breakpoints:** 1440px (Desktop L), 1280px (Desktop), 1024px (Tablet ngang / Sidebar collapse), 768px (Tablet), 390px (Mobile).
* **Accessibility (a11y):** Button/Link ngữ nghĩa, input có label, focus state rõ ràng, icon-only có `aria-label`, độ tương phản text cao.

---

### 9. KIẾN TRÚC THƯ MỤC CHUẨN TRÊN FRONTEND
```text
front-end/src/
├── assets/                         # Ảnh, logo HUBT, vector minh họa
├── components/                     # Components dùng chung toàn hệ thống
│   ├── layout/                     # Header, Footer, Sidebar, PlaceholderFeaturePage
│   ├── ui/                         # Button, Input, Modal, Dropdown tái sử dụng
│   └── Notification/               # Hệ thống Toast & Chuông thông báo
├── context/                        # ThemeContext (Quản lý Trắng / Đen)
├── layouts/                        # DashboardLayout, AuthLayout
├── features/                       # 🔥 FEATURE-BASED MODULES
│   ├── auth/                       # Đăng ký, đăng nhập, xác thực
│   ├── home/                       # Trang chủ
│   ├── quizzes/                    # Khám phá đề thi, Kho đề HUBT, Danh sách đề
│   ├── quiz-builder/               # 🎯 Trình tạo & sửa đề thi dành cho User
│   ├── exam/                       # 🎯 Phòng thi trực tuyến, đếm giờ, làm bài
│   ├── result/                     # 🎯 Màn hình chấm điểm, xem lại đáp án
│   ├── subjects/                   # 🎯 Khoa, Ngành & Môn học HUBT
│   ├── news/                       # Tin tức tuyển sinh, mẹo học tập
│   ├── profile/                    # Trang cá nhân, Lịch sử thi, Đề thi yêu thích
│   └── contact/                    # Hỗ trợ sinh viên HUBT
├── hooks/                          # Custom hooks dùng chung (useDebounce, useAuthForm)
├── router/                         # React Router DOM config (src/router/index.tsx)
├── services/api/                   # Axios API calls (Auth, Quiz, Category, Exam, Subject)
├── store/                          # Redux Toolkit
├── types/                          # TypeScript Interfaces & Types
└── index.css                       # Tailwind CSS v4 setup & utilities
```

---

### 10. QUY CHUẨN COMMIT & QUY TRÌNH QUẢN LÝ NHÁNH GIT (GIT BRANCHING & COMMIT WORKFLOW)

> **QUY TẮC BẮT BUỘC TỪ BÂY GIỜ:** Mọi thay đổi code trên repository `front-end` bắt buộc phải tuân theo đúng định dạng Commit tiếng Việt và quy trình luân chuyển nhánh Git tiêu chuẩn.

#### 10.1. Định dạng Tiền tố Commit (Commit Prefix Convention)
* `feat: <nội dung>` — Khi phát triển tính năng mới (New Feature).
* `update: <nội dung>` — Khi nâng cấp, cải tiến hoặc cập nhật tính năng đã có.
* `fix: <nội dung>` hoặc `hotfix: <nội dung>` — Khi sửa lỗi chức năng, lỗi hiển thị hoặc lỗi giao diện.
* `delete: <nội dung>` — Khi xóa bỏ tính năng, tệp tin hoặc logic cũ không còn sử dụng.
* `refactor: <nội dung>` — Khi tái cấu trúc mã nguồn mà không làm thay đổi hành vi nghiệp vụ.
* `docs: <nội dung>` — Khi cập nhật tài liệu hoặc `AI_CONTEXT.md`.

#### 10.2. Quy trình Luân chuyển Nhánh Git Chuẩn (Branching Strategy for FE)
1. **Tạo nhánh tính năng (Feature Branch):**
   - Trước khi bắt đầu làm bất kỳ task mới nào, luôn tạo nhánh tính năng từ `develop` hoặc `main` với tiền tố `feature/<tên-tính-năng>` (hoặc `fix/<tên-lỗi>`) nếu nhánh đó chưa tồn tại.
   - Ví dụ: `git checkout -b feature/security-management`
2. **Commit công việc:**
   - Commit toàn bộ các thay đổi vào chính nhánh tính năng đó với format tiếng Việt quy chuẩn.
3. **Merge vào nhánh `develop`:**
   - Sau khi hoàn thành và kiểm thử 0 lỗi (`npx tsc --noEmit` & `npm run build`), chuyển sang nhánh `develop` và merge nhánh tính năng vào:
   ```bash
   git checkout develop
   git merge feature/<tên-tính-năng> --no-ff -m "merge: hop nhat feature/<tên-tính-năng> vao nhanh develop"
   ```
4. **Merge từ `develop` vào `main`:**
   - Chuyển sang nhánh `main` và merge `develop` vào:
   ```bash
   git checkout main
   git merge develop --no-ff -m "merge: hop nhat nhanh develop vao main"
   ```

---

### 11. CHECKLIST KIỂM TRA TRƯỚC KHI BÀN GIAO (BẮT BUỘC)
Trước khi thông báo "Done" cho người dùng, AI bắt buộc phải:
1. **Frontend Build & Typecheck:** Chạy `npx tsc --noEmit` và `npm run build` đạt **0 lỗi**.
2. **Backend API & Ownership Test:** Xác nhận API verify token, check `authorId === req.user.id`, validate payload.
3. **Luồng người dùng (End-to-End):**
   `Đăng nhập → Tạo Quiz → Lưu Draft → Mở lại sửa → Thêm câu hỏi/đáp án → Xuất bản → Xem ngoài Kho đề → Đăng nhập tài khoản khác xác nhận không sửa/xóa được đề của người khác`.
4. **Quy trình Git:** Đảm bảo code đã được commit đúng format tiếng Việt vào nhánh tính năng `feature/...`, merge lần lượt vào `develop` rồi vào `main`.
5. **Báo cáo rõ ràng:** Danh sách file tạo mới/chỉnh sửa, thay đổi UI, thay đổi API, kết quả kiểm thử.

---

### 12. TRIẾT LÝ SẢN PHẨM CUỐI CÙNG
Inno Quiz không phải một EduQuiz thu nhỏ hay một website quiz chung chung. Inno Quiz là **nền tảng học tập và thi trắc nghiệm phục vụ tốt nhất cho sinh viên Đại học HUBT**.
Mọi quyết định thiết kế và code đều phải giải quyết câu hỏi:
> *"Sinh viên HUBT có tìm đề, ôn tập, thi thử và tạo đề môn học của mình nhanh hơn, dễ hiểu hơn không?"*

