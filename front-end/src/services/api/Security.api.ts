import { privateApi } from "../../utils/axiosInstance";

export interface SecurityStats {
  totalLogins: number;
  failedLogins: number;
  newRegistrations: number;
  otpsSent: number;
  rateLimitEvents: number;
  activeAlertsCount: number;
  blockedCount: number;
  activeSessionsCount: number;
  loginSuccessRate: number;
}

export interface RiskDistributionItem {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  count: number;
}

export interface SecurityEventItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  eventType:
    | "REGISTER"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "OTP_SENT"
    | "OTP_VERIFIED"
    | "OTP_FAILED"
    | "PASSWORD_CHANGED"
    | "SESSION_REVOKED"
    | "RATE_LIMIT_EXCEEDED"
    | "SUSPICIOUS_SCRAPING_DETECTED"
    | "ACCESS_DENIED"
    | "ADMIN_ACTION";
  ipAddress: string;
  ipHash: string;
  userAgent: string | null;
  deviceInfo: string | null;
  endpoint: string | null;
  httpMethod: string | null;
  httpStatus: number | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  details: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    studentCode: string | null;
  } | null;
}

export interface SecurityAlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED" | "FALSE_POSITIVE";
  ipAddress: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export interface BlockedIdentifierItem {
  id: string;
  type: "IP" | "USER" | "STUDENT_CODE";
  value: string;
  reason: string;
  riskScore: number;
  blockedUntil: string | null;
  blockedBy: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityOverviewResponse {
  timeRange: string;
  stats: SecurityStats;
  riskDistribution: RiskDistributionItem[];
  recentEvents: SecurityEventItem[];
  recentAlerts: SecurityAlertItem[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserSessionItem {
  id: string;
  device?: string;
  browser?: string;
  os?: string;
  deviceInfo?: string | null;
  ipAddress: string;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export const securityApi = {
  // 1. Lấy tổng quan Dashboard
  async getOverview(timeRange = "7d"): Promise<SecurityOverviewResponse> {
    const { data } = await privateApi.get("/admin/security/overview", {
      params: { timeRange },
    });
    return data.data;
  },

  // 2. Lấy danh sách Nhật ký sự kiện
  async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    riskLevel?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaginatedResponse<SecurityEventItem>> {
    const { data } = await privateApi.get("/admin/security/events", { params });
    return data.data;
  },

  // 3. Lấy danh sách Cảnh báo bảo mật
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
  }): Promise<PaginatedResponse<SecurityAlertItem>> {
    const { data } = await privateApi.get("/admin/security/alerts", { params });
    return data.data;
  },

  // 4. Cập nhật trạng thái Cảnh báo
  async updateAlert(
    id: string,
    payload: { status: string; resolutionNote?: string }
  ): Promise<SecurityAlertItem> {
    const { data } = await privateApi.patch(`/admin/security/alerts/${id}`, payload);
    return data.data;
  },

  // 5. Lấy danh sách thực thể bị chặn
  async getBlockedIdentifiers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }): Promise<PaginatedResponse<BlockedIdentifierItem>> {
    const { data } = await privateApi.get("/admin/security/identifiers", { params });
    return data.data;
  },

  // 6. Thêm chặn mới (IP, User ID, Student Code)
  async blockIdentifier(payload: {
    type: "IP" | "USER" | "STUDENT_CODE";
    value: string;
    reason: string;
    riskScore?: number;
    blockedUntil?: string | null;
    notes?: string;
  }): Promise<BlockedIdentifierItem> {
    const { data } = await privateApi.post("/admin/security/identifiers/block", payload);
    return data.data;
  },

  // 7. Mở khóa / Gỡ chặn
  async unblockIdentifier(
    id: string,
    payload?: { reason?: string }
  ): Promise<BlockedIdentifierItem> {
    const { data } = await privateApi.post(
      `/admin/security/identifiers/${id}/unblock`,
      payload
    );
    return data.data;
  },

  // 8. Cấu hình bảo mật
  async getSettings(): Promise<Record<string, string>> {
    const { data } = await privateApi.get("/admin/security/settings");
    return data.data;
  },

  async updateSettings(
    settings: Record<string, string>
  ): Promise<Record<string, string>> {
    const { data } = await privateApi.patch("/admin/security/settings", settings);
    return data.data;
  },

  // 9. Quản lý phiên đăng nhập người dùng cá nhân
  async getUserSessions(): Promise<UserSessionItem[]> {
    const { data } = await privateApi.get("/auth/sessions");
    return data.data;
  },

  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await privateApi.delete(`/auth/sessions/${sessionId}`);
    return data;
  },

  async revokeOtherSessions(refreshToken?: string): Promise<{ success: boolean; message: string }> {
    const { data } = await privateApi.delete("/auth/sessions/other", {
      data: { refreshToken },
    });
    return data;
  },
};
