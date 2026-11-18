import nodemailer from "nodemailer";
import { env } from "../utils/constants.js";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

let transporter = null;

const getTransporter = () => {
  if (!transporter && env.MAIL_USER && env.MAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: env.MAIL_HOST || "smtp.gmail.com",
      port: env.MAIL_PORT || 465,
      secure: env.MAIL_SECURE, // true for 465, false for other ports
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

/**
 * Gửi email chứa mã xác thực OTP 6 số
 * @param {Object} param
 * @param {string} param.to - Địa chỉ email người nhận
 * @param {string} param.name - Tên người dùng
 * @param {string} param.otp - Mã OTP 6 chữ số
 */
const sendVerificationEmail = async ({ to, name, otp }) => {
  const mailTransporter = getTransporter();

  const recipientName = name || "bạn";

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mã xác minh Inno Quiz</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 40px auto; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <!-- Header -->
      <tr>
        <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); text-align: center;">
          <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Inno Quiz</h1>
          <p style="margin: 6px 0 0 0; color: #E0E7FF; font-size: 13px; font-weight: 500;">Nền tảng thi trắc nghiệm Đại học HUBT</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 32px;">
          <h2 style="margin: 0 0 16px 0; color: #0F172A; font-size: 18px; font-weight: 700;">Xác minh địa chỉ email</h2>
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Xin chào <strong>${recipientName}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Bạn đang thực hiện đăng ký tài khoản trên hệ thống <strong>Inno Quiz</strong> dành cho sinh viên và giảng viên HUBT. Vui lòng sử dụng mã OTP dưới đây để hoàn tất xác minh:
          </p>

          <!-- OTP Box -->
          <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #EEF2FF; border-radius: 16px; border: 1px dashed #C7D2FE;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4F46E5; font-family: monospace;">${otp}</span>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6366F1; font-weight: 600;">Mã có hiệu lực trong 5 phút</p>
          </div>

          <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.6; color: #64748B;">
            ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8;">
          <p style="margin: 0;">Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT)</p>
          <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} Inno Quiz. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Nếu SMTP chưa được config (ví dụ lúc đang dev offline), log cảnh báo thân thiện
  if (!mailTransporter) {
    console.warn(
      `[MAIL_SERVICE] [DEV MODE] SMTP chưa được cấu hình. Giả lập gửi OTP ${otp} tới ${to}`
    );
    return { success: true, simulated: true };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: env.MAIL_FROM || `"Inno Quiz HUBT" <${env.MAIL_USER}>`,
      to,
      subject: `[Mã xác minh ${otp}] Inno Quiz - Đại học HUBT`,
      html: htmlContent,
      text: `Xin chào ${recipientName},\n\nMã xác minh Inno Quiz của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.\n\nTrân trọng,\nInno Quiz HUBT`,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[MAIL_SERVICE] Lỗi gửi email qua SMTP:", error.message);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Không thể gửi mã xác minh qua email. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau!",
      [],
      "EMAIL_SEND_FAILED"
    );
  }
};

export const mailService = {
  sendVerificationEmail,
};
