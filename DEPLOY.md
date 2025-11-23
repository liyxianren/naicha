# 🚀 奶茶大作战 - 单容器部署指南

## 📦 部署方式

**前后端合一，只需部署一个服务！**

本项目使用单 Docker 容器部署方案：
- 前端（React）在构建时打包成静态文件
- 后端（Flask）同时服务 API 和前端静态文件
- 只需要部署**一个服务**，无需分别部署前后端

---

## 🎯 Zeabur 一键部署（推荐）

### 1. 推送代码到 GitHub

```bash
# 初始化 git 仓库（如果还没有）
git init
git add .
git commit -m "feat: 单容器部署配置"

# 推送到 GitHub
git remote add origin https://github.com/yourusername/naicha.git
git branch -M main
git push -u origin main
```

### 2. 在 Zeabur 部署

1. 登录 [Zeabur](https://zeabur.com)
2. 创建新项目
3. 点击 "Add Service" → 选择 "Git"
4. 连接 GitHub 并选择您的仓库
5. Zeabur 自动检测到 `Dockerfile` 并开始构建

### 3. 配置环境变量

在 Zeabur 服务的 **Variables** 标签页中添加：

```env
PORT=${WEB_PORT}
DATABASE_URL=mysql+pymysql://root:密码@主机:端口/数据库
SECRET_KEY=your-production-secret-key
DEBUG=False
FLASK_ENV=production
```

**示例**（使用 Zeabur MySQL）：
```env
PORT=${WEB_PORT}
DATABASE_URL=mysql+pymysql://root:I51dXb3JY6vgM87uf2SBsQ9W4yKRhOt0@sfo1.clusters.zeabur.com:32206/zeabur
SECRET_KEY=naicha-production-secret-key-2025
DEBUG=False
FLASK_ENV=production
```

### 4. 初始化数据库

部署成功后，通过 Zeabur Terminal 运行：

```bash
python scripts/setup_database.py
```

### 5. 访问应用

访问 Zeabur 提供的域名（例如：`https://naicha-xxx.zeabur.app`）

- **前端界面**：`https://naicha-xxx.zeabur.app/`
- **API 文档**：`https://naicha-xxx.zeabur.app/api`
- **健康检查**：`https://naicha-xxx.zeabur.app/health`

---

## 🛠️ 本地开发

### 分别运行前后端（开发模式）

**后端**：
```bash
cd backend
pip install -r requirements.txt
python run.py
# 运行在 http://localhost:8000
```

**前端**：
```bash
cd frontend
npm install
npm run dev
# 运行在 http://localhost:5173
```

### 使用 Docker 本地测试

```bash
# 构建镜像
docker build -t naicha:latest .

# 运行容器
docker run -p 8080:8080 \
  -e DATABASE_URL=mysql+pymysql://... \
  -e SECRET_KEY=test-key \
  -e DEBUG=False \
  naicha:latest

# 访问 http://localhost:8080
```

---

## 📋 架构说明

### Dockerfile 构建流程

1. **第一阶段（frontend-builder）**：
   - 使用 Node.js 18 构建前端
   - 安装依赖：`npm ci`
   - 构建静态文件：`npm run build`
   - 输出：`/app/frontend/dist`

2. **第二阶段（final）**：
   - 使用 Python 3.11
   - 安装后端依赖
   - 复制后端代码
   - **复制前端构建产物到 `./static` 目录**
   - 启动 Flask 服务

### Flask 路由规则

```
/api/v1/*      → 后端 API（JSON）
/health        → 健康检查（JSON）
/*             → 前端静态文件 + SPA 路由回退
```

- 所有 `/api/*` 请求由后端 API 处理
- 其他请求服务前端静态文件
- 不存在的路由返回 `index.html`（支持 React Router）

---

## ⚙️ 环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `PORT` | 是 | 服务端口 | `${WEB_PORT}` 或 `8080` |
| `DATABASE_URL` | 是 | MySQL 连接字符串 | `mysql+pymysql://user:pass@host:port/db` |
| `SECRET_KEY` | 是 | Flask 密钥 | `your-secret-key` |
| `DEBUG` | 否 | 调试模式（生产必须 False） | `False` |
| `FLASK_ENV` | 否 | Flask 环境 | `production` |

---

## 🔍 故障排查

### 1. 前端页面 404

**原因**：Flask 找不到静态文件

**解决**：
- 确保 Dockerfile 正确复制了前端构建产物
- 检查 `backend/static` 目录是否包含 `index.html`

### 2. API 请求失败

**原因**：前端 API 地址配置错误

**解决**：
- 前端使用相对路径 `/api/v1`，无需配置
- 检查浏览器开发者工具 Network 面板

### 3. 数据库连接失败

**原因**：`DATABASE_URL` 配置错误

**解决**：
- 检查环境变量格式
- 确认数据库主机、端口、用户名、密码正确
- Zeabur MySQL 需要使用外网地址（不是 localhost）

### 4. 端口冲突

**原因**：Zeabur 分配的端口与硬编码不一致

**解决**：
- 使用 `PORT=${WEB_PORT}` 让 Zeabur 自动分配
- `run.py` 会读取 `PORT` 环境变量

---

## 📊 性能优化

1. **前端构建优化**：
   - 生产构建自动压缩代码
   - 使用 Vite 的代码分割
   - 静态资源 CDN 加速（可选）

2. **后端优化**：
   - 使用 Gunicorn 替代 Flask 内置服务器（生产推荐）
   - 数据库连接池已配置（`pool_pre_ping=True`）
   - 设置合理的 `DB_POOL_RECYCLE` 值

3. **缓存策略**：
   - 静态文件设置浏览器缓存
   - API 响应根据业务需求缓存

---

## 📚 相关文档

- [技术设计文档](technical_design_document.md) - 详细技术实现
- [游戏规则](game_rules.md) - 完整游戏规则
- [后端文档](backend/README.md) - 后端开发指南
- [前端文档](frontend/README.md) - 前端开发指南

---

## 🎉 总结

**优势**：
- ✅ 只需部署一个服务，简单快捷
- ✅ 前后端同域名，无 CORS 问题
- ✅ 统一管理，降低运维成本
- ✅ Zeabur 一键部署，零配置

**部署清单**：
1. 推送代码到 GitHub
2. 在 Zeabur 连接仓库
3. 配置环境变量（5个）
4. 初始化数据库
5. 完成！🎊
