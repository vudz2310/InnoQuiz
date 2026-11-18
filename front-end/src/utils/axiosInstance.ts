import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// 1. Instance dùng cho các API công khai (Đăng nhập, Đăng ký, Xem tin tức, Refresh Token)
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Instance dùng cho các API bảo mật / riêng tư (Cần token)
const privateApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interface mở rộng cho request config với cờ retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 3. Request Interceptor: Đính kèm Bearer token vào Header
privateApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Quản lý hàng đợi các request khi đang trong quá trình refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const handleLogoutAndRedirect = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("profile");

  if (
    !window.location.pathname.startsWith("/login") &&
    !window.location.pathname.startsWith("/register")
  ) {
    window.location.href = "/login";
  }
};

const triggerBlockedAccessBanner = (data?: {
  error?: string;
  message?: string;
  blockedUntil?: string | null;
  blockedType?: "IP" | "USER" | "STUDENT_CODE" | "SYSTEM";
  identifier?: string;
}) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("HUBT_ACCESS_BLOCKED", {
        detail: {
          isBlocked: true,
          type: data?.blockedType || "IP",
          reason:
            data?.message ||
            "Địa chỉ IP hoặc tài khoản của bạn tạm thời bị khóa truy cập do vi phạm quy định bảo mật HUBT.",
          blockedUntil: data?.blockedUntil || null,
          identifier: data?.identifier,
        },
      }),
    );
  }
};

// Response Interceptor cho publicApi
publicApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const responseData = error.response?.data as
      | {
          error?: string;
          message?: string;
          blockedUntil?: string | null;
          blockedType?: "IP" | "USER" | "STUDENT_CODE" | "SYSTEM";
        }
      | undefined;

    if (
      status === 403 &&
      (responseData?.error === "ACCESS_DENIED" ||
        responseData?.message?.includes("vi phạm quy định bảo mật") ||
        responseData?.blockedUntil)
    ) {
      triggerBlockedAccessBanner(responseData);
    }

    return Promise.reject(error);
  },
);

// 4. Response Interceptor cho privateApi: Tự động dùng Refresh Token hoặc bắt vi phạm bảo mật
privateApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | CustomAxiosRequestConfig
      | undefined;
    const status = error.response?.status;
    const responseData = error.response?.data as
      | {
          code?: string;
          error?: string;
          message?: string;
          blockedUntil?: string | null;
          blockedType?: "IP" | "USER" | "STUDENT_CODE" | "SYSTEM";
        }
      | undefined;

    // Bắt sự kiện bị chặn IP / Tài khoản
    if (
      status === 403 &&
      (responseData?.error === "ACCESS_DENIED" ||
        responseData?.message?.includes("vi phạm quy định bảo mật") ||
        responseData?.blockedUntil)
    ) {
      triggerBlockedAccessBanner(responseData);
      return Promise.reject(error);
    }

    // Backend trả về 410 (GONE) khi JWT expired, hoặc 401 khi không hợp lệ/hết hạn
    const isTokenExpired =
      status === 410 ||
      status === 401 ||
      responseData?.code === "TOKEN_EXPIRED" ||
      responseData?.message?.toLowerCase().includes("hết hạn") ||
      responseData?.message?.toLowerCase().includes("expired");

    if (isTokenExpired && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      // Nếu không có refreshToken thì không thể refresh -> đăng xuất
      if (!refreshToken) {
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }

      // Nếu đang có 1 tiến trình refresh token khác đang chạy, đưa request này vào hàng đợi chờ token mới
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return privateApi(originalRequest);
          })
          .catch((err: unknown) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API cấp lại Access Token từ Refresh Token
        const response = await publicApi.post<{
          accessToken: string;
          refreshToken?: string;
        }>("/auth/refresh_token", {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;

        if (!newAccessToken) {
          throw new Error("Không nhận được access token mới từ máy chủ");
        }

        // Lưu access token mới vào localStorage
        localStorage.setItem("accessToken", newAccessToken);

        // Nếu server có cơ chế rotate refresh token, lưu luôn refresh token mới
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }

        // Cập nhật header mặc định
        privateApi.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Giải phóng hàng đợi các request đang chờ
        processQueue(null, newAccessToken);

        // Thực thi lại request ban đầu với access token mới
        return privateApi(originalRequest);
      } catch (refreshError: unknown) {
        // Refresh token không hợp lệ hoặc đã hết hạn (sau 7-14 ngày)
        processQueue(refreshError, null);
        handleLogoutAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { publicApi, privateApi };
