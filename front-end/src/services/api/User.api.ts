import { privateApi } from "../../utils/axiosInstance";

export const getProfile = async (token?: string, _id?: string) => {
  const { data } = await privateApi.get("/profile", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data?.userInfo || data;
};

export const updateProfile = async (payload: {
  name?: string;
  avatar?: string;
  email?: string;
  studentCode?: string;
  majorId?: string | null;
  classId?: string | null;
}) => {
  const { data } = await privateApi.patch("/profile", payload);
  return data?.data || data?.userInfo || data;
};

export const changePassword = async (newPassword: string) => {
  const { data } = await privateApi.patch("/profile/password", { newPassword });
  return data;
};
