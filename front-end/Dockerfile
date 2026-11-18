# 1. Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Nhận biến API URL lúc build
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2. Production Stage
FROM nginx:alpine

# Thêm include mime.types và định nghĩa rõ đuôi .mjs là application/javascript
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    include /etc/nginx/mime.types;\n\
    types {\n\
        application/javascript js mjs;\n\
    }\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
