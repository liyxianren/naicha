# ========================================
# 奶茶大作战 - 单容器部署 Dockerfile
# 前后端合一，只需部署一个服务
# ========================================

# ============ 第一阶段：构建前端 ============
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

# 复制前端源代码
COPY frontend ./

# 构建前端（API 地址使用相对路径，由后端统一提供）
ENV VITE_API_URL=/api/v1
RUN npm run build

# ============ 第二阶段：构建后端并整合前端 ============
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# 安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend ./

# 从第一阶段复制前端构建产物到 Flask 静态目录
COPY --from=frontend-builder /app/frontend/dist ./static

# 环境变量
ENV FLASK_ENV=production \
    PORT=8080

EXPOSE 8080

# 启动 Flask（会自动服务 static 目录的前端文件）
CMD ["python", "run.py"]
