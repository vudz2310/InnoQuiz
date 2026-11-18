import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Users2,
  BookOpenCheck,
  HelpCircle,
  FileSpreadsheet,
  CalendarCheck2,
  Presentation,
  FileText,
  ClipboardList,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Building2,
  BookOpen,
  BarChart3,
  ScrollText,
  UserCog,
} from "lucide-react";
import type { SidebarConfig, BreadcrumbMap } from "./types";

export const adminNavigation: SidebarConfig = {
  brandName: "Admin",
  brandSuffix: "HUBT",
  roleLabel: "QUẢN TRỊ VIÊN",
  roleBadgeIcon: ShieldCheck,
  roleBadgeColor: "text-amber-600 dark:text-amber-400",
  basePath: "/admin",
  navigation: [
    {
      label: "Tổng quan",
      items: [
        {
          label: "Dashboard",
          path: "/admin",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      label: "Quản lý đào tạo",
      items: [
        { label: "Khoa", path: "/admin/faculties", icon: Building2 },
        { label: "Ngành học", path: "/admin/majors", icon: GraduationCap },
        { label: "Lớp học", path: "/admin/classes", icon: Layers },
        { label: "Môn học", path: "/admin/subjects", icon: BookOpen },
      ],
    },
    {
      label: "Người dùng",
      items: [
        { label: "Sinh viên", path: "/admin/students", icon: Users2 },
        { label: "Giảng viên", path: "/admin/teachers", icon: Users2 },
        {
          label: "Tài khoản & Phân quyền",
          path: "/admin/users",
          icon: UserCog,
        },
      ],
    },
    {
      label: "Ngân hàng đề",
      items: [
        { label: "Tất cả đề thi", path: "/admin/quizzes", icon: BookOpenCheck },
        { label: "Câu hỏi", path: "/admin/questions", icon: HelpCircle },
        {
          label: "Kho ôn luyện",
          path: "/admin/practice-bank",
          icon: ClipboardList,
        },
        {
          label: "Import đề PDF/DOCX",
          path: "/converter",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      label: "Hoạt động",
      items: [
        {
          label: "Tất cả hoạt động",
          path: "/admin/activities",
          icon: CalendarCheck2,
        },
        {
          label: "Phòng thi trực tuyến",
          path: "/admin/exam-rooms",
          icon: Presentation,
        },
        {
          label: "Bài kiểm tra & bài tập",
          path: "/admin/assignments",
          icon: FileText,
        },
        {
          label: "Lịch sử hoạt động",
          path: "/admin/activity-log",
          icon: ScrollText,
        },
      ],
    },
    {
      label: "Báo cáo & Hệ thống",
      items: [
        { label: "Báo cáo tổng quan", path: "/admin/reports", icon: BarChart3 },
        {
          label: "Bảo mật & Giám sát",
          path: "/admin/security",
          icon: ShieldAlert,
        },
        {
          label: "Nhật ký hoạt động",
          path: "/admin/audit-log",
          icon: ScrollText,
        },
        { label: "Cấu hình chung", path: "/admin/settings", icon: Settings },
      ],
    },
  ],
};

export const adminBreadcrumbs: BreadcrumbMap = {
  admin: "Quản trị",
  faculties: "Quản lý Khoa",
  majors: "Quản lý Ngành",
  classes: "Quản lý Lớp",
  subjects: "Quản lý Môn học",
  students: "Quản lý Sinh viên",
  teachers: "Quản lý Giảng viên",
  users: "Tài khoản & Phân quyền",
  quizzes: "Ngân hàng đề thi",
  questions: "Ngân hàng câu hỏi",
  "practice-bank": "Kho ôn luyện",
  activities: "Tất cả hoạt động",
  "exam-rooms": "Phòng thi trực tuyến",
  assignments: "Bài kiểm tra",
  "activity-log": "Lịch sử hoạt động",
  reports: "Báo cáo tổng quan",
  security: "Bảo mật & Giám sát",
  "audit-log": "Nhật ký hoạt động",
  settings: "Cấu hình chung",
};
