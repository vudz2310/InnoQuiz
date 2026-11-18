import type { LucideIcon } from "lucide-react";

/** Một mục menu trong sidebar */
export interface NavItem {
  /** Nhãn hiển thị */
  label: string;
  /** Đường dẫn route */
  path: string;
  /** Icon lucide-react */
  icon: LucideIcon;
  /** Khớp chính xác route (dùng cho trang Dashboard index) */
  end?: boolean;
  /** Đánh dấu CTA nổi bật (ví dụ: "Tạo đề thi mới") */
  highlight?: boolean;
  /** Số badge thông báo (khi có dữ liệu thật từ API) */
  badge?: number;
}

/** Nhóm menu trong sidebar */
export interface NavGroup {
  /** Tiêu đề nhóm (hiển thị khi sidebar mở rộng) */
  label: string;
  /** Danh sách mục menu */
  items: NavItem[];
}

/** Cấu hình sidebar cho từng role */
export interface SidebarConfig {
  /** Tên thương hiệu hiển thị (ví dụ: "Admin", "Teacher", "Inno Quiz") */
  brandName: string;
  /** Hậu tố tên thương hiệu (ví dụ: "HUBT") */
  brandSuffix: string;
  /** Nhãn vai trò (ví dụ: "QUẢN TRỊ VIÊN", "GIẢNG VIÊN BỘ MÔN") */
  roleLabel: string;
  /** Icon vai trò */
  roleBadgeIcon: LucideIcon;
  /** Màu text nhãn vai trò (Tailwind class) */
  roleBadgeColor: string;
  /** Đường dẫn gốc (ví dụ: "/admin", "/teacher") */
  basePath: string;
  /** Danh sách nhóm menu */
  navigation: NavGroup[];
}

/** Map segment URL → nhãn breadcrumb tiếng Việt */
export type BreadcrumbMap = Record<string, string>;
