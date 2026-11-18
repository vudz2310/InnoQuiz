import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import HomePage from "../features/home/pages";
import News from "../features/news/pages/NewsPage";
import AllNews from "../features/news/pages/tabs/AllNews";
import ExamPrepTips from "../features/news/pages/tabs/ExamPrepTips";
import AdmissionsInfo from "../features/news/pages/tabs/AdmissionsInfo";
import ExamStructure from "../features/news/pages/tabs/ExamStructure";
import ApplicationGuide from "../features/news/pages/tabs/ApplicationGuide";
import ContactPageWrapper from "../features/contact/pages";
import ProfilePage from "../features/profile/pages";
import QuizListPage from "../features/quizzes/pages/QuizListPage";
import QuizDetailPage from "../features/quizzes/pages/QuizDetailPage";
import QuizTakingPage from "../features/quizzes/pages/QuizTakingPage";
import QuizResultPage from "../features/quizzes/pages/QuizResultPage";
import CreateQuizPage from "../features/quiz-builder/pages/CreateQuizPage";
import EditQuizPage from "../features/quiz-builder/pages/EditQuizPage";
import MyQuizzesPage from "../features/quizzes/pages/MyQuizzesPage";
import MyProgressPage from "../features/quizzes/pages/MyProgressPage";
import WrongAnswersPage from "../features/quizzes/pages/WrongAnswersPage";
import PdfConverterPage from "../features/tools/pages/PdfConverterPage";
import Notfound from "../components/layout/Notfound";
import PlaceholderFeaturePage from "../components/layout/PlaceholderFeaturePage";
import RoleRoute from "../components/auth/RoleRoute";
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import MajorsManagementPage from "../features/admin/pages/MajorsManagementPage";
import ClassesManagementPage from "../features/admin/pages/ClassesManagementPage";
import ClassDetailPage from "../features/admin/pages/ClassDetailPage";
import StudentsManagementPage from "../features/admin/pages/StudentsManagementPage";
import TeachersManagementPage from "../features/admin/pages/TeachersManagementPage";
import QuizzesManagementPage from "../features/admin/pages/QuizzesManagementPage";
import AdminSecurityPage from "../features/admin/pages/AdminSecurityPage";
import AdminReportsPage from "../features/admin/pages/AdminReportsPage";
import AdminAuditLogPage from "../features/admin/pages/AdminAuditLogPage";
import AdminSettingsPage from "../features/admin/pages/AdminSettingsPage";
import TeacherDashboardPage from "../features/teacher/pages/TeacherDashboardPage";
import TeacherClassesPage from "../features/teacher/pages/TeacherClassesPage";
import TeacherStudentsPage from "../features/teacher/pages/TeacherStudentsPage";
import TeacherQuizzesPage from "../features/teacher/pages/TeacherQuizzesPage";

// Lấy role của user từ localStorage hoặc JWT token
const getUserRole = (): string => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (!token) return "";
  try {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.role) return String(parsed.role).toUpperCase();
    }
  } catch {}
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload?.role) return String(payload.role).toUpperCase();
    }
  } catch {}
  return "";
};

// Route bảo vệ: Chỉ người dùng có token mới được phép truy cập
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Route công khai: Nếu đã đăng nhập, tự động chuyển hướng đúng theo role của mình
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  if (token) {
    const role = getUserRole();
    if (role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "TEACHER") {
      return <Navigate to="/teacher" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Route trang chủ: Điều hướng đúng role về portal của mình, sinh viên/khách xem trang chủ
const HomeRoute = () => {
  const role = getUserRole();
  if (role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  if (role === "TEACHER") {
    return <Navigate to="/teacher" replace />;
  }
  return <HomePage />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/auth/verify-email",
    element: <Navigate to="/verify-email" replace />,
  },
  {
    path: "/auth/register",
    element: <Navigate to="/register" replace />,
  },
  {
    path: "/auth/login",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/profile",
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/news",
    element: <News />,
    children: [
      { index: true, element: <AllNews /> },
      { path: "examPrepTips", element: <ExamPrepTips /> },
      { path: "admissionsInformation", element: <AdmissionsInfo /> },
      { path: "examStructure", element: <ExamStructure /> },
      { path: "applicationGuide", element: <ApplicationGuide /> },
    ],
  },
  {
    path: "/contact",
    element: <ContactPageWrapper />,
  },
  {
    path: "/explore",
    element: <QuizListPage />,
  },
  {
    path: "/quiz",
    element: <QuizListPage />,
  },
  {
    path: "/quiz/:id",
    element: <QuizDetailPage />,
  },
  {
    path: "/quiz/:id/take/:attemptId",
    element: (
      <PrivateRoute>
        <QuizTakingPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/quiz/:id/result/:attemptId",
    element: (
      <PrivateRoute>
        <QuizResultPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/exam/:attemptId",
    element: (
      <PrivateRoute>
        <QuizTakingPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/exam/:attemptId/result",
    element: (
      <PrivateRoute>
        <QuizResultPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/quizzes",
    element: <Navigate to="/quiz" replace />,
  },
  {
    path: "/majors",
    element: (
      <PlaceholderFeaturePage
        withLayout={true}
        title="Kho đề theo Trường & Chuyên ngành"
        badge="HUBT EdTech"
        description="Phân loại đề trắc nghiệm bám sát chương trình đào tạo của từng khoa tại HUBT và các trường đại học hàng đầu."
        expectedFeatureList={[
          "Đề thi khoa CNTT, Kinh tế, Quản trị kinh doanh, Ngoại ngữ",
          "Tổng hợp đề thi giữa kỳ & cuối kỳ chuẩn học phần HUBT",
          "Ngân hàng đề thi theo từng mã học phần và giảng viên bộ môn",
        ]}
      />
    ),
  },
  {
    path: "/history",
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/my/history",
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/my/progress",
    element: (
      <PrivateRoute>
        <MyProgressPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/my/wrong-answers",
    element: (
      <PrivateRoute>
        <WrongAnswersPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/my/exams",
    element: (
      <PrivateRoute>
        <MyQuizzesPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/favorites",
    element: (
      <PlaceholderFeaturePage
        withLayout={true}
        title="Đề thi yêu thích"
        badge="Cá nhân hóa"
        description="Nơi lưu trữ nhanh các bộ đề thi bạn quan tâm hoặc dự định ôn tập lại nhiều lần."
        expectedFeatureList={[
          "Đánh dấu yêu thích 1 chạm ngay trên Quiz Card",
          "Phân loại danh sách đề yêu thích theo môn học",
          "Luyện tập lại đề yêu thích ngoại tuyến mọi lúc",
        ]}
      />
    ),
  },
  {
    path: "/practice",
    element: <QuizListPage />,
  },
  {
    path: "/mock-exam",
    element: <QuizListPage />,
  },
  {
    path: "/flashcards",
    element: <QuizListPage />,
  },
  {
    path: "/feature-requests",
    element: (
      <PlaceholderFeaturePage
        withLayout={true}
        title="Đề xuất tính năng mới"
        badge="Cộng đồng HUBT"
        description="Đóng góp ý kiến và đề xuất ý tưởng để cùng phát triển nền tảng InnoQuiz ngày một hoàn thiện hơn."
        expectedFeatureList={[
          "Gửi trực tiếp đề xuất tính năng cho đội ngũ phát triển",
          "Bình chọn (Upvote) các ý tưởng được cộng đồng quan tâm",
          "Theo dõi lộ trình phát triển tính năng công khai (Public Roadmap)",
        ]}
      />
    ),
  },
  {
    path: "/create-quiz",
    element: (
      <PrivateRoute>
        <CreateQuizPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/quizzes/:id/edit",
    element: (
      <PrivateRoute>
        <EditQuizPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/quiz/:id/edit",
    element: (
      <PrivateRoute>
        <EditQuizPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/my-quizzes",
    element: (
      <PrivateRoute>
        <MyQuizzesPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/converter",
    element: <PdfConverterPage />,
  },
  {
    path: "/tools/pdf-converter",
    element: <Navigate to="/converter" replace />,
  },
  {
    path: "/admin",
    element: (
      <RoleRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      // Quản lý đào tạo
      { path: "faculties", element: <PlaceholderFeaturePage title="Quản lý Khoa" badge="Admin Portal" description="Quản lý danh sách các khoa, viện trực thuộc HUBT." expectedFeatureList={["Thêm, sửa, xóa khoa/viện", "Xem danh sách ngành và lớp thuộc khoa", "Thống kê số lượng sinh viên và giảng viên theo khoa"]} /> },
      { path: "majors", element: <MajorsManagementPage /> },
      { path: "classes", element: <ClassesManagementPage /> },
      { path: "classes/:id", element: <ClassDetailPage /> },
      { path: "subjects", element: <PlaceholderFeaturePage title="Quản lý Môn học" badge="Admin Portal" description="Quản lý danh mục môn học theo chuẩn chương trình đào tạo HUBT." expectedFeatureList={["Thêm, sửa, xóa môn học và mã học phần", "Gắn môn học vào ngành và khoa tương ứng", "Quản lý số tín chỉ và loại hình thi"]} /> },
      // Người dùng
      { path: "students", element: <StudentsManagementPage /> },
      { path: "teachers", element: <TeachersManagementPage /> },
      { path: "users", element: <PlaceholderFeaturePage title="Tài khoản & Phân quyền" badge="Admin Portal" description="Quản lý toàn bộ tài khoản người dùng và vai trò trên hệ thống." expectedFeatureList={["Phân quyền Sinh viên, Giảng viên, Admin", "Khóa / mở khóa tài khoản vi phạm", "Reset mật khẩu và xác thực email hàng loạt"]} /> },
      // Ngân hàng đề
      { path: "quizzes", element: <QuizzesManagementPage /> },
      { path: "questions", element: <PlaceholderFeaturePage title="Ngân hàng Câu hỏi Trung tâm" badge="Admin Portal" description="Lưu trữ và đồng bộ hóa ngân hàng câu hỏi chuẩn đầu ra cho tất cả các khoa viện HUBT." expectedFeatureList={["Quản lý cây phân cấp học phần - chương - bài học", "Nhập / Xuất câu hỏi hàng loạt chuẩn quốc tế (Moodle XML, Aiken)", "Thống kê độ khó, độ phân biệt của từng câu hỏi qua các kỳ thi"]} /> },
      { path: "practice-bank", element: <PlaceholderFeaturePage title="Kho ôn luyện" badge="Admin Portal" description="Bộ sưu tập đề ôn tập và tài liệu tham khảo cho sinh viên HUBT." expectedFeatureList={["Tổng hợp đề thi các kỳ trước", "Phân loại theo môn học, khoa và độ khó", "Đề xuất đề ôn tập dựa trên lịch sử làm bài"]} /> },
      // Hoạt động
      { path: "activities", element: <PlaceholderFeaturePage title="Tất cả Hoạt động" badge="Admin Portal" description="Tổng quan toàn bộ hoạt động thi, kiểm tra và giao bài trên hệ thống." expectedFeatureList={["Danh sách phòng thi, bài kiểm tra đang diễn ra", "Lọc theo khoa, lớp, giảng viên và khoảng thời gian", "Số liệu tham gia và tỷ lệ hoàn thành"]} /> },
      { path: "exam-rooms", element: <PlaceholderFeaturePage title="Phòng thi Trực tuyến" badge="Admin Portal" description="Giám sát tất cả phòng thi trực tuyến trên toàn hệ thống." expectedFeatureList={["Xem phòng thi đang diễn ra theo thời gian thực", "Số lượng sinh viên tham gia, trạng thái phòng", "Can thiệp phòng thi khi có vi phạm nghiêm trọng"]} /> },
      { path: "assignments", element: <PlaceholderFeaturePage title="Bài kiểm tra & Bài tập" badge="Admin Portal" description="Quản lý toàn bộ bài kiểm tra và bài tập đã được giảng viên tạo ra." expectedFeatureList={["Danh sách bài kiểm tra theo lớp, môn và giảng viên", "Thống kê tỷ lệ hoàn thành và điểm trung bình", "Duyệt hoặc thu hồi bài kiểm tra chưa phù hợp"]} /> },
      { path: "activity-log", element: <AdminAuditLogPage /> },
      // Báo cáo & Hệ thống
      { path: "reports", element: <AdminReportsPage /> },
      { path: "security", element: <AdminSecurityPage /> },
      { path: "audit-log", element: <AdminAuditLogPage /> },
      { path: "settings", element: <AdminSettingsPage /> },
    ],
  },
  {
    path: "/teacher",
    element: (
      <RoleRoute allowedRoles={["TEACHER"]}>
        <TeacherLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <TeacherDashboardPage /> },
      // Giảng dạy
      { path: "classes", element: <TeacherClassesPage /> },
      { path: "students", element: <TeacherStudentsPage /> },
      { path: "subjects", element: <PlaceholderFeaturePage title="Môn học Phụ trách" badge="Teacher Portal" description="Danh sách các môn học bạn được phân công giảng dạy tại HUBT." expectedFeatureList={["Xem danh sách môn học theo học kỳ", "Liên kết đề thi và ngân hàng câu hỏi theo môn", "Thống kê kết quả thi theo từng môn phụ trách"]} /> },
      // Ngân hàng đề
      { path: "quizzes", element: <TeacherQuizzesPage /> },
      { path: "questions", element: <PlaceholderFeaturePage title="Kho Câu hỏi" badge="Teacher Portal" description="Bộ sưu tập câu hỏi trắc nghiệm do giảng viên tự biên soạn và phân loại theo học phần." expectedFeatureList={["Tạo câu hỏi đa phương tiện (hình ảnh, công thức LaTeX, âm thanh)", "Gắn nhãn câu hỏi theo mức độ nhận biết, thông hiểu, vận dụng", "Chia sẻ ngân hàng câu hỏi cho đồng nghiệp cùng bộ môn"]} /> },
      // Hoạt động
      { path: "assignments", element: <PlaceholderFeaturePage title="Giao bài Kiểm tra" badge="Teacher Portal" description="Khởi tạo và thiết lập bài kiểm tra định kỳ 15 phút, 1 tiết, giữa kỳ cho sinh viên." expectedFeatureList={["Cấu hình thời gian làm bài, số lần làm và hạn nộp", "Trộn ngẫu nhiên câu hỏi và đáp án chống gian lận", "Chấm điểm tự động và công bố đáp án chi tiết theo lịch hẹn"]} /> },
      { path: "exam-rooms", element: <PlaceholderFeaturePage title="Phòng thi Đang diễn ra" badge="Teacher Portal" description="Giám sát phòng thi trắc nghiệm trực tuyến theo thời gian thực." expectedFeatureList={["Giám sát trạng thái làm bài của từng sinh viên", "Phát hiện cảnh báo rời màn hình thi hoặc chuyển tab", "Cưỡng chế nộp bài hoặc khóa quyền thi khi có vi phạm"]} /> },
      { path: "exam-rooms/history", element: <PlaceholderFeaturePage title="Lịch sử Phòng thi" badge="Teacher Portal" description="Xem lại toàn bộ phòng thi đã kết thúc và kết quả từng phiên." expectedFeatureList={["Danh sách phòng thi đã hoàn thành theo thời gian", "Xem lại thống kê tham gia và điểm trung bình", "Tái sử dụng cấu hình phòng thi cho lần sau"]} /> },
      // Kết quả
      { path: "submissions", element: <PlaceholderFeaturePage title="Bài làm Sinh viên" badge="Teacher Portal" description="Quản lý toàn bộ bài làm của sinh viên, xem lại chi tiết từng lượt nộp và bảng điểm." expectedFeatureList={["Xem lại bài làm chi tiết từng câu hỏi của sinh viên", "Phúc khảo và điều chỉnh điểm nếu có sai sót đề thi", "Xuất bảng điểm ra file Excel theo chuẩn phòng đào tạo HUBT"]} /> },
      { path: "class-analytics", element: <PlaceholderFeaturePage title="Thống kê Lớp" badge="Teacher Portal" description="Phổ điểm trắc nghiệm, tỷ lệ đạt/trượt và đánh giá mức độ tiếp thu của từng lớp." expectedFeatureList={["Biểu đồ phổ điểm hình chuông chuẩn Gauss", "So sánh kết quả giữa các lớp cùng môn", "Báo cáo tổng kết học phần sẵn sàng nộp cho khoa chủ quản"]} /> },
      { path: "question-analytics", element: <PlaceholderFeaturePage title="Thống kê Câu hỏi" badge="Teacher Portal" description="Phân tích độ khó, độ phân biệt và tỷ lệ sai của từng câu hỏi." expectedFeatureList={["Thống kê tỷ lệ chọn đúng/sai theo từng đáp án", "Xác định câu hỏi quá dễ hoặc quá khó để điều chỉnh", "Gợi ý cải thiện nội dung câu hỏi dựa trên dữ liệu"]} /> },
      { path: "reports", element: <PlaceholderFeaturePage title="Báo cáo Giảng viên" badge="Teacher Portal" description="Báo cáo tổng hợp hoạt động giảng dạy và kết quả thi của sinh viên." expectedFeatureList={["Báo cáo theo lớp, theo môn và theo kỳ học", "Xuất báo cáo PDF gửi khoa chủ quản", "Thống kê tiến độ ôn tập của sinh viên"]} /> },
    ],
  },
  {
    path: "*",
    element: <Notfound />,
  },
]);

export default router;
