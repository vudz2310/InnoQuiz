import { env } from './environment.js'

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim())

export const corsOptions = {
  origin: function (origin, callback) {
    if (env.BUILD_MODE === 'development' || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },

  optionsSuccessStatus: 200,
  credentials: true
}
