import React, { useRef, useState } from "react";
import { Mail, Calendar, Edit3, LogOut, GraduationCap, Camera, Loader2 } from "lucide-react";
import type { User } from "../../../types/auth.interface";
import { updateProfile } from "../../../services/api/User.api";
import { uploadApi } from "../../../services/api/Upload.api";
import { useNotification } from "../../../components/Notification";
import { useDispatch } from "react-redux";
import { setUser } from "../../../store/slices/auth.slice";

interface ProfileBannerProps {
  user: User;
  isEditing: boolean;
  onToggleEdit: () => void;
  onLogout: () => void;
}

export default function ProfileBanner({
  user,
  isEditing,
  onToggleEdit,
  onLogout,
}: ProfileBannerProps) {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useNotification();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Tệp không hợp lệ", "Vui lòng chọn tệp hình ảnh (PNG, JPG, JPEG, WEBP)!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("Dung lượng quá lớn", "Vui lòng chọn ảnh có kích thước dưới 10MB!");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload qua API riêng biệt /upload/image
      const uploadRes = await uploadApi.uploadImage(file);
      const imageUrl = uploadRes.url;

      // 2. Cập nhật vào profile user
      const updatedData = await updateProfile({
        name: user.name,
        avatar: imageUrl,
      });

      const updatedUser = {
        ...user,
        avatar: updatedData.avatar || imageUrl,
      };

      dispatch(setUser(updatedUser));
      showSuccess("Thành công", "Đã cập nhật ảnh đại diện mới!");
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      console.error("Lỗi upload avatar:", err);
      showError("Lỗi cập nhật", apiError.response?.data?.message || "Không thể tải ảnh lên server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] p-6 sm:p-10 text-white shadow-xl overflow-hidden">
      {/* Subtle decorative background circles */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-[#06B6D4]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
          {/* Avatar Circle with upload action */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 backdrop-blur-md border-4 border-white/40 shadow-2xl flex items-center justify-center text-3xl font-extrabold text-white overflow-hidden relative">
              {uploading ? (
                <div className="flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-7 h-7 animate-spin mb-1" />
                  <span className="text-[10px] font-bold">Đang tải...</span>
                </div>
              ) : user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>

            {/* Quick Upload Button Overlay */}
            {!uploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                title="Nhấn để đổi ảnh đại diện"
              >
                <Camera className="w-6 h-6 mb-1 text-white" />
                <span className="text-[11px] font-bold text-white">Đổi ảnh</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleQuickAvatarUpload}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
            />

            <span
              className="absolute bottom-1 right-1 w-5 h-5 bg-[#10B981] border-2 border-white rounded-full shadow-xs"
              title="Đang hoạt động"
            />
          </div>

          {/* User Meta Information */}
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                <GraduationCap className="w-3.5 h-3.5" />
                {user.role === "admin" ? "Quản trị viên" : "Sinh viên HUBT"}
              </span>
            </div>

            <p className="text-sm text-indigo-100 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 opacity-80" />
              {user.email}
            </p>

            <p className="text-xs text-indigo-200/90 flex items-center justify-center sm:justify-start gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-80" />
              Tham gia từ:{" "}
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                : "Hôm nay"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleEdit}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? "Đóng chỉnh sửa" : "Sửa hồ sơ"}
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white border border-red-400/40 text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
