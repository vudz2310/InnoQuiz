import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { indexRouter } from './routes/index.js'
import { env } from './utils/constants.js'
import cors from 'cors'
import { corsOptions } from './config/corsOptions.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { swaggerSpec } from './config/swagger.js'
import { securityCheckMiddleware, antiScrapingMiddleware } from './middlewares/rateLimiter.js'
import path from 'path'
import fs from 'fs'

const app = express();

// 1. Trust proxy an toàn
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 2. Middleware bảo vệ tầng ứng dụng: Chặn IP/User bị cấm & Phát hiện cào dữ liệu
app.use(securityCheckMiddleware);
app.use(antiScrapingMiddleware);

// Đảm bảo thư mục storage & uploads tồn tại và phục vụ file tĩnh
const baseStorageRoot = process.env.VERCEL ? '/tmp' : process.cwd();
const storageDir = path.join(baseStorageRoot, 'storage');
try {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Storage] Unable to create storageDir:', err.message);
}
app.use('/storage', express.static(storageDir));
app.use('/quizzes', express.static(path.join(storageDir, 'quizzes')));
app.use(express.static(storageDir));

const uploadsDir = path.join(baseStorageRoot, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Uploads] Unable to create uploadsDir:', err.message);
}
app.use('/uploads', express.static(uploadsDir));


// Preventions for disk caching (especially HTTP 410 error responses in browsers)
app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Swagger UI: Chỉ cho phép truy cập ở môi trường Development (BUILD_MODE === 'development')
if (env.BUILD_MODE === "development") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/swagger", (req, res) => res.redirect("/api-docs"));
  console.log(
    `[Swagger] Documentation available at: http://localhost:${env.PORT}/api-docs`,
  );
} else {
  // Ở môi trường khác (Production), chặn không cho truy cập Swagger
  app.use(["/api-docs", "/swagger"], (req, res) => {
    res.status(403).json({
      message: "Swagger UI is disabled in non-development environment",
    });
  });
}

app.use(['/v1', '/api/v1'], indexRouter)
app.use(errorHandlingMiddleware)

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log('Server lắng nghe ở cổng:', env.PORT)
  })
}

export default app
