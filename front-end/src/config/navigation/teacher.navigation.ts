import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  ClipboardList,
  HelpCircle,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Presentation,
  History,
  BarChart3,
  PieChart,
  FileBarChart,
} from "lucide-react";
import type { SidebarConfig, BreadcrumbMap } from "./types";

export const teacherNavigation: SidebarConfig = {
  brandName: "Teacher",
  brandSuffix: "HUBT",
  roleLabel: "GIẢNG VIÊN BỘ MÔN",
  roleBadgeIcon: School,
  roleBadgeColor: "text-indigo-600 dark:text-indigo-400",
  basePath: "/teacher",
  navigation: [
    {
      label: "Tổng quan",
      items: [
        { label: "Dashboard", path: "/teacher", icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: "Giảng dạy",
      items: [
        { label: "Lớp của tôi", path: "/teacher/classes", icon: School },
        { label: "Sinh viên", path: "/teacher/students", icon: Users },
        { label: "Môn học phụ trách", path: "/teacher/subjects", icon: BookOpen },
      ],
    },
    {
      label: "Ngân hàng đề",
      items: [
        { label: "Đề thi của tôi", path: "/teacher/quizzes", icon: ClipboardList },
        { label: "Kho câu hỏi", path: "/teacher/questions", icon: HelpCircle },
        { label: "Tạo đề thi mới", path: "/create-quiz", icon: PlusCircle, highlight: true },
        { label: "Import PDF/DOCX", path: "/converter", icon: FileSpreadsheet },
      ],
    },
    {
      label: "Hoạt động",
      items: [
        { label: "Giao bài kiểm tra", path: "/teacher/assignments", icon: FileText },
        { label: "Phòng đang diễn ra", path: "/teacher/exam-rooms", icon: Presentation },
        { label: "Lịch sử phòng thi", path: "/teacher/exam-rooms/history", icon: History },
      ],
    },
    {
      label: "Kết quả",
      items: [
        { label: "Bài làm sinh viên", path: "/teacher/submissions", icon: BookOpen },
        { label: "Thống kê lớp", path: "/teacher/class-analytics", icon: BarChart3 },
        { label: "Thống kê câu hỏi", path: "/teacher/question-analytics", icon: PieChart },
        { label: "Báo cáo", path: "/teacher/reports", icon: FileBarChart },
      ],
    },
  ],
};

export const teacherBreadcrumbs: BreadcrumbMap = {
  teacher: "Giảng viên",
  classes: "Lớp của tôi",
  students: "Sinh viên",
  subjects: "Môn học phụ trách",
  quizzes: "Đề thi của tôi",
  questions: "Kho câu hỏi",
  assignments: "Giao bài kiểm tra",
  "exam-rooms": "Phòng thi trực tuyến",
  history: "Lịch sử phòng thi",
  submissions: "Bài làm sinh viên",
  "class-analytics": "Thống kê lớp",
  "question-analytics": "Thống kê câu hỏi",
  reports: "Báo cáo",
};
