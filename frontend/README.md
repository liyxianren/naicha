# 奶茶大作战 - 前端应用

基于 React + TypeScript + Vite 的游戏前端界面。

## 技术栈

- **框架**: React 19
- **语言**: TypeScript
- **构建工具**: Vite 7
- **UI 库**: Ant Design 5 + NES.css（像素风格）
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **路由**: React Router v7
- **动画**: Framer Motion
- **部署**: Docker + Nginx + Zeabur

## 本地开发

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器将在 http://localhost:5173 启动。

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### 代码检查

```bash
# 运行 ESLint
npm run lint
```

## 环境变量配置

创建 `.env.local` 文件：

```env
# 后端 API 地址
VITE_API_URL=http://localhost:8000/api/v1
```

**注意**：Vite 环境变量必须以 `VITE_` 开头才能在客户端代码中访问。

## 项目结构

```
frontend/
├── src/
│   ├── pages/              # 页面组件
│   │   ├── Login.tsx       # 登录页
│   │   ├── Lobby.tsx       # 游戏大厅
│   │   ├── Room.tsx        # 等待房间
│   │   └── Game.tsx        # 游戏主界面
│   │
│   ├── components/game/    # 游戏组件
│   │   ├── GameHeader.tsx          # 游戏头部
│   │   ├── PlayerList.tsx          # 玩家列表
│   │   ├── DecisionPanel.tsx       # 决策面板
│   │   ├── ShopDecision.tsx        # 店铺决策
│   │   ├── EmployeeManagement.tsx  # 员工管理
│   │   ├── MarketAction.tsx        # 市场行动
│   │   ├── ProductResearch.tsx     # 产品研发
│   │   ├── ProductionPlan.tsx      # 生产计划
│   │   ├── RoundSummary.tsx        # 回合总结
│   │   ├── RoundSettlement.tsx     # 回合结算
│   │   └── GameEnd.tsx             # 游戏结束
│   │
│   ├── stores/             # Zustand 状态管理
│   │   ├── gameStore.ts            # 游戏状态
│   │   ├── gameRoundStore.ts       # 回合状态
│   │   ├── decisionStore.ts        # 决策状态
│   │   └── sessionStore.ts         # 会话状态
│   │
│   ├── api/                # API 客户端
│   │   ├── client.ts               # Axios 配置
│   │   ├── game.ts                 # 游戏 API
│   │   ├── player.ts               # 玩家 API
│   │   ├── production.ts           # 生产 API
│   │   ├── round.ts                # 回合 API
│   │   ├── finance.ts              # 财务 API
│   │   ├── shop.ts                 # 店铺 API
│   │   ├── employee.ts             # 员工 API
│   │   ├── product.ts              # 产品 API
│   │   ├── market.ts               # 市场 API
│   │   └── auth.ts                 # 认证 API
│   │
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   │
│   └── App.tsx             # 应用入口
│
├── public/                 # 静态资源
├── nginx.conf             # Nginx 配置
├── Dockerfile             # Docker 构建文件
├── .dockerignore          # Docker 忽略文件
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
└── tsconfig.json          # TypeScript 配置
```

## 主要功能模块

### 1. 认证系统
- 昵称登录
- Session Token 管理（localStorage 持久化）

### 2. 游戏大厅
- 创建游戏房间
- 加入游戏房间
- 房间列表查看

### 3. 等待房间
- 玩家列表实时更新
- 准备状态切换
- 房主开始游戏

### 4. 游戏界面
- **决策面板**：店铺、员工、市场、产品、生产五大决策模块
- **玩家列表**：实时显示所有玩家状态
- **回合信息**：当前回合、资金、利润等
- **结算动画**：回合结算和游戏结束动画

### 5. 状态管理

使用 Zustand 管理全局状态：
- `gameStore` - 游戏基础信息（game, player, players）
- `gameRoundStore` - 回合数据（shops, employees, products, productions）
- `decisionStore` - 决策提交状态
- `sessionStore` - 用户会话信息

## Zeabur 部署

### 1. 准备工作

确保仓库包含：
- ✅ `Dockerfile` - Docker 构建配置
- ✅ `nginx.conf` - Nginx 服务器配置
- ✅ `package.json` - 依赖和构建脚本

### 2. Dockerfile 说明

```dockerfile
# 两阶段构建
FROM node:18-alpine AS builder
# ... 构建阶段

FROM nginx:alpine
# ... 运行阶段（Nginx 提供静态文件）
```

### 3. 部署步骤

1. 在 Zeabur 创建新项目（如果与后端分离，可以是同一项目）
2. 添加服务 → 选择 Git 仓库
3. Zeabur 自动检测 Dockerfile 并构建

### 4. 环境变量配置

**重要**：构建时环境变量需要在 Zeabur 服务设置中配置：

```env
# 构建参数（Build Args）
VITE_API_URL=https://your-backend.zeabur.app/api/v1
```

**注意**：
- Vite 在**构建时**读取环境变量并打包到静态文件中
- 必须在 Dockerfile 中使用 `ARG` 接收构建参数
- 在 Zeabur 的 "Service → Variables → Build Args" 中配置

### 5. Nginx 配置

`nginx.conf` 已配置 SPA 路由回退：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

这确保 React Router 的客户端路由正常工作。

### 6. CORS 配置

确保后端 CORS 允许前端域名：

```python
# 后端 config.py
CORS_ORIGINS = 'https://your-frontend.zeabur.app'
```

### 7. 部署验证

访问 `https://your-frontend.zeabur.app`，检查：
- ✅ 页面正常加载
- ✅ API 请求成功（检查浏览器 Network 面板）
- ✅ 路由跳转正常

## API 接口集成

所有 API 调用通过 `src/api/client.ts` 统一配置：

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 30000,
});
```

### 请求拦截器
- 自动添加 `X-Session-Token` 请求头

### 响应拦截器
- 统一错误处理
- 自动解析响应数据

## 常见问题

### 1. API 请求失败（CORS 错误）
**解决方案**：检查后端 `CORS_ORIGINS` 是否包含前端域名

### 2. 环境变量未生效
**解决方案**：
- 确认变量名以 `VITE_` 开头
- 构建时环境变量需要在 Dockerfile 中声明 `ARG`
- 重新构建应用

### 3. 路由 404 错误
**解决方案**：确认 `nginx.conf` 包含 SPA 回退配置

### 4. 构建失败
**解决方案**：
- 检查 Node.js 版本（需要 18+）
- 清除缓存：`rm -rf node_modules package-lock.json && npm install`

## 开发建议

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式写法 + Hooks

### 性能优化
- 使用 `React.memo()` 避免不必要的重渲染
- 大列表使用虚拟滚动（如需要）
- 图片使用 WebP 格式

### 状态管理
- 全局状态放在 Zustand stores
- 组件内部状态使用 `useState`
- 避免 prop drilling，优先使用状态管理

## License

MIT
