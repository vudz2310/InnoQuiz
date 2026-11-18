import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../../store/slices/auth.slice";
import { Button, Input } from "../../../components/ui";
import { Eye, EyeOff, Sparkles, ShieldAlert, ArrowRight, RotateCcw } from "lucide-react";
import { authApi } from "../../../services/api/Auth.api";
import { useAuthForm } from "../../../hooks/useAuthForm";
import { validateLoginForm } from "../../../validations/auth.validate";
import { useNotification } from "../../../components/Notification";
import { getProfile } from "../../../services/api/User.api";
import logo from "../../../assets/images/logo_quiz.png";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showSuccess, showError, showInfo, addNotification } = useNotification();

  // Trigger welcome info toast when login page opens
  useEffect(() => {
    showInfo(
      "Hệ thống InnoQuiz HUBT",
      "Vui lòng điền email và mật khẩu sinh viên để truy cập nền tảng.",
    );
  }, []);

  const { values, setValues, errors, handleChange, handleBlur, validate } = useAuthForm(
    { email: "", password: "" },
    (v) => validateLoginForm(v.email, v.password),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnverifiedEmail(null);

    if (!validate()) {
      showError(
        "Thông tin chưa hợp lệ",
        "Vui lòng kiểm tra lại email và mật khẩu.",
      );
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login(values.email, values.password);
      const accessToken = res?.userInfo?.accessToken || res?.accessToken;
      const refreshToken = res?.userInfo?.refreshToken || res?.refreshToken;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      let userObj = res?.userInfo || {};
      try {
        const profile = await getProfile(accessToken, res?.userInfo?.id);
        if (profile) userObj = { ...userObj, ...profile };
      } catch (e) {
        console.warn("Could not fetch extra profile, fallback to res.userInfo:", e);
      }

      dispatch(setUser(userObj));
      localStorage.setItem("user", JSON.stringify(userObj));

      const role = (userObj?.role || res?.userInfo?.role || "").toUpperCase();

      showSuccess(
        "🎉 Đăng nhập thành công!",
        `Chào mừng ${userObj?.name || "bạn"} đã quay trở lại hệ thống.`
      );

      addNotification({
        title: "Đăng nhập thành công",
        message: `Phiên đăng nhập mới vừa được tạo cho ${values.email}.`,
        type: "system",
      });

      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (role === "TEACHER") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      const errCode = apiError.response?.data?.code;
      const errMsg =
        apiError.response?.data?.message ||
        "Email hoặc mật khẩu không đúng. Vui lòng thử lại!";

      if (errCode === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(values.email);
        showError("Chưa xác minh email", errMsg);
      } else {
        showError("Đăng nhập thất bại!", errMsg);
      }
      setValues((previous) => ({ ...previous, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickResendOtp = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await authApi.resendOtp(unverifiedEmail);
      showSuccess("Đã gửi mã mới", "Vui lòng kiểm tra email và nhập mã OTP.");
      navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Lỗi gửi lại mã", apiError.response?.data?.message || "Không thể gửi lại mã vào lúc này.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D1A] flex items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111827] rounded-[20px] border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-colors">
        {/* Left Section (Branding Banner) */}
        <section className="lg:col-span-5 bg-[#EEF2FF] dark:bg-[#0B0F19] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E2E8F0] dark:border-slate-800 relative overflow-hidden">
          {/* Subtle decoration */}
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
                  Inno <span className="text-[#4F46E5] dark:text-indigo-400">Quiz</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-slate-400">
                  HUBT Edition
                </span>
              </div>
            </Link>

            {/* Hero text */}
            <div className="mt-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 text-xs font-semibold border border-[#C7D2FE] dark:border-indigo-800/50 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Nền tảng học tập EdTech
              </span>

              <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
                Luyện tập trắc nghiệm <br />
                <span className="text-[#4F46E5] dark:text-indigo-400">thông minh & hiệu quả.</span>
              </h1>

              <p className="mt-4 text-sm text-[#475569] dark:text-slate-400 leading-relaxed">
                Truy cập hàng nghìn câu hỏi trắc nghiệm, tham gia các bài thi
                thử và theo dõi tiến độ nâng cao điểm số.
              </p>
            </div>
          </div>

          {/* Stats Box */}
          <div className="mt-6 pt-6 border-t border-[#C7D2FE]/60 dark:border-slate-800 relative z-10 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/80 dark:bg-[#111827] backdrop-blur-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <div className="text-lg font-bold text-[#4F46E5] dark:text-indigo-400">10K+</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                Câu hỏi
              </div>
            </div>
            <div className="bg-white/80 dark:bg-[#111827] backdrop-blur-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <div className="text-lg font-bold text-[#7C3AED] dark:text-purple-400">500+</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                Đề thi
              </div>
            </div>
            <div className="bg-white/80 dark:bg-[#111827] backdrop-blur-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <div className="text-lg font-bold text-[#06B6D4] dark:text-cyan-400">24/7</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                Luyện tập
              </div>
            </div>
          </div>
        </section>

        {/* Right Section (Login Form) */}
        <section className="lg:col-span-7 p-8 sm:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] p-1.5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <img src={logo} alt="InnoQuiz HUBT" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    Inno <span className="text-indigo-600 dark:text-indigo-400">Quiz</span>
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">HUBT Edition</span>
                </div>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                Đăng nhập
              </h2>
              <p className="mt-2 text-[#475569] dark:text-slate-400 text-sm">
                Nhập email và mật khẩu của bạn để đăng nhập vào hệ thống.
              </p>
            </div>

            {/* Unverified Email Warning Banner */}
            {unverifiedEmail && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 animate-in fade-in space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Tài khoản chưa được xác minh email
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                      Bạn cần xác thực mã OTP gửi về <strong>{unverifiedEmail}</strong> để có thể đăng nhập.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span>Xác minh email ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickResendOtp}
                    disabled={resending}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100/50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                    <span>{resending ? "Đang gửi..." : "Gửi lại mã"}</span>
                  </button>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-slate-200 mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  error={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-[#EF4444] mt-1.5 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-[#0F172A] dark:text-slate-200">
                    Mật khẩu
                  </label>
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                  <p className="text-xs text-[#EF4444] mt-1.5 font-medium">
                    {errors.password}
                  </p>
                )}
                <a
                  href="#forgot"
                  className="flex justify-end text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 mt-2"
                >
                  Quên mật khẩu?
                </a>
              </div>

              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-[#E2E8F0] dark:bg-slate-800" />
              <span className="text-xs text-[#94A3B8] dark:text-slate-500 uppercase tracking-wider font-medium">
                hoặc
              </span>
              <div className="h-px flex-1 bg-[#E2E8F0] dark:bg-slate-800" />
            </div>

            <Button type="button" variant="outline" fullWidth size="md">
              <span className="font-bold text-sm text-[#EF4444]">G</span>
              Tiếp tục với Google
            </Button>

            <p className="text-center text-sm text-[#475569] dark:text-slate-400 mt-8">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
