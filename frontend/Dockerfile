FROM node:18-alpine AS builder
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# 拷贝源代码
COPY . /app

# 构建时接收环境变量
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 执行构建
RUN npm run build

# 运行阶段：使用 nginx 提供静态文件
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 自定义 nginx 配置，支持 SPA 回退
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
