import { publicApi, privateApi } from "../../utils/axiosInstance";
import { getProfile } from "./User.api";

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  fullName?: string;
  studentCode?: string;
  majorId?: string;
  classId?: string | null;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await publicApi.post("/auth/login", {
      email,
      password,
    });
    return data;
  },

  async register(
    emailOrPayload: string | RegisterPayload,
    password?: string,
    name?: string,
    studentCode?: string,
    majorId?: string,
    classId?: string | null
  ) {
    let payload: RegisterPayload;
    if (typeof emailOrPayload === "object") {
      payload = emailOrPayload;
    } else {
      payload = {
        email: emailOrPayload,
        password: password || "",
        name: name || "",
        studentCode,
        majorId,
        classId,
      };
    }

    const { data } = await publicApi.post("/auth/register", payload);
    return data;
  },

  async verifyEmail(email: string, otp: string) {
    const { data } = await publicApi.post("/auth/verify-email", {
      email,
      otp,
    });
    return data;
  },

  async resendOtp(email: string) {
    const { data } = await publicApi.post("/auth/resend-otp", {
      email,
    });
    return data;
  },

  async updateMyClass(classId: string) {
    const { data } = await privateApi.patch("/auth/academic-class", {
      classId,
    });
    return data;
  },

  async refreshToken(refreshToken: string) {
    const { data } = await publicApi.post<{
      accessToken: string;
      refreshToken?: string;
    }>("/auth/refresh_token", {
      refreshToken,
    });
    return data;
  },

  getProfile,
};
