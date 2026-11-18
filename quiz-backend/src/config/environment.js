import { config } from 'dotenv'

config({ quiet: true })



export const env = {
  BUILD_MODE: process.env.BUILD_MODE,
  PORT: process.env.PORT || 3201,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SECRETKEY_ACCESSTOKEN: process.env.SECRETKEY_ACCESSTOKEN,
  SECRETKEY_REFRESHTOKEN: process.env.SECRETKEY_REFRESHTOKEN,
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE || "2h",
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE || "14d",

  // Mail SMTP Config
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '465', 10),
  MAIL_SECURE: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT === '465' || !process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || `"Inno Quiz HUBT" <${process.env.MAIL_USER || 'no-reply@innoquiz.edu.vn'}>`
}
