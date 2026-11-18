# ==========================================
# 1. Base Stage
# ==========================================
FROM node:20-alpine AS base

# Cài đặt các thư viện hệ thống cần thiết cho Prisma, Bcrypt và Node native modules
RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app

# ==========================================
# 2. Dependencies & Build Stage
# ==========================================
FROM base AS dependencies

# Copy file cấu hình package & prisma
COPY package*.json ./
COPY prisma.config.js ./
COPY src/prisma ./src/prisma

# Cài đặt toàn bộ dependencies (bao gồm prisma devDependencies)
RUN npm ci

# Dummy DATABASE_URL cho bước generate Prisma Client
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quiz_backend_dev"
RUN npx prisma generate

# ==========================================
# 3. Production Runner Stage
# ==========================================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV BUILD_MODE=production
ENV PORT=3201

# Tạo non-root user để tăng tính bảo mật
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy dependencies và Prisma Client đã được sinh ra
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./
COPY --from=dependencies /app/prisma.config.js ./
COPY --from=dependencies /app/src/prisma ./src/prisma

# Copy mã nguồn ứng dụng
COPY src ./src

# Tạo thư mục uploads lưu trữ ảnh và cấp quyền thư mục cho user backend
RUN mkdir -p /app/uploads && chown -R backend:nodejs /app

USER backend

EXPOSE 3201

# Tự động đẩy schema vào PostgreSQL nếu DB mới và khởi động server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]

