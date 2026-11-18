import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, SearchableSelect } from "../../../components/ui";
import {
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  Layers,
  Calendar,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { authApi } from "../../../services/api/Auth.api";
import { majorApi } from "../../../services/api/Major.api";
import type { Major, AcademicClass } from "../../../types/academic.interface";
import { useAuthForm } from "../../../hooks/useAuthForm";
import { validateRegisterForm } from "../../../validations/auth.validate";
import { useNotification } from "../../../components/Notification";
import logo from "../../../assets/images/logo_quiz.png";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Danh mục ngành học & lớp học từ API
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(true);
  const [majorsError, setMajorsError] = useState<string | null>(null);

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const { values, errors, handleChange, setFields, handleBlur, validate } =
    useAuthForm(
      {
        fullname: "",
        studentCode: "",
        email: "",
        password: "",
        confirmPassword: "",
        majorId: "",
        cohort: "",
        classId: "",
        agree: false,
      },
      (v) =>
        validateRegisterForm(
          v.fullname,
          v.studentCode,
          v.email,
          v.password,
          v.confirmPassword,
          v.majorId,
          v.cohort,
          v.classId,
          v.agree,
        ),
    );

  // 1. Tải danh sách ngành học hợp lệ (status = ACTIVE & allowRegistration = true)
  const fetchMajors = async () => {
    try {
      setLoadingMajors(true);
      setMajorsError(null);
      const data = await majorApi.getPublicMajors();
      setMajors(data);
    } catch {
      setMajorsError("Không thể tải danh sách ngành học. Vui lòng thử lại!");
    } finally {
      setLoadingMajors(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  // 2. Danh sách Khóa đào tạo lấy từ danh sách lớp học của ngành đã chọn
  const availableCohorts = useMemo(() => {
    if (!classes || classes.length === 0) {
      return [];
    }

    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.cohort && c.cohort.trim()) {
        const raw = c.cohort.trim();
        const formatted = raw.toUpperCase().startsWith("K")
          ? raw.toUpperCase()
          : `K${raw.replace(/\D/g, "") || raw}`;
        set.add(formatted);
      }
    });

    const cohortList = Array.from(set);
    if (cohortList.length > 0) {
      return cohortList.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        if (numA !== numB) return numB - numA;
        return b.localeCompare(a);
      });
    }

    // Nếu chưa có trường cohort riêng, trích xuất tự động từ mã lớp (VD: TH28.01 -> K28)
    const extractedFromCodes = new Set<string>();
    classes.forEach((c) => {
      const match = c.code.match(/(?:K)?(\d{2})/i);
      if (match && match[1]) {
        extractedFromCodes.add(`K${match[1]}`);
      }
    });

    if (extractedFromCodes.size > 0) {
      return Array.from(extractedFromCodes).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numB - numA;
      });
    }

    return ["K32", "K31", "K30", "K29", "K28", "K27", "K26", "K25", "K24"];
  }, [classes]);

  // 3. Lọc danh sách lớp học theo Khóa đã chọn (ví dụ: Khóa 28 chỉ lọc lớp thuộc Khóa 28)
  const filteredClasses = useMemo(() => {
    if (!values.cohort) return classes;
    const cleanCohort = values.cohort.trim().toLowerCase();
    const cleanNum = cleanCohort.replace(/\D/g, "");

    return classes.filter((c) => {
      if (c.cohort) {
        const cLower = c.cohort.toLowerCase();
        const cNum = cLower.replace(/\D/g, "");
        if (cLower === cleanCohort || (cleanNum && cNum === cleanNum)) {
          return true;
        }
      }
      if (cleanNum) {
        return (
          c.code.toLowerCase().includes(cleanNum) ||
          c.name.toLowerCase().includes(cleanNum)
        );
      }
      return true;
    });
  }, [classes, values.cohort]);

  // 4. Khi người dùng đổi ngành -> Tải danh sách lớp thuộc ngành đó & reset khóa + lớp
  const handleMajorSelect = async (selectedMajorId: string) => {
    setFields({
      majorId: selectedMajorId,
      cohort: "",
      classId: "",
    });

    if (!selectedMajorId) {
      setClasses([]);
      return;
    }

    try {
      setLoadingClasses(true);
      const classData = await majorApi.getClassesByMajor(selectedMajorId);
      setClasses(classData);
    } catch {
      showError("Lỗi", "Không thể tải danh sách lớp học của ngành đã chọn.");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleCohortSelect = (selectedCohort: string) => {
    setFields({
      cohort: selectedCohort,
      classId: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showError(
        "Thông tin không hợp lệ",
        "Vui lòng kiểm tra lại tất cả các trường dữ liệu bắt buộc (Họ tên, MSSV, Ngành, Khóa, Lớp...).",
      );
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        fullName: values.fullname.trim(),
        studentCode: values.studentCode.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        majorId: values.majorId,
        classId: values.classId ? values.classId : null,
      });

      showSuccess(
        "Mã xác thực đã được gửi!",
        res?.message ||
          "Vui lòng kiểm tra email của bạn và nhập mã OTP 6 chữ số để kích hoạt tài khoản.",
      );

      navigate(
        `/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`,
      );
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string; code?: string } };
      };
      const errMsg =
        apiError.response?.data?.message ||
        "Đã xảy ra lỗi trong quá trình tạo tài khoản. Vui lòng thử lại!";

      showError("Đăng ký chưa thành công", errMsg);

      // Nếu tài khoản đã tạo nhưng trong thời gian chờ OTP -> tự động chuyển sang trang xác thực
      if (
        apiError.response?.data?.code === "OTP_RESEND_COOLDOWN" ||
        errMsg.toLowerCase().includes("vui lòng đợi")
      ) {
        navigate(
          `/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D1A] flex items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111827] rounded-[20px] border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-colors">
        {/* Left Section (Branding Banner) */}
        <section className="lg:col-span-5 bg-[#EEF2FF] dark:bg-[#0B0F19] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E2E8F0] dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#7C3AED]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#06B6D4]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1E293B] p-1.5 shadow-sm border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center transition-transform group-hover:scale-105">
                <img
                  src={logo}
                  alt="InnoQuiz HUBT Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-tight">
                  Inno{" "}
                  <span className="text-[#4F46E5] dark:text-indigo-400">
                    Quiz
                  </span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-slate-400">
                  HUBT Edition
                </span>
              </div>
            </Link>

            {/* Hero text */}
            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 text-xs font-semibold border border-[#C7D2FE] dark:border-indigo-800/50 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Dành riêng cho sinh viên
                HUBT
              </span>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
                Tạo tài khoản sinh viên <br />
                <span className="text-[#4F46E5] dark:text-indigo-400">
                  bắt đầu ôn luyện ngay.
                </span>
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-[#475569] dark:text-slate-400 leading-relaxed">
                Đăng ký tài khoản với mã sinh viên và ngành học của bạn để tiếp
                cận kho đề thi trắc nghiệm bám sát chương trình đào tạo trường
                Đại học Kinh doanh và Công nghệ Hà Nội.
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="mt-8 pt-6 border-t border-[#C7D2FE]/60 dark:border-slate-800 relative z-10 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#0F172A] dark:text-slate-200 font-semibold bg-white/70 dark:bg-[#111827] p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5] dark:bg-indigo-400 shrink-0" />
              Đề thi phân theo đúng chuyên ngành HUBT
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#0F172A] dark:text-slate-200 font-semibold bg-white/70 dark:bg-[#111827] p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED] dark:bg-purple-400 shrink-0" />
              Phòng thi trực tuyến đồng bộ theo mã lớp
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#0F172A] dark:text-slate-200 font-semibold bg-white/70 dark:bg-[#111827] p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] dark:bg-cyan-400 shrink-0" />
              Luyện đề thi thử và nhận kết quả tức thì
            </div>
          </div>
        </section>

        {/* Right Section (Register Form) */}
        <section className="lg:col-span-7 p-6 sm:p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] p-1.5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="InnoQuiz HUBT"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    Inno{" "}
                    <span className="text-indigo-600 dark:text-indigo-400">
                      Quiz
                    </span>
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                    HUBT Edition
                  </span>
                </div>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                Đăng ký tài khoản Sinh viên
              </h2>
              <p className="mt-1 text-[#475569] dark:text-slate-400 text-xs sm:text-sm">
                Điền thông tin học tập của bạn để tham gia hệ thống Inno Quiz.
              </p>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
              {/* 1. Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Nhập đầy đủ họ tên"
                  value={values.fullname}
                  onChange={(e) => handleChange("fullname", e.target.value)}
                  onBlur={() => handleBlur("fullname")}
                  error={!!errors.fullname}
                />
                {errors.fullname && (
                  <p className="text-xs text-[#EF4444] mt-1 font-medium">
                    {errors.fullname}
                  </p>
                )}
              </div>

              {/* 2. Mã sinh viên */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200 mb-1">
                  Mã sinh viên (MSV) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Nhập mã sinh viên"
                  value={values.studentCode}
                  onChange={(e) => handleChange("studentCode", e.target.value)}
                  onBlur={() => handleBlur("studentCode")}
                  error={!!errors.studentCode}
                  className="font-mono"
                />
                {errors.studentCode && (
                  <p className="text-xs text-[#EF4444] mt-1 font-medium">
                    {errors.studentCode}
                  </p>
                )}
              </div>

              {/* 3. Ngành học (SearchableSelect với ô tìm kiếm tức thì) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-slate-200 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    Ngành đào tạo <span className="text-rose-500">*</span>
                  </label>
                  {loadingMajors && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải...
                    </span>
                  )}
                </div>

                {majorsError ? (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs text-rose-600">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {majorsError}
                    </span>
                    <button
                      type="button"
                      onClick={fetchMajors}
                      className="underline font-semibold cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <SearchableSelect
                    placeholder="-- Tìm kiếm & chọn ngành học của bạn --"
                    searchPlaceholder="Nhập tên ngành hoặc mã số (VD: CNTT, Kinh tế, 7480201...)"
                    options={majors.map((m) => ({
                      value: m.id,
                      label: m.name,
                      badge: m.code,
                      subLabel: m.description || `Mã ngành: ${m.code}`,
                      count: m.totalClasses,
                    }))}
                    value={values.majorId}
                    onChange={(val) => handleMajorSelect(val)}
                    onBlur={() => handleBlur("majorId")}
                    error={errors.majorId}
                    emptyMessage="Không tìm thấy ngành học phù hợp."
                    icon={<GraduationCap className="w-4 h-4 text-indigo-500" />}
                  />
                )}
              </div>

              {/* 4. Khóa đào tạo (Bắt buộc, chọn K28, K29, K30...) */}
              <div>
                <label className="text-xs font-semibold text-[#0F172A] dark:text-slate-200 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Khóa sinh viên <span className="text-rose-500">*</span>
                </label>

                <select
                  disabled={!values.majorId}
                  value={values.cohort}
                  onChange={(e) => handleCohortSelect(e.target.value)}
                  onBlur={() => handleBlur("cohort")}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#111827] text-slate-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${
                    errors.cohort
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#E2E8F0] dark:border-slate-700"
                  }`}
                >
                  <option value="">
                    {values.majorId
                      ? "-- Chọn khóa đào tạo --"
                      : "Vui lòng chọn ngành đào tạo trước"}
                  </option>
                  {availableCohorts.map((c) => (
                    <option key={c} value={c}>
                      Khóa{" "}
                      {c.startsWith("K") || c.startsWith("k")
                        ? c.toUpperCase()
                        : `K${c}`}
                    </option>
                  ))}
                </select>
                {errors.cohort && (
                  <p className="text-xs text-[#EF4444] mt-1 font-medium">
                    {errors.cohort}
                  </p>
                )}
              </div>

              {/* 5. Mã lớp học phần (SearchableSelect tự động lọc theo Khóa & Ngành) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-slate-200 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Mã lớp học phần <span className="text-rose-500">*</span>
                  </label>
                  {loadingClasses && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải
                      lớp...
                    </span>
                  )}
                  {values.cohort && !loadingClasses && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {filteredClasses.length} lớp phù hợp
                    </span>
                  )}
                </div>

                <SearchableSelect
                  disabled={!values.cohort || loadingClasses}
                  placeholder={
                    !values.majorId
                      ? "Vui lòng chọn ngành trước"
                      : !values.cohort
                        ? "Vui lòng chọn khóa đào tạo trước"
                        : filteredClasses.length === 0
                          ? `Không có lớp nào thuộc Khóa ${values.cohort}`
                          : "-- Tìm kiếm & chọn lớp học phần của bạn --"
                  }
                  searchPlaceholder="Tìm theo mã lớp hoặc tên lớp (VD: TH29.01)..."
                  options={filteredClasses.map((c) => ({
                    value: c.id,
                    label: c.name,
                    badge: c.code,
                    subLabel: c.cohort ? `Khóa: ${c.cohort}` : undefined,
                  }))}
                  value={values.classId}
                  onChange={(val) => handleChange("classId", val)}
                  onBlur={() => handleBlur("classId")}
                  error={errors.classId}
                  emptyMessage={
                    filteredClasses.length === 0
                      ? `Không có lớp nào thuộc Khóa ${values.cohort}`
                      : "Không tìm thấy lớp học phần phù hợp."
                  }
                  icon={<Layers className="w-4 h-4 text-blue-500" />}
                />
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">
                  Hệ thống tự động lọc danh sách lớp thuộc đúng Khóa bạn chọn.
                  Nếu chọn sai, bạn có thể cập nhật lại trong trang Cá nhân.
                </p>
              </div>

              {/* 5. Email */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200 mb-1">
                  Email nhận mã xác thực{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="sinhvien@hubt.edu.vn hoặc gmail cá nhân"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  error={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-[#EF4444] mt-1 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 6. Mật khẩu & Xác nhận */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      value={values.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      error={!!errors.password}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-slate-500 hover:text-[#475569] dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-[#EF4444] mt-1 font-medium">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-200 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={values.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    onBlur={() => handleBlur("confirmPassword")}
                    error={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-[#EF4444] mt-1 font-medium">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* 7. Điều khoản */}
              <div>
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={values.agree}
                    onChange={(e) => handleChange("agree", e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#4F46E5] dark:text-indigo-500 border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-[#111827] rounded focus:ring-[#4F46E5] cursor-pointer"
                  />
                  <span className="text-xs text-[#64748B] dark:text-slate-400 leading-5">
                    Tôi đồng ý với{" "}
                    <span className="text-[#4F46E5] dark:text-indigo-400 font-semibold">
                      Điều khoản sử dụng
                    </span>{" "}
                    và{" "}
                    <span className="text-[#4F46E5] dark:text-indigo-400 font-semibold">
                      Chính sách đào tạo HUBT
                    </span>
                  </span>
                </label>
                {errors.agree && (
                  <p className="text-xs text-[#EF4444] mt-1 font-medium">
                    {errors.agree}
                  </p>
                )}
              </div>

              <Button type="submit" fullWidth size="md" disabled={loading}>
                {loading ? "Đang xử lý đăng ký..." : "Tạo tài khoản sinh viên"}
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-[#475569] dark:text-slate-400 mt-5">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
