# 奶茶大作战 - 项目交接文档

> **文档版本**: v1.0
> **更新日期**: 2025-11-21
> **项目状态**: 开发中（核心功能已完成，部分功能待实现）
> **下一步工作**: 测试已完成功能、实现剩余模块、部署上线

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [项目结构](#项目结构)
4. [已完成功能](#已完成功能)
5. [待开发功能](#待开发功能)
6. [核心业务逻辑](#核心业务逻辑)
7. [数据库设计](#数据库设计)
8. [API接口文档](#api接口文档)
9. [前端组件说明](#前端组件说明)
10. [开发环境配置](#开发环境配置)
11. [已知问题](#已知问题)
12. [部署说明](#部署说明)
13. [重要文档索引](#重要文档索引)

---

## 项目概述

### 项目背景
**奶茶大作战**是一款网页端多人回合制商业模拟游戏，玩家扮演奶茶店老板，通过10回合的经营竞争，最终以累计利润排名决定胜负。

### 核心玩法
- **玩家数量**: 2-4人
- **游戏回合**: 10回合
- **起始资金**: 10,000元
- **决策模块**: 门店决策、员工管理、市场行动、产品研发、生产决策
- **胜利条件**: 10回合后累计利润最高者获胜

### 游戏流程
```
创建/加入房间 → 等待开始 →
回合1-10循环（决策阶段 → 等待其他玩家 → 查看回合总结） →
游戏结束（查看最终排名）
```

---

## 技术栈

### 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.0.0 | 前端框架 |
| TypeScript | 5.7.3 | 类型安全 |
| Vite | 7.2.2 | 构建工具 |
| Ant Design | 5.22.10 | UI组件库 |
| Zustand | 5.0.3 | 状态管理 |
| Axios | 1.8.0 | HTTP客户端 |

### 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.x | 后端语言 |
| Flask | 3.0.0 | Web框架 |
| SQLAlchemy | 2.0.0 | ORM |
| Flask-CORS | 5.0.0 | 跨域支持 |
| PyMySQL | 1.1.1 | MySQL驱动 |
| MySQL | 8.x | 数据库（Zeabur云托管） |

### 开发工具
- **代码编辑器**: VS Code
- **API测试**: 浏览器控制台 / Postman
- **版本控制**: Git（可选）
- **数据库管理**: MySQL Workbench / Zeabur控制台

---

## 项目结构

```
naicha/
├── backend/                    # 后端代码
│   ├── app/
│   │   ├── api/v1/            # API路由层（薄控制器）
│   │   │   ├── __init__.py
│   │   │   ├── game.py        # 游戏管理API
│   │   │   ├── player.py      # 玩家API
│   │   │   ├── shop.py        # 门店API
│   │   │   ├── employee.py    # 员工API
│   │   │   ├── product.py     # 产品研发API
│   │   │   ├── market.py      # 市场行动API
│   │   │   ├── production.py  # 生产决策API
│   │   │   ├── round.py       # 回合管理API
│   │   │   └── finance.py     # 财务API
│   │   │
│   │   ├── services/          # 业务逻辑层（核心）
│   │   │   ├── calculation_engine.py      # 计算引擎（口碑、客流分配、折扣）
│   │   │   ├── production_service.py      # 生产决策服务
│   │   │   ├── round_service.py           # 回合推进服务
│   │   │   ├── finance_service.py         # 财务服务
│   │   │   ├── shop_service.py            # 门店服务
│   │   │   ├── employee_service.py        # 员工服务
│   │   │   ├── product_service.py         # 产品研发服务
│   │   │   └── market_service.py          # 市场行动服务
│   │   │
│   │   ├── models/            # 数据模型层（ORM）
│   │   │   ├── game.py        # Games, CustomerFlow
│   │   │   ├── player.py      # Players, Shops, Employees
│   │   │   ├── product.py     # ProductRecipes, PlayerProducts, RoundProductions, MaterialInventories
│   │   │   └── finance.py     # FinanceRecords, ResearchLogs, MarketActions
│   │   │
│   │   ├── core/              # 核心配置
│   │   │   ├── config.py      # 环境配置、游戏常量
│   │   │   └── database.py    # SQLAlchemy设置
│   │   │
│   │   ├── utils/
│   │   │   └── game_constants.py  # 游戏规则常量类
│   │   │
│   │   └── main.py            # Flask应用入口
│   │
│   ├── scripts/               # 数据库脚本
│   │   ├── setup_database.py # 初始化数据库（建表+种子数据）
│   │   ├── add_turn_order.py # 添加turn_order字段
│   │   ├── add_game_name.py  # 添加game_name字段
│   │   └── clear_all_games.py# 清空游戏数据（测试用）
│   │
│   ├── requirements.txt       # Python依赖
│   └── run.py                 # 启动脚本
│
├── frontend/                  # 前端代码
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   ├── Lobby.tsx      # 大厅（创建/加入房间）
│   │   │   ├── Room.tsx       # 房间（等待开始）
│   │   │   └── Game.tsx       # 游戏主界面
│   │   │
│   │   ├── components/game/   # 游戏组件
│   │   │   ├── GameHeader.tsx         # 游戏头部
│   │   │   ├── PlayerList.tsx         # 玩家列表
│   │   │   ├── DecisionPanel.tsx      # 决策面板容器
│   │   │   ├── ShopDecision.tsx       # 门店决策 ✅
│   │   │   ├── EmployeeManagement.tsx # 员工管理 ✅
│   │   │   ├── MarketAction.tsx       # 市场行动 ✅
│   │   │   ├── ProductResearch.tsx    # 产品研发 ✅
│   │   │   ├── ProductionPlan.tsx     # 生产决策 🚧
│   │   │   ├── RoundSummary.tsx       # 回合总结 🚧
│   │   │   ├── DiceRoller.tsx         # 骰子动画组件 ✅
│   │   │   └── GameEnd.tsx            # 游戏结束 🚧
│   │   │
│   │   ├── stores/            # Zustand状态管理
│   │   │   ├── gameStore.ts       # 游戏全局状态
│   │   │   ├── gameRoundStore.ts  # 回合状态
│   │   │   └── decisionStore.ts   # 决策状态
│   │   │
│   │   ├── api/               # API客户端
│   │   │   ├── client.ts      # Axios配置
│   │   │   ├── game.ts        # 游戏API
│   │   │   ├── player.ts      # 玩家API
│   │   │   ├── shop.ts        # 门店API
│   │   │   ├── employee.ts    # 员工API ✅
│   │   │   ├── product.ts     # 产品API ✅
│   │   │   ├── market.ts      # 市场API ✅
│   │   │   ├── production.ts  # 生产API
│   │   │   ├── round.ts       # 回合API
│   │   │   └── finance.ts     # 财务API
│   │   │
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript类型定义
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── CLAUDE.md                  # Claude Code指导文档（核心）
├── PROJECT_HANDOVER.md        # 本文档
├── 客户反馈-需确认细节.md     # 客户需求确认文档
├── technical_design_document.md   # 技术设计文档（800+行）
├── game_rules.md              # 游戏规则文档
├── user_jiagou.md             # 用户提供的架构文档
└── user_rules.md              # 用户提供的规则文档
```

**图例**:
- ✅ = 已完成
- 🚧 = 待开发/待完善
- ⚠️ = 存在已知问题

---

## 已完成功能

### ✅ 核心框架与基础设施

#### 后端
- [x] Flask应用框架搭建
- [x] SQLAlchemy ORM配置
- [x] MySQL数据库连接（Zeabur云托管）
- [x] CORS跨域配置
- [x] 12张数据表设计与创建
- [x] 数据库初始化脚本（含7种产品配方种子数据）
- [x] 三层架构实现（API层、Service层、Model层）

#### 前端
- [x] React + TypeScript + Vite项目搭建
- [x] Ant Design UI框架集成
- [x] Zustand状态管理
- [x] Axios HTTP客户端配置
- [x] 路由系统（Lobby → Room → Game）
- [x] 响应式布局

### ✅ 游戏房间系统

#### 功能
- [x] 创建游戏房间（生成6位房间码）
- [x] 加入游戏房间
- [x] 等待房间（显示已加入玩家）
- [x] 玩家准备/取消准备
- [x] 房主开始游戏
- [x] 自动分配turn_order（玩家行动顺序）

#### API接口
- `POST /api/v1/games/create` - 创建房间
- `POST /api/v1/players/join/{room_code}` - 加入房间
- `GET /api/v1/games/{room_code}` - 获取房间信息
- `POST /api/v1/games/{room_code}/start` - 开始游戏
- `PATCH /api/v1/players/{player_id}/ready` - 玩家准备状态

### ✅ 门店决策系统

#### 功能
- [x] 开设门店（3个商圈选择，固定租金）
- [x] 升级装修（3个等级：简陋/普通/精致）
- [x] 装修等级决定最大员工容量（2人/3人/4人）
- [x] 装修费用：400元/800元/1600元
- [x] 前端UI完整实现

#### 关键文件
- `backend/app/services/shop_service.py` - 门店业务逻辑
- `backend/app/api/v1/shop.py` - 门店API
- `frontend/src/components/game/ShopDecision.tsx` - 门店UI

#### 数据表
- `shops` - 门店信息（location, rent, decoration_level, max_employees）

### ✅ 员工管理系统

#### 功能
- [x] 招聘员工（线下抽卡，线上输入姓名/工资/生产力）
- [x] 解雇员工（标记为inactive）
- [x] 显示总生产力、总工资统计
- [x] 员工容量限制（根据装修等级）
- [x] 前端UI完整实现

#### 关键文件
- `backend/app/services/employee_service.py` - 员工业务逻辑
- `backend/app/api/v1/employee.py` - 员工API
- `frontend/src/components/game/EmployeeManagement.tsx` - 员工UI

#### 数据表
- `employees` - 员工信息（name, salary, productivity, hired_round, is_active）

### ✅ 产品研发系统（方案A）

#### 功能
- [x] 显示7种产品配方（奶茶、椰奶、柠檬茶、果汁、珍珠奶茶、水果奶昔、水果茶）
- [x] 研发流程：选择配方 → 支付600元 → 线下掷骰子 → 输入结果 → 判断成功/失败
- [x] 难度系统：
  - 难度1（配方1-4）：需≥2成功（83%成功率）
  - 难度2（配方5-6）：需≥3成功（67%成功率）
  - 难度3（配方7）：需≥4成功（50%成功率）
- [x] 研发成功 → 解锁配方，可进入生产
- [x] 研发失败 → 不解锁，600元已扣除
- [x] 前端UI完整实现（含骰子动画提示）

#### 关键文件
- `backend/app/services/product_service.py` - 产品研发逻辑
- `backend/app/api/v1/product.py` - 产品API
- `frontend/src/components/game/ProductResearch.tsx` - 研发UI
- `frontend/src/components/game/DiceRoller.tsx` - 骰子动画组件

#### 数据表
- `product_recipes` - 7种产品配方（固定）
- `player_products` - 玩家已解锁产品
- `research_logs` - 研发历史记录

### ✅ 市场行动系统

#### 功能

##### 📣 广告投放（已修改为非累计模式）
- [x] 选择产品 → 支付800元 → 线下掷骰子 → 输入结果（1-6）
- [x] **广告分不累计**：每回合重新设置（替换，而非累加）
- [x] 前端UI完整实现（含骰子输入界面）

##### 📊 市场调研
- [x] 支付500元 → 查看**下回合**客流数据
- [x] 显示高消费客户 + 低消费客户数量
- [x] 前端UI完整实现

#### 关键文件
- `backend/app/services/market_service.py` - 市场行动逻辑
- `backend/app/api/v1/market.py` - 市场API
- `frontend/src/components/game/MarketAction.tsx` - 市场行动UI

#### 数据表
- `market_actions` - 市场行动记录（ad/research）

### ✅ 核心计算引擎

#### 已实现算法

##### 1. 口碑分计算器 (ReputationCalculator)
```python
口碑分 = 广告分 + (圈粉率 × 累计销售杯数)
```
- 圈粉率固定（5% / 20% / 30%），**无下降机制**
- 累计销售数从`player_products.total_sold`获取
- 文件：`backend/app/services/calculation_engine.py`

##### 2. 客流分配器 (CustomerFlowAllocator)
**核心算法**：高端客户优先口碑，低端客户优先价格

**高消费客户分配**：
1. 按口碑分降序排序
2. 口碑相同，按价格升序排序
3. 依次分配生产容量

**低消费客户分配**（仅分配给口碑>0的产品）：
1. 过滤口碑分>0的产品
2. 按价格升序排序
3. 价格相同，按口碑降序排序
4. 依次分配剩余生产容量

##### 3. 批量折扣计算器 (DiscountCalculator)
- 每50单位材料：-10%价格（最多5档 = -50%）
- 基础价格：茶6元、奶4元、果5元、料2元
- 文件：`backend/app/services/calculation_engine.py`

### ✅ 定价规则系统

#### 功能
- [x] 价格范围：10-40元（必须是5的倍数）
- [x] **3回合价格锁定**：任意连续3回合内不可修改
  - 示例：第X回合修改价格 → 第X+1、X+2回合锁定 → 第X+3回合可再次修改
- [x] 后端验证逻辑已实现

#### 关键文件
- `backend/app/services/production_service.py:275` - `_validate_price_lock()`函数

#### 数据表
- `player_products.last_price_change_round` - 记录上次修改价格的回合

### ✅ 客流生成系统

#### 功能
- [x] **固定10回合客流脚本**（非随机）
- [x] 每回合生成高消费客户 + 低消费客户
- [x] 客流数据提前生成，可通过市场调研查看下回合数据

#### 客流脚本（GameConstants.CUSTOMER_FLOW_SCRIPT）
```python
{
    1:  {"high": 40,  "low": 300},
    2:  {"high": 90,  "low": 280},
    3:  {"high": 140, "low": 360},
    4:  {"high": 40,  "low": 410},
    5:  {"high": 90,  "low": 360},
    6:  {"high": 140, "low": 510},
    7:  {"high": 140, "low": 360},
    8:  {"high": 90,  "low": 510},
    9:  {"high": 140, "low": 510},
    10: {"high": 190, "low": 610}
}
```

#### 关键文件
- `backend/app/utils/game_constants.py:CUSTOMER_FLOW_SCRIPT`
- `backend/app/services/round_service.py:generate_customer_flow()`

#### 数据表
- `customer_flows` - 每回合客流记录（game_id, round_number, high_tier_customers, low_tier_customers）

---

## 待开发功能

### 🚧 生产决策系统（高优先级）

#### 待实现功能
- [ ] 显示已解锁的产品列表
- [ ] 为每个产品分配生产力（从员工总生产力中分配）
- [ ] 设置产品定价（10-40元，5的倍数）
- [ ] 验证定价锁定规则（3回合）
- [ ] 自动计算所需材料（根据配方×生产数量）
- [ ] 材料采购界面（显示批量折扣）
- [ ] 提交生产计划（锁定本回合决策）

#### 关键逻辑
```
生产数量 = 分配的生产力
所需材料 = 配方成分 × 生产数量
材料费用 = 基础价格 × 数量 × 折扣系数
```

#### 需要修改的文件
- `frontend/src/components/game/ProductionPlan.tsx` - 前端UI（当前是占位符）
- `backend/app/services/production_service.py` - 已有部分逻辑，需补充材料采购

#### 相关数据表
- `round_productions` - 回合生产计划
- `material_inventories` - 材料库存（**注意：需实现回合结束时清零**）

#### 参考接口
- `POST /api/v1/production/submit` - 提交生产计划（已存在）

### 🚧 回合推进系统（高优先级）

#### 待实现功能
- [ ] 检查所有玩家是否完成决策
- [ ] 执行客流分配算法（调用CustomerFlowAllocator）
- [ ] 计算销售数量、销售收入
- [ ] 更新player_products.total_sold
- [ ] 扣除员工工资、门店租金
- [ ] **清空未使用的材料库存**（方案A：直接清零）
- [ ] 生成财务报表（FinanceRecords）
- [ ] 推进到下一回合（round_number + 1）
- [ ] 判断游戏是否结束（10回合后）

#### 关键逻辑点
```
回合结算流程：
1. 所有玩家决策完成 → 触发回合结算
2. 生成客流数据（从固定脚本）
3. 执行客流分配算法
4. 计算收入/支出
5. **清空材料库存（未使用的直接清零，不退款）**
6. 更新玩家现金
7. 生成财务记录
8. 推进回合数
9. 重置玩家决策状态
```

#### 需要修改的文件
- `backend/app/services/round_service.py:advance_round()` - 需补充材料清零逻辑
- `frontend/src/components/game/RoundSummary.tsx` - 回合总结UI（当前是占位符）

#### 相关数据表
- `material_inventories` - **每回合结束时DELETE掉当前回合的所有记录**
- `finance_records` - 财务报表
- `round_productions` - 生产结果（sold_quantity, revenue）

### 🚧 游戏结束与排名系统（中优先级）

#### 待实现功能
- [ ] 检测第10回合结束
- [ ] 计算所有玩家的累计利润
- [ ] 生成最终排名（按累计利润降序）
- [ ] 显示游戏结束界面
- [ ] 展示获胜者 + 完整排行榜
- [ ] 返回大厅按钮

#### 需要修改的文件
- `frontend/src/components/game/GameEnd.tsx` - 游戏结束UI（当前是占位符）
- `backend/app/services/finance_service.py:get_profit_summary()` - 已存在，需补充排名逻辑

#### 相关接口
- `GET /api/v1/finance/game/{game_id}/profit-summary` - 获取利润总结（已存在）

### 🚧 前端决策流程管理（中优先级）

#### 待完善功能
- [ ] 决策步骤流程控制（shop → employees → market → research → production）
- [ ] 每个步骤完成后自动进入下一步
- [ ] "提交决策"按钮（锁定所有决策，等待其他玩家）
- [ ] 等待界面（显示其他玩家决策状态）
- [ ] 回合总结自动弹出
- [ ] 状态同步优化（避免频繁轮询）

#### 需要修改的文件
- `frontend/src/pages/Game.tsx` - 主游戏流程控制
- `frontend/src/components/game/DecisionPanel.tsx` - 决策面板流程
- `frontend/src/stores/decisionStore.ts` - 决策状态管理

### 🚧 财务报表系统（低优先级）

#### 待实现功能
- [ ] 回合财务详情查询
- [ ] 收入/支出明细展示
- [ ] 历史回合对比
- [ ] 图表可视化（可选）

#### 需要修改的文件
- 新增组件：`frontend/src/components/game/FinanceReport.tsx`

#### 相关接口
- `GET /api/v1/finance/player/{player_id}/records` - 已存在

---

## 核心业务逻辑

### 游戏常量（GameConstants）

所有游戏规则定义在 `backend/app/utils/game_constants.py`：

```python
class GameConstants:
    # 游戏基础参数
    MIN_PLAYERS = 2
    MAX_PLAYERS = 4
    TOTAL_ROUNDS = 10
    INITIAL_CASH = 10000.0

    # 装修成本与员工容量
    DECORATION_COSTS = {1: 400, 2: 800, 3: 1600}
    MAX_EMPLOYEES = {1: 2, 2: 3, 3: 4}

    # 材料基础价格（每单位）
    MATERIAL_BASE_PRICES = {
        "tea": 6.0,        # 茶叶
        "milk": 4.0,       # 牛奶
        "fruit": 5.0,      # 水果
        "ingredient": 2.0  # 配料
    }

    # 定价规则
    MIN_PRICE = 10.0
    MAX_PRICE = 40.0
    PRICE_STEP = 5.0
    PRICE_LOCK_ROUNDS = 3  # 连续3回合不可修改

    # 市场行动成本
    MARKET_RESEARCH_COST = 500      # 市场调研
    ADVERTISEMENT_COST = 800         # 广告投放
    PRODUCT_RESEARCH_COST = 600      # 产品研发

    # 7种产品配方
    PRODUCT_RECIPES = [
        {
            "id": 1, "name": "奶茶",
            "recipe": {"tea": 1, "milk": 2},
            "base_fan_rate": 0.05,  # 5%
            "difficulty": 1
        },
        {
            "id": 2, "name": "椰奶",
            "recipe": {"milk": 2, "ingredient": 1},
            "base_fan_rate": 0.05,
            "difficulty": 1
        },
        {
            "id": 3, "name": "柠檬茶",
            "recipe": {"tea": 1, "fruit": 1},
            "base_fan_rate": 0.05,
            "difficulty": 1
        },
        {
            "id": 4, "name": "果汁",
            "recipe": {"fruit": 3},
            "base_fan_rate": 0.05,
            "difficulty": 1
        },
        {
            "id": 5, "name": "珍珠奶茶",
            "recipe": {"tea": 1, "milk": 2, "ingredient": 1},
            "base_fan_rate": 0.20,  # 20%
            "difficulty": 2
        },
        {
            "id": 6, "name": "水果奶昔",
            "recipe": {"milk": 2, "fruit": 2},
            "base_fan_rate": 0.20,
            "difficulty": 2
        },
        {
            "id": 7, "name": "水果茶",
            "recipe": {"tea": 1, "fruit": 2, "ingredient": 1},
            "base_fan_rate": 0.30,  # 30%
            "difficulty": 3
        }
    ]

    # 固定10回合客流脚本
    CUSTOMER_FLOW_SCRIPT = {
        1:  {"high": 40,  "low": 300},
        2:  {"high": 90,  "low": 280},
        3:  {"high": 140, "low": 360},
        4:  {"high": 40,  "low": 410},
        5:  {"high": 90,  "low": 360},
        6:  {"high": 140, "low": 510},
        7:  {"high": 140, "low": 360},
        8:  {"high": 90,  "low": 510},
        9:  {"high": 140, "low": 510},
        10: {"high": 190, "low": 610}
    }
```

### 重要业务规则

#### 1. 圈粉率机制
- **固定值**：每种产品的圈粉率由配方决定（5%/20%/30%）
- **无下降机制**：圈粉率不会随回合数或销售数变化
- **作用**：参与口碑分计算，影响客流分配

#### 2. 广告分机制（已修改）
- **不累计**：每回合的广告分独立计算，不叠加
- **设置方式**：线下掷骰子（1-6），线上输入结果
- **作用原理**：`广告分`直接替换`current_ad_score`，而非累加
- **影响范围**：仅影响当前回合的口碑分计算

#### 3. 定价锁定规则
- **规则**：任意连续3回合内价格不可修改
- **实现**：记录`last_price_change_round`，验证`round_number - last_price_change_round >= 3`
- **首次定价**：第一次设置价格不受限制

#### 4. 材料过期机制（方案A）
- **规则**：每回合结束后，未使用的材料直接清零
- **实现位置**：`round_service.py:advance_round()`中删除`material_inventories`记录
- **不退款**：材料费用已支付，不退还现金

#### 5. 客流分配优先级
**高消费客户**：
1. 口碑分高的产品优先
2. 口碑相同，价格低的优先

**低消费客户**：
1. 只分配给口碑分>0的产品
2. 价格低的优先
3. 价格相同，口碑高的优先

---

## 数据库设计

### 数据库连接信息
- **托管平台**: Zeabur云服务
- **数据库类型**: MySQL 8.x
- **连接配置**: `backend/app/core/config.py:DATABASE_URL`
- **初始化脚本**: `backend/scripts/setup_database.py`

### 数据表结构（12张表）

#### 1. games - 游戏房间
```sql
id              INT PRIMARY KEY
room_code       VARCHAR(6) UNIQUE    -- 房间码
name            VARCHAR(100)         -- 游戏名称
max_players     INT DEFAULT 4
current_round   INT DEFAULT 1
status          ENUM('waiting', 'in_progress', 'finished')
created_at      TIMESTAMP
```

#### 2. players - 玩家
```sql
id              INT PRIMARY KEY
game_id         INT FK -> games.id
name            VARCHAR(50)          -- 玩家昵称
cash            DECIMAL(10,2) DEFAULT 10000.00
is_ready        BOOLEAN DEFAULT FALSE
turn_order      INT                  -- 行动顺序（1-4）
status          ENUM('active', 'bankrupt')
```

#### 3. shops - 门店
```sql
id                  INT PRIMARY KEY
player_id           INT FK -> players.id
location            VARCHAR(50)      -- 商圈名称
rent                DECIMAL(6,2)     -- 每回合租金
decoration_level    INT DEFAULT 0    -- 0-3
max_employees       INT              -- 最大员工数
created_round       INT
```

#### 4. employees - 员工
```sql
id              INT PRIMARY KEY
shop_id         INT FK -> shops.id
name            VARCHAR(50)
salary          DECIMAL(6,2)
productivity    INT                  -- 生产力值
hired_round     INT
is_active       BOOLEAN DEFAULT TRUE
```

#### 5. product_recipes - 产品配方（固定7种）
```sql
id              INT PRIMARY KEY
name            VARCHAR(50) UNIQUE
difficulty      INT                  -- 1-3
base_fan_rate   DECIMAL(5,2)        -- 圈粉率（0.05/0.20/0.30）
cost_per_unit   DECIMAL(6,2)        -- 单位成本
recipe_json     JSON                -- {"tea": 1, "milk": 2}
is_active       BOOLEAN DEFAULT TRUE
```

#### 6. player_products - 玩家已解锁产品
```sql
id                      INT PRIMARY KEY
player_id               INT FK -> players.id
recipe_id               INT FK -> product_recipes.id
is_unlocked             BOOLEAN DEFAULT FALSE
unlocked_round          INT
total_sold              INT DEFAULT 0        -- 累计销售数
current_price           DECIMAL(6,2)
current_ad_score        INT DEFAULT 0        -- 当前广告分（每回合重置）
last_price_change_round INT DEFAULT 0        -- 上次修改价格的回合
```

#### 7. round_productions - 回合生产计划
```sql
id                      INT PRIMARY KEY
player_id               INT FK -> players.id
round_number            INT
product_id              INT                  -- player_products.id
allocated_productivity  INT                  -- 分配的生产力
price                   DECIMAL(6,2)         -- 定价
produced_quantity       INT                  -- 生产数量
sold_quantity           INT                  -- 实际销售数
sold_to_high_tier       INT                  -- 高消费客户购买数
sold_to_low_tier        INT                  -- 低消费客户购买数
revenue                 DECIMAL(10,2)        -- 销售收入
```

#### 8. material_inventories - 材料库存
```sql
id              INT PRIMARY KEY
player_id       INT FK -> players.id
round_number    INT                  -- 购买回合
material_type   VARCHAR(20)          -- tea/milk/fruit/ingredient
quantity        INT
unit_price      DECIMAL(6,2)         -- 实际购买价格（含折扣）
total_cost      DECIMAL(10,2)
```
**重要**：每回合结束时，删除本回合的所有记录（材料过期清零）

#### 9. finance_records - 财务记录
```sql
id              INT PRIMARY KEY
player_id       INT FK -> players.id
round_number    INT
revenue         DECIMAL(10,2)        -- 收入
expenses        DECIMAL(10,2)        -- 支出
profit          DECIMAL(10,2)        -- 利润
cash_balance    DECIMAL(10,2)        -- 剩余现金
created_at      TIMESTAMP
```

#### 10. customer_flows - 客流数据
```sql
id                      INT PRIMARY KEY
game_id                 INT FK -> games.id
round_number            INT
high_tier_customers     INT              -- 高消费客户数
low_tier_customers      INT              -- 低消费客户数
```

#### 11. research_logs - 研发日志
```sql
id              INT PRIMARY KEY
player_id       INT FK -> players.id
recipe_id       INT FK -> product_recipes.id
round_number    INT
dice_result     INT                  -- 掷骰结果（1-6）
success         BOOLEAN              -- 是否成功
cost            DECIMAL(6,2)         -- 研发费用（600）
created_at      TIMESTAMP
```

#### 12. market_actions - 市场行动日志
```sql
id              INT PRIMARY KEY
player_id       INT FK -> players.id
round_number    INT
action_type     ENUM('ad', 'research')  -- 广告/调研
cost            DECIMAL(6,2)
result_value    INT                     -- 广告分（仅ad类型有值）
created_at      TIMESTAMP
```

---

## API接口文档

### 基础信息
- **Base URL**: `http://localhost:8000/api/v1`
- **响应格式**: JSON
- **成功响应**: `{"success": true, "data": {...}}`
- **错误响应**: `{"success": false, "error": "错误信息"}`

### 游戏管理 (/games)

#### POST /games/create
创建游戏房间
```json
// Request
{
  "game_name": "测试房间",
  "max_players": 4
}

// Response
{
  "success": true,
  "data": {
    "room_code": "ABC123",
    "game_id": 1,
    "name": "测试房间",
    "max_players": 4,
    "status": "waiting"
  }
}
```

#### POST /players/join/{room_code}
加入游戏房间
```json
// Request
{
  "player_name": "玩家1"
}

// Response
{
  "success": true,
  "data": {
    "player_id": 1,
    "game_id": 1,
    "name": "玩家1",
    "cash": 10000.0,
    "turn_order": 1
  }
}
```

#### GET /games/{room_code}
获取房间信息
```json
// Response
{
  "success": true,
  "data": {
    "id": 1,
    "room_code": "ABC123",
    "name": "测试房间",
    "current_round": 1,
    "status": "in_progress",
    "players": [
      {
        "id": 1,
        "name": "玩家1",
        "cash": 10000.0,
        "is_ready": true,
        "turn_order": 1
      }
    ]
  }
}
```

#### POST /games/{room_code}/start
开始游戏（仅房主）
```json
// Response
{
  "success": true,
  "message": "Game started successfully"
}
```

### 门店管理 (/shops)

#### POST /shops/open
开设门店
```json
// Request
{
  "player_id": 1,
  "location": "商业街",
  "decoration_level": 1
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "player_id": 1,
    "location": "商业街",
    "rent": 1200.0,
    "decoration_level": 1,
    "max_employees": 2
  }
}
```

#### POST /shops/{player_id}/upgrade
升级装修
```json
// Request
{
  "target_level": 2
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "decoration_level": 2,
    "max_employees": 3,
    "upgrade_cost": 800.0,
    "remaining_cash": 9200.0
  }
}
```

### 员工管理 (/employees)

#### POST /employees/hire
招聘员工
```json
// Request
{
  "player_id": 1,
  "name": "张三",
  "salary": 1000,
  "productivity": 5,
  "round_number": 1
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "shop_id": 1,
    "name": "张三",
    "salary": 1000.0,
    "productivity": 5,
    "hired_round": 1,
    "is_active": true
  }
}
```

#### POST /employees/{employee_id}/fire
解雇员工
```json
// Response
{
  "success": true,
  "message": "Employee 张三 has been fired",
  "employee_id": 1
}
```

#### GET /employees/player/{player_id}
获取员工列表
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "salary": 1000.0,
      "productivity": 5,
      "is_active": true
    }
  ]
}
```

#### GET /employees/player/{player_id}/productivity
获取总生产力
```json
// Response
{
  "success": true,
  "data": {
    "player_id": 1,
    "total_productivity": 15
  }
}
```

### 产品研发 (/products)

#### POST /products/research
产品研发（线下掷骰子）
```json
// Request
{
  "player_id": 1,
  "recipe_id": 7,
  "round_number": 1,
  "dice_result": 5
}

// Response
{
  "success": true,
  "data": {
    "dice_result": 5,
    "required_roll": 4,
    "research_success": true,
    "product_unlocked": true,
    "product_name": "水果茶",
    "difficulty": 3,
    "cost": 600,
    "remaining_cash": 9400.0
  }
}
```

#### GET /products/recipes?player_id={player_id}
获取所有配方（含解锁状态）
```json
// Response
{
  "success": true,
  "data": [
    {
      "recipe_id": 1,
      "name": "奶茶",
      "recipe_json": {"tea": 1, "milk": 2},
      "base_fan_rate": 0.05,
      "is_unlocked": true,
      "research_cost": 600
    }
  ]
}
```

#### GET /products/player/{player_id}/unlocked
获取已解锁产品
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recipe_id": 1,
      "recipe_name": "奶茶",
      "current_ad_score": 3,
      "total_sold": 50,
      "current_price": 15.0
    }
  ]
}
```

### 市场行动 (/market)

#### POST /market/advertisement
投放广告（线下掷骰子）
```json
// Request
{
  "player_id": 1,
  "product_id": 1,
  "round_number": 1,
  "dice_result": 5
}

// Response
{
  "success": true,
  "data": {
    "dice_result": 5,
    "current_ad_score": 5,
    "product_name": "奶茶",
    "cost": 800,
    "remaining_cash": 9200.0
  }
}
```

#### POST /market/research
市场调研（查看下回合客流）
```json
// Request
{
  "player_id": 1,
  "round_number": 1
}

// Response
{
  "success": true,
  "data": {
    "cost": 500,
    "next_round": 2,
    "customer_flow": {
      "high_tier_customers": 90,
      "low_tier_customers": 280
    },
    "remaining_cash": 9500.0
  }
}
```

### 生产决策 (/production)

#### POST /production/submit
提交生产计划
```json
// Request
{
  "player_id": 1,
  "round_number": 1,
  "productions": [
    {
      "product_id": 1,
      "productivity": 10,
      "price": 15.0
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "player_id": 1,
    "round_number": 1,
    "total_material_cost": 240.0,
    "remaining_cash": 9760.0
  }
}
```

### 回合管理 (/rounds)

#### POST /rounds/{game_id}/advance
推进回合（所有玩家决策完成后）
```json
// Response
{
  "success": true,
  "data": {
    "game_id": 1,
    "new_round": 2,
    "message": "Round advanced successfully"
  }
}
```

#### GET /rounds/{game_id}/{round_number}/summary
获取回合总结
```json
// Response
{
  "success": true,
  "data": {
    "round_number": 1,
    "player_summaries": [
      {
        "player_id": 1,
        "player_name": "玩家1",
        "revenue": 750.0,
        "expenses": 1640.0,
        "profit": -890.0,
        "cash_balance": 9110.0
      }
    ]
  }
}
```

### 财务 (/finance)

#### GET /finance/player/{player_id}/records?round_number={round}
获取财务记录
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "round_number": 1,
      "revenue": 750.0,
      "expenses": 1640.0,
      "profit": -890.0,
      "cash_balance": 9110.0
    }
  ]
}
```

#### GET /finance/game/{game_id}/profit-summary
获取利润总结（最终排名）
```json
// Response
{
  "success": true,
  "data": [
    {
      "player_id": 1,
      "player_name": "玩家1",
      "total_profit": 5000.0,
      "final_cash": 15000.0,
      "rank": 1
    }
  ]
}
```

---

## 前端组件说明

### 页面组件 (pages/)

#### Lobby.tsx - 游戏大厅
**功能**：
- 创建房间（输入房间名、最大玩家数）
- 加入房间（输入房间码、玩家昵称）
- 路由跳转至Room页面

**状态管理**：
- 使用`gameStore`存储游戏信息
- 调用`gameApi.createGame()` / `playerApi.joinGame()`

#### Room.tsx - 等待房间
**功能**：
- 显示房间码
- 显示已加入玩家列表
- 玩家准备/取消准备
- 房主开始游戏按钮
- 轮询获取房间状态（检测游戏是否开始）

**状态管理**：
- 使用`gameStore`存储玩家列表
- 调用`playerApi.toggleReady()` / `gameApi.startGame()`

#### Game.tsx - 游戏主界面 ✅
**功能**：
- 游戏头部（回合数、玩家信息）
- 玩家列表（显示所有玩家状态）
- 决策面板切换（5个决策步骤）
- 回合总结显示
- 游戏结束界面

**状态管理**：
- 使用`gameStore` + `gameRoundStore` + `decisionStore`
- 轮询游戏状态（每5秒检查回合变化）

**已实现**：
- ✅ 基础布局和路由
- ✅ 决策面板切换逻辑
- ✅ 状态轮询机制

**待完善**：
- 🚧 决策完成判定
- 🚧 自动进入回合总结
- 🚧 游戏结束检测

### 游戏组件 (components/game/)

#### ShopDecision.tsx - 门店决策 ✅
**功能**：
- 开设门店（3个商圈选择）
- 升级装修（3个等级）
- 显示当前门店信息（租金、装修等级、员工容量）

**状态**：完全实现

#### EmployeeManagement.tsx - 员工管理 ✅
**功能**：
- 招聘员工表单（姓名、工资、生产力手动输入）
- 员工列表（表格展示）
- 解雇员工（确认对话框）
- 总生产力/总工资统计

**状态**：完全实现

#### ProductResearch.tsx - 产品研发 ✅
**功能**：
- 显示7种配方卡片（含难度、成功率、圈粉率）
- 研发流程：选择配方 → 骰子动画提示 → 输入结果 → 提交验证
- 成功/失败弹窗提示
- 已解锁配方标记

**状态**：完全实现

#### MarketAction.tsx - 市场行动 ✅
**功能**：
- 广告投放：选择产品 → 骰子输入 → 设置广告分（替换，非累加）
- 市场调研：查看下回合客流数据（高/低消费客户）

**状态**：完全实现

#### ProductionPlan.tsx - 生产决策 🚧
**当前状态**：占位符组件，只显示TODO列表

**需要实现**：
- [ ] 显示已解锁产品列表
- [ ] 生产力分配输入（总生产力 = 所有员工生产力之和）
- [ ] 定价输入（10-40元，5的倍数）
- [ ] 定价锁定提示（如果在3回合内）
- [ ] 自动计算所需材料
- [ ] 材料采购界面（显示批量折扣）
- [ ] 提交生产计划按钮

**参考设计**：
```typescript
// 生产计划数据结构
interface ProductionItem {
  product_id: number;
  product_name: string;
  productivity: number;      // 分配的生产力
  price: number;             // 定价
  materials_needed: {        // 所需材料
    tea?: number;
    milk?: number;
    fruit?: number;
    ingredient?: number;
  };
  material_cost: number;     // 材料总成本
}
```

#### RoundSummary.tsx - 回合总结 🚧
**当前状态**：占位符组件

**需要实现**：
- [ ] 显示本回合客流数据
- [ ] 显示所有玩家生产情况（产品、定价、销量）
- [ ] 显示销售结果（卖给高/低消费客户数量）
- [ ] 显示财务报表（收入、支出、利润）
- [ ] 显示剩余现金
- [ ] "进入下一回合"按钮

#### GameEnd.tsx - 游戏结束 🚧
**当前状态**：占位符组件

**需要实现**：
- [ ] 显示最终排名（1-4名）
- [ ] 显示每个玩家的累计利润
- [ ] 显示获胜者动画
- [ ] "返回大厅"按钮

#### DiceRoller.tsx - 骰子动画 ✅
**功能**：
- 显示骰子图标动画
- 用于提示玩家线下掷骰子
- 纯展示组件，无交互

**状态**：完全实现

---

## 开发环境配置

### 前置要求
- **Node.js**: v18+ (推荐v20)
- **Python**: 3.9+
- **MySQL**: 8.0+ (已由Zeabur托管)
- **操作系统**: Windows/macOS/Linux

### 后端启动步骤

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境（首次）
python -m venv venv

# 3. 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 初始化数据库（仅首次运行，或重置数据库时）
python scripts/setup_database.py

# 6. 启动开发服务器
python run.py

# 服务器运行在: http://localhost:8000
# API文档: http://localhost:8000/docs (如果配置了Swagger)
```

**注意事项**：
- 数据库配置在`app/core/config.py`中
- 如需修改端口，编辑`run.py`文件
- 日志会在控制台输出（避免使用emoji，Windows终端不支持）

### 前端启动步骤

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（首次）
npm install

# 3. 启动开发服务器
npm run dev

# 服务器运行在: http://localhost:5173
# Vite会自动打开浏览器
```

**注意事项**：
- 确保后端已启动（前端依赖后端API）
- 如遇CORS错误，检查后端`app/main.py`中的CORS配置
- 热更新已启用，修改代码后自动刷新

### 数据库管理

#### 初始化数据库
```bash
cd backend
python scripts/setup_database.py
```
**作用**：
- 创建所有12张表
- 插入7种产品配方种子数据
- 幂等操作（可重复运行）

#### 清空游戏数据（测试用）
```bash
cd backend
python scripts/clear_all_games.py
```
**作用**：
- 删除所有游戏、玩家、门店、员工等数据
- **保留**产品配方表（product_recipes）
- 用于快速重置测试环境

#### 数据库迁移脚本
- `scripts/add_turn_order.py` - 添加turn_order字段（已应用）
- `scripts/add_game_name.py` - 添加game_name字段（已应用）

### 常见问题排查

#### 1. CORS错误
**症状**：前端控制台显示`Access to XMLHttpRequest blocked by CORS policy`

**解决方案**：
1. 检查后端`app/main.py`中的CORS配置：
```python
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # 开发环境允许所有来源
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False
    }
})
```
2. 重启后端服务器（配置修改后需要重启）

#### 2. 数据库连接失败
**症状**：后端启动报错`Can't connect to MySQL server`

**解决方案**：
1. 检查`app/core/config.py`中的DATABASE_URL
2. 确认Zeabur数据库服务正常运行
3. 检查网络连接

#### 3. 前端打包失败
**症状**：`npm run build`报错

**解决方案**：
1. 删除`node_modules`和`package-lock.json`
2. 重新安装：`npm install`
3. 检查TypeScript类型错误

#### 4. Vite端口被占用
**症状**：启动时提示`Port 5173 is already in use`

**解决方案**：
```bash
# Windows:
taskkill /F /PID <进程ID>

# macOS/Linux:
lsof -ti:5173 | xargs kill -9
```

---

## 已知问题

### ⚠️ 高优先级问题

#### 1. 生产决策系统未实现
**影响**：玩家无法完成生产决策，游戏无法正常推进

**待修复**：
- 实现ProductionPlan.tsx组件
- 材料采购逻辑
- 生产计划提交验证

#### 2. 回合推进逻辑不完整
**影响**：回合无法正常结算和推进

**待修复**：
- 补充客流分配算法调用
- 材料库存清零逻辑
- 财务报表生成

#### 3. 材料过期机制未实现
**影响**：材料库存不会清零，影响游戏平衡

**待修复**：
- 在`round_service.py:advance_round()`中添加：
```python
# 清空本回合的材料库存（方案A：直接清零）
MaterialInventory.query.filter_by(
    game_id=game_id,
    round_number=round_number
).delete()
```

### ⚠️ 中优先级问题

#### 4. 决策流程控制不完善
**现象**：玩家可以跳过决策步骤，或重复提交

**待优化**：
- 添加决策步骤完成标记
- 强制按顺序完成决策
- "提交决策"按钮锁定所有步骤

#### 5. 等待界面缺失
**现象**：玩家完成决策后不知道其他玩家进度

**待优化**：
- 显示其他玩家决策状态（已完成/未完成）
- 等待动画
- 进度条

#### 6. 回合总结未实现
**现象**：回合结束后无法查看详细结果

**待实现**：
- RoundSummary.tsx组件
- 财务报表展示
- 销售结果对比

### ⚠️ 低优先级问题

#### 7. UI样式细节
**现象**：部分组件样式不统一

**待优化**：
- 统一卡片样式
- 优化移动端适配
- 添加加载动画

#### 8. 错误提示不友好
**现象**：部分错误信息为英文或技术术语

**待优化**：
- 统一错误提示文案
- 添加错误码映射
- 中文化所有提示

---

## 部署说明

### 前端部署

#### 构建生产版本
```bash
cd frontend
npm run build
```
输出目录：`frontend/dist/`

#### 部署到静态托管（推荐）
- **Vercel**: 直接连接GitHub仓库自动部署
- **Netlify**: 拖拽`dist`文件夹上传
- **阿里云OSS**: 配置静态网站托管

#### 环境变量配置
修改`frontend/src/api/client.ts`中的API base URL：
```typescript
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

创建`.env.production`文件：
```
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

### 后端部署

#### 方案1: Zeabur部署（推荐）
1. 连接GitHub仓库
2. 选择`backend`目录
3. 配置环境变量：
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `CORS_ORIGINS`
4. 自动部署

#### 方案2: 服务器部署
```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置生产环境
export FLASK_ENV=production
export DATABASE_URL=mysql+pymysql://user:pass@host:port/db

# 3. 使用Gunicorn运行
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

#### 方案3: Docker部署
创建`Dockerfile`：
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
```

### 数据库配置

#### 生产环境数据库
- 已使用Zeabur托管MySQL
- 确保`DATABASE_URL`在环境变量中配置
- 不要将数据库密码提交到代码仓库

#### 初始化生产数据库
```bash
python scripts/setup_database.py
```

### CORS配置（重要）

修改`backend/app/main.py`：
```python
# 生产环境CORS配置
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-frontend-domain.com"],  # 只允许你的前端域名
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False
    }
})
```

---

## 重要文档索引

### 核心文档（必读）

| 文档名 | 路径 | 说明 |
|--------|------|------|
| **CLAUDE.md** | `/CLAUDE.md` | Claude Code指导文档，包含项目概述、技术栈、核心规则、API模式等 |
| **PROJECT_HANDOVER.md** | `/PROJECT_HANDOVER.md` | 本文档，项目交接文档 |
| **客户反馈-需确认细节.md** | `/客户反馈-需确认细节.md` | 客户需求确认，包含4个核心问题及答案 |

### 设计文档

| 文档名 | 路径 | 说明 |
|--------|------|------|
| **technical_design_document.md** | `/technical_design_document.md` | 技术设计文档（800+行），详细的系统架构和业务流程 |
| **game_rules.md** | `/game_rules.md` | 游戏规则文档，完整的玩法说明 |
| **user_jiagou.md** | `/user_jiagou.md` | 用户提供的系统架构文档（中文） |
| **user_rules.md** | `/user_rules.md` | 用户提供的游戏规则文档（中文） |

### 代码文档

| 文档名 | 路径 | 说明 |
|--------|------|------|
| **backend/README.md** | `/backend/README.md` | 后端说明文档（如果存在） |
| **frontend/README.md** | `/frontend/README.md` | 前端说明文档（如果存在） |

---

## 下一步工作计划

### 第一阶段：完成核心功能（预计2-3天）

#### Day 1: 生产决策系统
- [ ] 实现ProductionPlan.tsx前端UI
- [ ] 生产力分配逻辑
- [ ] 定价输入与验证
- [ ] 材料计算与显示
- [ ] 材料采购功能
- [ ] 批量折扣计算展示
- [ ] 提交生产计划API调用

#### Day 2: 回合推进系统
- [ ] 完善round_service.py中的回合结算逻辑
- [ ] 调用客流分配算法（CustomerFlowAllocator）
- [ ] 计算销售结果
- [ ] 生成财务报表
- [ ] **实现材料库存清零**（重要）
- [ ] 推进回合数
- [ ] 重置玩家决策状态

#### Day 3: 回合总结与游戏结束
- [ ] 实现RoundSummary.tsx组件
- [ ] 显示回合详细结果
- [ ] 实现GameEnd.tsx组件
- [ ] 最终排名展示
- [ ] 游戏流程完整测试

### 第二阶段：优化与测试（预计1-2天）

#### Day 4: 流程优化
- [ ] 决策步骤流程控制
- [ ] 等待界面实现
- [ ] 状态同步优化
- [ ] 错误提示优化

#### Day 5: 测试与修复
- [ ] 完整游戏流程测试（2-4人）
- [ ] 边界条件测试（破产、负数等）
- [ ] UI适配测试（不同屏幕尺寸）
- [ ] Bug修复

### 第三阶段：部署上线（预计1天）

#### Day 6: 部署
- [ ] 前端构建与部署
- [ ] 后端部署与配置
- [ ] 数据库初始化
- [ ] 域名与HTTPS配置
- [ ] 线上测试
- [ ] 性能优化

---

## 联系方式与资源

### 技术支持
- **Claude Code文档**: https://docs.claude.com/en/docs/claude-code
- **React文档**: https://react.dev/
- **Flask文档**: https://flask.palletsprojects.com/
- **Ant Design文档**: https://ant.design/

### 项目资源
- **GitHub仓库**: （如果有，请填写）
- **Zeabur控制台**: https://zeabur.com/
- **数据库连接**: 见`backend/app/core/config.py`

### 问题反馈
- **已知问题列表**: 见本文档"已知问题"章节
- **功能需求**: 见本文档"待开发功能"章节

---

## 附录

### A. 数据库初始化SQL（参考）

7种产品配方种子数据：
```python
PRODUCT_RECIPES = [
    {"id": 1, "name": "奶茶", "difficulty": 1, "base_fan_rate": 0.05, "recipe": {"tea": 1, "milk": 2}},
    {"id": 2, "name": "椰奶", "difficulty": 1, "base_fan_rate": 0.05, "recipe": {"milk": 2, "ingredient": 1}},
    {"id": 3, "name": "柠檬茶", "difficulty": 1, "base_fan_rate": 0.05, "recipe": {"tea": 1, "fruit": 1}},
    {"id": 4, "name": "果汁", "difficulty": 1, "base_fan_rate": 0.05, "recipe": {"fruit": 3}},
    {"id": 5, "name": "珍珠奶茶", "difficulty": 2, "base_fan_rate": 0.20, "recipe": {"tea": 1, "milk": 2, "ingredient": 1}},
    {"id": 6, "name": "水果奶昔", "difficulty": 2, "base_fan_rate": 0.20, "recipe": {"milk": 2, "fruit": 2}},
    {"id": 7, "name": "水果茶", "difficulty": 3, "base_fan_rate": 0.30, "recipe": {"tea": 1, "fruit": 2, "ingredient": 1}}
]
```

### B. 环境变量模板

`.env.example`:
```
# 数据库配置
DATABASE_URL=mysql+pymysql://user:password@host:port/database

# Flask配置
SECRET_KEY=your-secret-key-here
DEBUG=True

# CORS配置
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### C. Git忽略配置

`.gitignore`:
```
# Python
__pycache__/
*.py[cod]
venv/
.env

# Node
node_modules/
dist/
.vite/

# IDE
.vscode/
.idea/

# Database
*.db
*.sqlite
```

---

**文档结束**

如有疑问，请参考：
1. `CLAUDE.md` - 项目概述与核心规则
2. `technical_design_document.md` - 详细技术设计
3. 本文档 - 开发进度与交接信息
