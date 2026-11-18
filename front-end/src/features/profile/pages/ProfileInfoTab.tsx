import React, { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
  GraduationCap,
  Layers,
  Calendar,
  X,
} from "lucide-react";
import type { User } from "../../../types/auth.interface";
import type { Major, AcademicClass } from "../../../types/academic.interface";
import { updateProfile, changePassword } from "../../../services/api/User.api";
import { uploadApi } from "../../../services/api/Upload.api";
import { majorApi } from "../../../services/api/Major.api";
import { authApi } from "../../../services/api/Auth.api";
import { useNotification } from "../../../components/Notification";
import { useDispatch } from "react-redux";
import { setUser } from "../../../store/slices/auth.slice";
import { Button, SearchableSelect } from "../../../components/ui";

interface ProfileInfoTabProps {
  user: User;
  isEditing: boolean;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export default function ProfileInfoTab({
  user,
  isEditing,
  onSave,
  onCancel,
}: ProfileInfoTabProps) {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useNotification();

  // Form states
  const [name, setName] = useState(user.name || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Academic Info Update Modal
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [allMajors, setAllMajors] = useState<Major[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>([]);
  const [editStudentCode, setEditStudentCode] = useState(user.studentCode || "");
  const [editMajorId, setEditMajorId] = useState(user.majorId || "");
  const [editCohort, setEditCohort] = useState(user.academicClass?.cohort || "");
  const [editClassId, setEditClassId] = useState(user.classId || "");
  const [loadingAcademicData, setLoadingAcademicData] = useState(false);
  const [updatingAcademic, setUpdatingAcademic] = useState(false);

  const handleOpenAcademicModal = async () => {
    try {
      setLoadingAcademicData(true);
      setIsAcademicModalOpen(true);
      setEditStudentCode(user.studentCode || "");
      setEditMajorId(user.majorId || "");
      setEditCohort(user.academicClass?.cohort || "");
      setEditClassId(user.classId || "");

      const majorsData = await majorApi.getPublicMajors();
      setAllMajors(majorsData);

      if (user.majorId) {
        const classesData = await majorApi.getClassesByMajor(user.majorId);
        setAcademicClasses(classesData);
      } else {
        setAcademicClasses([]);
      }
    } catch {
      showError("Lỗi", "Không thể tải danh mục thông tin học thuật.");
    } finally {
      setLoadingAcademicData(false);
    }
  };

  const handleModalMajorChange = async (newMajorId: string) => {
    setEditMajorId(newMajorId);
    setEditCohort("");
    setEditClassId("");

    if (!newMajorId) {
      setAcademicClasses([]);
      return;
    }

    try {
      setLoadingAcademicData(true);
      const classesData = await majorApi.getClassesByMajor(newMajorId);
      setAcademicClasses(classesData);
    } catch {
      showError("Lỗi", "Không thể tải danh sách lớp học của ngành đã chọn.");
      setAcademicClasses([]);
    } finally {
      setLoadingAcademicData(false);
    }
  };

  const handleModalCohortChange = (newCohort: string) => {
    setEditCohort(newCohort);
    setEditClassId("");
  };

  const availableModalCohorts = React.useMemo(() => {
    const dynamicCohorts = academicClasses
      .map((c) => c.cohort?.trim())
      .filter((c): c is string => Boolean(c && c.length > 0));

    const standardCohorts = [
      "K32", "K31", "K30", "K29", "K28", "K27", "K26", "K25", "K24"
    ];

    const set = new Set<string>();
    dynamicCohorts.forEach((c) => set.add(c));
    standardCohorts.forEach((c) => set.add(c));

    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      if (numA !== numB) return numB - numA;
      return b.localeCompare(a);
    });
  }, [academicClasses]);

  const filteredModalClasses = React.useMemo(() => {
    if (!editCohort) return academicClasses;
    const cleanCohort = editCohort.trim().toLowerCase();
    const cleanNum = cleanCohort.replace(/\D/g, "");

    return academicClasses.filter((c) => {
      if (!c.cohort) {
        return cleanNum ? (c.code.toLowerCase().includes(cleanNum) || c.name.toLowerCase().includes(cleanNum)) : true;
      }
      const cLower = c.cohort.toLowerCase();
      return (
        cLower === cleanCohort ||
        (cleanNum && cLower.includes(cleanNum)) ||
        (cleanNum && c.code.toLowerCase().includes(cleanNum))
      );
    });
  }, [academicClasses, editCohort]);

  const handleSaveAcademicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentCode.trim()) {
      showError("Thiếu thông tin", "Vui lòng nhập Mã sinh viên của bạn.");
      return;
    }
    if (!editMajorId) {
      showError("Thiếu thông tin", "Vui lòng chọn Ngành đào tạo.");
      return;
    }
    if (!editClassId) {
      showError("Thiếu thông tin", "Vui lòng chọn Lớp học phần của bạn.");
      return;
    }

    try {
      setUpdatingAcademic(true);
      const updatedData = await updateProfile({
        studentCode: editStudentCode.trim(),
        majorId: editMajorId,
        classId: editClassId,
      });

      const updatedUser: User = {
        ...user,
        studentCode: updatedData.studentCode || editStudentCode.trim(),
        majorId: updatedData.majorId || editMajorId,
        major: updatedData.major,
        classId: updatedData.classId || editClassId,
        academicClass: updatedData.academicClass,
      };

      dispatch(setUser(updatedUser));
      onSave(updatedUser);
      showSuccess("Cập nhật thành công", "Thông tin học thuật đã được cập nhật chính xác!");
      setIsAcademicModalOpen(false);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError(
        "Cập nhật thất bại",
        apiError.response?.data?.message || "Không thể cập nhật thông tin học thuật lúc này."
      );
    } finally {
      setUpdatingAcademic(false);
    }
  };

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi chọn file ảnh từ máy tính -> Gọi API upload multipart/form-data
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng ảnh
    if (!file.type.startsWith("image/")) {
      showError(
        "Tệp không hợp lệ",
        "Vui lòng chọn tệp hình ảnh (PNG, JPG, JPEG, WEBP)!",
      );
      return;
    }

    // Giới hạn dung lượng < 10MB
    if (file.size > 10 * 1024 * 1024) {
      showError(
        "Dung lượng quá lớn",
        "Vui lòng chọn ảnh có kích thước dưới 10MB!",
      );
      return;
    }

    setUploadingAvatar(true);
    try {
      // 1. Gọi riêng API upload multipart/form-data
      const uploadRes = await uploadApi.uploadImage(file);
      const imageUrl = uploadRes.url;

      setAvatar(imageUrl);
      setAvatarPreview(imageUrl);

      showSuccess(
        "Tải ảnh lên thành công",
        "Nhấn 'Lưu thay đổi' để cập nhật thông tin hồ sơ.",
      );
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      console.error("Lỗi upload ảnh:", err);
      showError(
        "Lỗi tải ảnh lên",
        apiError.response?.data?.message ||
          "Không thể tải ảnh lên server. Vui lòng thử lại!",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Xóa ảnh đại diện
  const handleRemoveAvatar = () => {
    setAvatar("");
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Lưu thông tin hồ sơ
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError("Tên không hợp lệ", "Họ và tên không được để trống!");
      return;
    }

    setSaving(true);
    try {
      const updatedData = await updateProfile({
        name: name.trim(),
        avatar: avatar,
      });

      const updatedUser: User = {
        ...user,
        name: updatedData.name || name.trim(),
        avatar: updatedData.avatar !== undefined ? updatedData.avatar : avatar,
      };

      dispatch(setUser(updatedUser));
      onSave(updatedUser);
      showSuccess(
        "Thành công",
        "Đã cập nhật thông tin cá nhân và ảnh đại diện!",
      );
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError(
        "Lỗi cập nhật",
        apiError.response?.data?.message ||
          "Không thể cập nhật thông tin lúc này. Vui lòng thử lại sau!",
      );
    } finally {
      setSaving(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!newPassword || newPassword.length < 8) {
      setPassError("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    setChangingPass(true);
    try {
      await changePassword(newPassword);
      setPassSuccess("Đổi mật khẩu thành công!");
      showSuccess(
        "Đổi mật khẩu thành công",
        "Mật khẩu của bạn đã được cập nhật an toàn.",
      );
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordSection(false);
        setPassSuccess("");
      }, 2000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      const msg =
        apiError.response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại!";
      setPassError(msg);
      showError("Lỗi đổi mật khẩu", msg);
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
              Hồ sơ cá nhân
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Quản lý thông tin tài khoản, ảnh đại diện và bảo mật tài khoản
              HUBT
            </p>
          </div>
          <span className="px-3 py-1 bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/40">
            <Sparkles className="w-3.5 h-3.5" /> HUBT Verified
          </span>
        </div>

        {/* 1. KHU VỰC TẢI ẢNH ĐẠI DIỆN */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-md border-2 border-white dark:border-slate-800">
              {avatarPreview || avatar ? (
                <img
                  src={avatarPreview || avatar}
                  alt={name || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(name || user.email || "U").charAt(0).toUpperCase()}</span>
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Thay đổi ảnh đại diện"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Ảnh đại diện
              </h3>
              {avatar && isEditing && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Gỡ ảnh
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Định dạng hỗ trợ: PNG, JPG, JPEG, WEBP (tối đa 10MB).
            </p>
            {isEditing && (
              <div className="pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-xs font-semibold"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Tải ảnh từ thiết bị
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 2. FORM THÔNG TIN CƠ BẢN */}
        <form className="space-y-5" onSubmit={handleSaveProfile}>
          <div>
            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditing || saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0B0F19] text-sm text-[#0F172A] dark:text-slate-100 font-semibold focus:bg-white dark:focus:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:focus:ring-indigo-500 disabled:opacity-80 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-800/50 text-sm text-[#64748B] dark:text-slate-400 font-medium cursor-not-allowed"
            />
          </div>

          {/* KHU VỰC THÔNG TIN HỌC THUẬT (MÃ SINH VIÊN, NGÀNH, KHÓA, LỚP) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Thông tin Học thuật HUBT
              </div>
              <button
                type="button"
                onClick={handleOpenAcademicModal}
                className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cập nhật thông tin học thuật
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mã sinh viên
                </span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {user.studentCode || (
                    <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ngành đào tạo
                </span>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user.major?.name || (
                    <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Khóa đào tạo
                </span>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user.academicClass?.cohort || (
                    <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Lớp học phần
                </span>
                {user.academicClass ? (
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.academicClass.code} - {user.academicClass.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Chưa cập nhật
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Vai trò hệ thống
              </label>
              <input
                type="text"
                disabled
                value={
                  user.role === "ADMIN"
                    ? "Quản trị viên"
                    : user.role === "TEACHER"
                    ? "Giảng viên"
                    : "Sinh viên HUBT"
                }
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-800/50 text-sm text-[#64748B] dark:text-slate-400 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Trường / Cơ sở
              </label>
              <input
                type="text"
                disabled
                value="Đại học Kinh doanh & Công nghệ Hà Nội"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-800/50 text-sm text-[#64748B] dark:text-slate-400 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Modal cập nhật toàn diện thông tin học thuật */}
          {isAcademicModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Cập nhật Thông tin Học thuật HUBT
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chỉnh sửa mã sinh viên, ngành học, khóa đào tạo và lớp học phần
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAcademicModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loadingAcademicData ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Đang tải danh mục đào tạo HUBT...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAcademicInfo} className="space-y-4">
                    {/* Mã sinh viên */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mã sinh viên HUBT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editStudentCode}
                        onChange={(e) => setEditStudentCode(e.target.value.toUpperCase())}
                        placeholder="Ví dụ: 28DTH01 hoặc 29KTPM02..."
                        className="w-full px-3.5 py-2.5 text-sm font-mono uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Chọn Ngành (SearchableSelect) */}
                    <div>
                      <SearchableSelect
                        label="Ngành đào tạo"
                        required
                        placeholder="-- Tìm kiếm & chọn ngành học --"
                        searchPlaceholder="Tìm theo tên ngành hoặc mã số..."
                        options={allMajors.map((m) => ({
                          value: m.id,
                          label: m.name,
                          badge: m.code,
                          subLabel: m.description || `Mã ngành: ${m.code}`,
                        }))}
                        value={editMajorId}
                        onChange={(val) => handleModalMajorChange(val)}
                        icon={<GraduationCap className="w-4 h-4 text-indigo-500" />}
                      />
                    </div>

                    {/* Chọn Khóa & Chọn Lớp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <SearchableSelect
                          label="Khóa đào tạo"
                          required
                          disabled={!editMajorId}
                          placeholder={!editMajorId ? "-- Chọn ngành trước --" : "-- Chọn khóa --"}
                          searchPlaceholder="Tìm khóa đào tạo (VD: K28, K29)..."
                          value={editCohort}
                          onChange={(val) => handleModalCohortChange(val)}
                          options={availableModalCohorts.map((co) => {
                            const display = co.toUpperCase().startsWith("K") ? co.toUpperCase() : `K${co}`;
                            return {
                              value: co,
                              label: `Khóa ${display}`,
                              badge: display,
                            };
                          })}
                          icon={<Calendar className="w-4 h-4 text-amber-500" />}
                        />
                      </div>

                      <div>
                        <SearchableSelect
                          label="Lớp học phần"
                          required
                          disabled={!editMajorId || filteredModalClasses.length === 0}
                          placeholder={
                            !editMajorId
                              ? "-- Chọn ngành trước --"
                              : filteredModalClasses.length === 0
                              ? "-- Không có lớp khóa này --"
                              : "-- Chọn lớp học --"
                          }
                          searchPlaceholder="Tìm mã lớp hoặc tên lớp..."
                          options={filteredModalClasses.map((c) => ({
                            value: c.id,
                            label: c.name,
                            badge: c.code,
                            subLabel: c.cohort ? `Khóa: ${c.cohort}` : undefined,
                          }))}
                          value={editClassId}
                          onChange={(val) => setEditClassId(val)}
                          emptyMessage="Không tìm thấy lớp học phần phù hợp."
                          icon={<Layers className="w-4 h-4 text-blue-500" />}
                        />
                      </div>
                    </div>

                    {editMajorId && editCohort && filteredModalClasses.length === 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Chưa có dữ liệu lớp học cho <b>{editCohort}</b> thuộc ngành này. Vui lòng liên hệ Giảng viên hoặc Quản trị viên để thêm lớp.
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAcademicModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={updatingAcademic || !editMajorId || !editClassId || !editStudentCode.trim()}
                      >
                        {updatingAcademic ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            Đang lưu...
                          </>
                        ) : (
                          "Lưu thông tin học thuật"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons Khi Đang Chỉnh Sửa */}
          {isEditing && (
            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving || uploadingAvatar}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setName(user.name || "");
                  setAvatar(user.avatar || "");
                  setAvatarPreview(user.avatar || "");
                  onCancel();
                }}
                disabled={saving}
                className="px-5 py-2.5 bg-[#F1F5F9] dark:bg-slate-800 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 text-[#475569] dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
        </form>

        {/* 3. KHU VỰC BẢO MẬT & ĐỔI MẬT KHẨU */}
        <div className="pt-6 border-t border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Đổi mật khẩu
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {showPasswordSection ? "Đóng" : "Đổi mật khẩu"}
            </button>
          </div>

          {showPasswordSection && (
            <form
              onSubmit={handleChangePassword}
              className="mt-5 p-5 bg-[#F8FAFC] dark:bg-[#0B0F19] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 space-y-4 animate-in fade-in"
            >
              {passError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                  Mật khẩu mới (tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={changingPass}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {changingPass ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </span>
                </Button>

                <button
                  type="button"
                  onClick={() => setShowPasswordSection(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
