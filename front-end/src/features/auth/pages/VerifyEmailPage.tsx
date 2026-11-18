import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
} from "lucide-react";
import { authApi } from "../../../services/api/Auth.api";
import { useNotification } from "../../../components/Notification";
import { Button } from "../../../components/ui";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [emailInput, setEmailInput] = useState(emailFromUrl);
  const [isEditingEmail, setIsEditingEmail] = useState(!emailFromUrl);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Countdown timers
  const [expireSeconds, setExpireSeconds] = useState(300); // 5 phút
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Helper hàm làm mờ email: student@hubt.edu.vn -> s***@hubt.edu.vn
  const maskEmail = (rawEmail: string) => {
    if (!rawEmail || !rawEmail.includes("@")) return rawEmail;
    const [user, domain] = rawEmail.split("@");
    if (user.length <= 2) return `${user.charAt(0)}***@${domain}`;
    return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
  };

  // Expiry Timer (5 phút)
  useEffect(() => {
    if (expireSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpireSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [expireSeconds]);

  // Resend Cooldown Timer (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto focus vào ô đầu tiên khi mở trang
  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [email]);

  // Xử lý thay đổi từng ô OTP
  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage("");
    // Chỉ lấy ký tự số
    const numericChar = value.replace(/\D/g, "");

    const newOtp = [...otp];
    if (numericChar.length > 0) {
      newOtp[index] = numericChar[numericChar.length - 1];
      setOtp(newOtp);

      // Chuyển focus sang ô kế tiếp
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newOtp[index] = "";
      setOtp(newOtp);
    }

    // Nếu đã đủ 6 số -> tự động submit
    if (newOtp.every((digit) => digit !== "")) {
      handleSubmitOtp(newOtp.join(""));
    }
  };

  // Xử lý phím điều hướng & Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Xử lý Paste cả chuỗi 6 số
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const numericOnly = pastedData.replace(/\D/g, "").slice(0, 6);

    if (numericOnly.length === 6) {
      const digits = numericOnly.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleSubmitOtp(numericOnly);
    } else if (numericOnly.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < numericOnly.length; i++) {
        newOtp[i] = numericOnly[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(numericOnly.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Submit verify OTP
  const handleSubmitOtp = async (otpString?: string) => {
    const code = otpString || otp.join("");
    if (code.length !== 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã xác thực.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Vui lòng cung cấp địa chỉ email cần xác minh.");
      return;
    }

    if (expireSeconds <= 0) {
      setErrorMessage("Mã xác minh đã hết hạn. Vui lòng bấm [Gửi lại mã].");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await authApi.verifyEmail(email.trim(), code);
      setSuccessMessage("Xác minh email thành công! Đang chuyển đến trang đăng nhập...");
      showSuccess("Xác minh thành công", "Tài khoản của bạn đã được kích hoạt.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      const errorMsg =
        apiError.response?.data?.message ||
        "Mã xác minh không chính xác hoặc đã hết hạn. Vui lòng thử lại!";
      setErrorMessage(errorMsg);
      showError("Xác minh thất bại", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email để nhận mã xác minh.");
      return;
    }

    setResending(true);
    setErrorMessage("");

    try {
      await authApi.resendOtp(email.trim());
      showSuccess("Đã gửi lại mã", "Vui lòng kiểm tra hộp thư đến hoặc mục Spam.");
      setResendCooldown(60);
      setExpireSeconds(300);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      const errorMsg =
        apiError.response?.data?.message ||
        "Không thể gửi lại mã vào lúc này. Vui lòng thử lại sau!";
      setErrorMessage(errorMsg);
      showError("Lỗi gửi lại mã", errorMsg);
    } finally {
      setResending(false);
    }
  };

  // Định dạng thời gian mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D1A] flex items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-6 bg-white dark:bg-[#111827] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xl overflow-hidden">
        {/* CỘT TRÁI: Branding HUBT & Hướng dẫn bảo mật */}
        <section className="lg:col-span-5 bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#312E81] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-indigo-100 hover:text-white text-xs font-semibold mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Đăng nhập</span>
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-white leading-tight tracking-tight">
                  Inno Quiz
                </h1>
                <p className="text-2xs font-semibold text-indigo-200 uppercase tracking-wider">
                  HUBT Verification Security
                </p>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
              Xác thực email tài khoản
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Nhằm đảm bảo an toàn cho tài khoản và chống spam, hệ thống đã gửi mã OTP 6 chữ số tới hộp thư email của bạn.
            </p>

            <div className="mt-8 space-y-3.5 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <div className="flex items-start gap-2.5 text-xs text-indigo-100">
                <Lock className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                <span>Mã xác minh chỉ có hiệu lực trong vòng <strong>5 phút</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-indigo-100">
                <Info className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                <span>Không chia sẻ mã này cho bất kỳ ai dưới mọi hình thức.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                <span>Kiểm tra thư mục <strong>Spam / Rác</strong> nếu chưa thấy trong Hộp thư đến.</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-indigo-200 mt-8 pt-4 border-t border-white/10">
            Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT)
          </p>
        </section>

        {/* CỘT PHẢI: Form nhập mã 6 số OTP */}
        <section className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Xác minh địa chỉ Email
              </h3>
              
              {/* Email Display & Edit */}
              {!isEditingEmail && email ? (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Mã xác minh đã được gửi đến:</span>
                  <strong className="font-bold text-[#4F46E5] dark:text-indigo-400">
                    {maskEmail(email)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(true);
                      setEmailInput(email);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer text-2xs ml-1"
                  >
                    Đổi
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F19] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (emailInput.trim()) {
                        setEmail(emailInput.trim());
                        setIsEditingEmail(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              )}
            </div>

            {/* Error & Success Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* 6 OTP INPUT BOXES */}
            <div className="my-6">
              <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                Nhập 6 chữ số mã xác nhận:
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-2xl border transition-all duration-150 outline-none select-none ${
                      digit
                        ? "border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 ring-2 ring-indigo-500/20"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-600 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20"
                    }`}
                  />
                ))}
              </div>

              {/* Countdown Expiry */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Mã có hiệu lực trong:</span>
                <span
                  className={`font-mono font-bold ${
                    expireSeconds <= 60
                      ? "text-red-500 animate-pulse"
                      : "text-[#4F46E5] dark:text-indigo-400"
                  }`}
                >
                  {formatTime(expireSeconds)}
                </span>
              </div>
            </div>

            {/* Verify Action Button */}
            <Button
              type="button"
              onClick={() => handleSubmitOtp()}
              variant="primary"
              size="lg"
              fullWidth
              disabled={otp.some((d) => !d) || loading}
            >
              {loading ? "Đang xác minh..." : "Xác minh tài khoản"}
            </Button>

            {/* Resend OTP & Cooldown */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Không nhận được mã xác nhận?
              </p>

              {resendCooldown > 0 ? (
                <span className="inline-block text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl">
                  Gửi lại mã sau <strong>{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  <span>{resending ? "Đang gửi..." : "Gửi lại mã xác minh"}</span>
                </button>
              )}
            </div>

            {/* Link back */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
              Cần hỗ trợ?{" "}
              <Link
                to="/contact"
                className="font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline"
              >
                Liên hệ hỗ trợ HUBT
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
