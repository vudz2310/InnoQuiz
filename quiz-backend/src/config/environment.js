import { config } from 'dotenv'
import service from '../../service.mjs'

config({ quiet: true })

// Values the user owns arrive through the service's input, bound in module.mjs.
const input = service.input()

export const env = {
  BUILD_MODE: process.env.BUILD_MODE,
  PORT: process.env.PORT || 3201,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: input.corsOrigin ? input.corsOrigin.expose() : 'http://localhost:5173',
  SECRETKEY_ACCESSTOKEN: input.accessTokenSecret.expose(),
  SECRETKEY_REFRESHTOKEN: input.refreshTokenSecret.expose(),
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE || "2h",
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE || "14d",

  // Mail SMTP Config
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '465', 10),
  MAIL_SECURE: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT === '465' || !process.env.MAIL_PORT,
  MAIL_USER: input.mailUser ? input.mailUser.expose() : '',
  MAIL_PASSWORD: input.mailPassword ? input.mailPassword.expose() : '',
  MAIL_FROM: process.env.MAIL_FROM || `"Inno Quiz HUBT" <${(input.mailUser ? input.mailUser.expose() : '') || 'no-reply@innoquiz.edu.vn'}>`
}
