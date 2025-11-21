# 🧋 奶茶大作战 - 在线游戏系统

一个基于 Web 的多人在线商业模拟游戏，玩家扮演奶茶店经营者，通过产品研发、定价、营销等决策进行商业竞争。

## 📋 项目概述

- **游戏类型**: 商业模拟 + 桌游电子化
- **玩家数量**: 2-4人
- **游戏回合**: 10回合
- **技术栈**: React + FastAPI + MySQL

## 🏗️ 项目结构

```
naicha/
├── backend/                    # 后端服务 (Python FastAPI)
│   ├── app/
│   │   ├── api/v1/            # API路由
│   │   ├── core/              # 核心配置
│   │   ├── models/            # 数据模型
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # 业务逻辑
│   │   └── utils/             # 工具函数
│   ├── scripts/               # 数据库脚本
│   ├── requirements.txt       # Python依赖
│   └── .env                   # 环境变量
│
├── frontend/                   # 前端应用 (React + TypeScript)
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── services/          # API服务
│   │   └── store/             # 状态管理
│   ├── package.json
│   └── vite.config.ts
│
├── technical_design_document.md  # 技术方案文档
└── README.md                      # 项目说明
```

## 🚀 快速开始

### 前置要求

- **Node.js** 16+
- **Python** 3.10+
- **MySQL** 数据库访问权限

### 1. 数据库初始化

```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install python-dotenv pymysql cryptography

# 执行数据库初始化脚本
python scripts/setup_database.py
```

执行成功后会看到12张数据表创建完成。

### 2. 后端服务

```bash
# 在 backend 目录下

# 安装所有Python依赖
pip install -r requirements.txt

# 启动Flask服务器
python run.py
```

服务器启动后访问：
- http://localhost:8000/ - API根路径
- http://localhost:8000/api/v1/games - 游戏API
- http://localhost:8000/api/v1/players - 玩家API

### 3. 前端应用

```bash
# 在 frontend 目录下（待初始化）

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🎮 游戏核心玩法

### 三大核心模块

1. **生产端**（玩家操作界面）
   - 店铺开设与装修
   - 员工招募与管理
   - 产品研发
   - 生产决策与定价
   - 市场决策（广告、调研）

2. **计算端**（后台引擎）
   - 口碑分计算
   - 客流分配算法
   - 批量折扣计算
   - 客流量生成

3. **财务端**（报表系统）
   - 收支自动统计
   - 利润计算
   - 财务报表生成

### 核心机制

- **7种产品**: 奶茶、椰奶、柠檬茶、果汁、珍珠奶茶、水果奶昔、水果茶
- **4种原材料**: 茶叶、牛奶、水果、配料（批量折扣机制）
- **客流分配**: 高购买力客户优先看口碑，低购买力客户优先看价格
- **累计利润**: 10回合后利润最高者获胜

## 📊 数据库结构

已创建12张数据表：

- `games` - 游戏房间
- `players` - 玩家信息
- `shops` - 店铺
- `employees` - 员工
- `product_recipes` - 产品配方（配置表，含7种产品）
- `player_products` - 玩家解锁产品
- `round_productions` - 回合生产计划
- `material_inventories` - 原材料库存
- `finance_records` - 财务记录
- `customer_flows` - 客流量
- `research_logs` - 研发记录
- `market_actions` - 市场行动

## 🔧 技术栈详情

### 后端
- **框架**: Flask 3.0
- **ORM**: Flask-SQLAlchemy (SQLAlchemy 2.0)
- **数据库**: MySQL (通过PyMySQL连接)
- **实时通信**: Flask-SocketIO
- **数据序列化**: Marshmallow

### 前端（计划中）
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI库**: Ant Design
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **实时通信**: Socket.IO Client

## 📡 API接口

### 游戏管理
- `POST /api/v1/games/create` - 创建游戏房间
- `GET /api/v1/games/{room_code}` - 获取游戏信息
- `POST /api/v1/games/{room_code}/start` - 开始游戏

### 玩家管理
- `POST /api/v1/players/join/{room_code}` - 加入游戏
- `PATCH /api/v1/players/{player_id}/ready` - 玩家准备
- `GET /api/v1/players/{player_id}` - 获取玩家信息

更多API请查看: http://localhost:8000/docs

## 🗺️ 开发计划

### ✅ 已完成
- [x] 项目结构创建
- [x] 数据库设计与初始化
- [x] 后端基础框架
- [x] 游戏与玩家API
- [x] 技术方案文档

### 🚧 进行中
- [ ] 前端项目初始化
- [ ] 游戏大厅界面
- [ ] 生产端界面

### 📅 待开发
- [ ] 完整的业务逻辑API
- [ ] 客流分配算法实现
- [ ] 财务报表系统
- [ ] WebSocket实时通信
- [ ] 前端完整功能

## 📖 文档

- [技术方案设计文档](./technical_design_document.md) - 详细的技术实现方案（800+行）
- [游戏规则文档](./game_rules.md) - 完整的游戏规则说明

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**开发团队**: Claude Code
**最后更新**: 2025-11-16
