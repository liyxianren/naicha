# 奶茶大作战 - 技术方案设计文档

**项目名称**：奶茶大作战线上系统
**文档版本**：v1.0
**创建日期**：2025-11-16
**技术架构**：React + Python FastAPI + PostgreSQL
**项目类型**：Web端多人联机商业模拟游戏

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [系统架构设计](#2-系统架构设计)
3. [数据库设计](#3-数据库设计)
4. [核心模块设计](#4-核心模块设计)
5. [核心算法设计](#5-核心算法设计)
6. [API接口设计](#6-api接口设计)
7. [前端页面设计](#7-前端页面设计)
8. [实时通信方案](#8-实时通信方案)
9. [安全与性能](#9-安全与性能)
10. [部署方案](#10-部署方案)
11. [开发计划](#11-开发计划)

---

## 1. 项目概述

### 1.1 项目背景

奶茶大作战是一款商业模拟桌游，玩家扮演奶茶店经营者，通过产品研发、定价、营销等决策进行商业竞争。游戏结合线下实体卡牌和线上数字系统：
- **线下部分**：实体卡牌（员工卡、店铺卡）、骰子（研发、广告）
- **线上部分**：数据计算、报表生成、游戏状态管理

### 1.2 核心功能

**三大核心模块**：
1. **生产端**（玩家操作界面）：店铺运营、人力管理、产品研发、生产决策
2. **计算端**（后台计算引擎）：口碑分计算、客流分配算法、财务核算
3. **财务端**（报表系统）：自动生成收支报表、利润统计

**游戏参数**：
- 游戏回合数：10回合
- 支持玩家：2-4人
- 产品配方：7种（奶茶、椰奶、柠檬茶、果汁、珍珠奶茶、水果奶昔、水果茶）
- 原材料：4种（茶叶、牛奶、水果、配料）
- 装修等级：3种（简装、精装、豪华装）

### 1.3 技术选型理由

| 技术栈 | 选择 | 理由 |
|--------|------|------|
| **前端框架** | React 18 + TypeScript | 组件化开发，类型安全，生态丰富，适合复杂交互界面 |
| **UI组件库** | Ant Design 5.x | 企业级UI组件，中文文档完善，适合管理类界面 |
| **状态管理** | Zustand | 轻量级，学习成本低，性能优秀 |
| **后端框架** | FastAPI (Python 3.10+) | 高性能异步框架，自动生成API文档，类型提示支持 |
| **ORM** | SQLAlchemy 2.0 | 成熟的Python ORM，支持复杂查询 |
| **数据库** | PostgreSQL 14+ | 开源关系型数据库，支持JSON类型，适合复杂业务逻辑 |
| **实时通信** | Socket.IO | 双向实时通信，自动重连，适合多人游戏 |
| **缓存** | Redis | 存储游戏房间状态，提高性能 |
| **容器化** | Docker + Docker Compose | 简化部署，环境一致性 |

---

## 2. 系统架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层 (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  React App                                                       │
│  ├─ 游戏大厅 (房间创建/加入)                                      │
│  ├─ 生产端界面 (玩家操作)                                         │
│  ├─ 财务报表界面 (数据展示)                                       │
│  └─ 实时状态同步 (Socket.IO Client)                              │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTP/HTTPS + WebSocket
             │
┌────────────▼────────────────────────────────────────────────────┐
│                         应用层 (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│  API Gateway                                                     │
│  ├─ RESTful API (游戏CRUD、玩家操作)                             │
│  ├─ WebSocket Handler (实时通信)                                 │
│  └─ 认证中间件 (JWT Token)                                       │
├─────────────────────────────────────────────────────────────────┤
│  业务逻辑层                                                       │
│  ├─ GameService (游戏流程控制)                                   │
│  ├─ ProductionService (生产决策处理)                             │
│  ├─ CalculationEngine (核心计算引擎)                             │
│  │   ├─ ReputationCalculator (口碑分计算)                        │
│  │   ├─ CustomerFlowAllocator (客流分配算法)                     │
│  │   └─ DiscountCalculator (批量折扣计算)                        │
│  └─ FinanceService (财务报表生成)                                │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                         数据层                                    │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (持久化存储)          Redis (缓存层)                 │
│  ├─ 游戏数据                       ├─ 房间状态缓存                │
│  ├─ 玩家数据                       ├─ 会话管理                    │
│  ├─ 回合数据                       └─ 实时数据                    │
│  └─ 财务记录                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术架构分层

**前端架构** (React)
```
src/
├── components/          # 可复用组件
│   ├── common/         # 通用组件（按钮、输入框等）
│   ├── game/           # 游戏专用组件
│   └── layout/         # 布局组件
├── pages/              # 页面组件
│   ├── Lobby/          # 游戏大厅
│   ├── GameRoom/       # 游戏房间
│   ├── Production/     # 生产端界面
│   └── Finance/        # 财务报表
├── store/              # 状态管理 (Zustand)
│   ├── gameStore.ts    # 游戏状态
│   ├── playerStore.ts  # 玩家状态
│   └── uiStore.ts      # UI状态
├── services/           # API服务
│   ├── api.ts          # HTTP请求封装
│   └── socket.ts       # WebSocket封装
├── utils/              # 工具函数
│   ├── calculator.ts   # 前端计算辅助
│   └── validators.ts   # 数据验证
└── types/              # TypeScript类型定义
```

**后端架构** (FastAPI)
```
backend/
├── app/
│   ├── api/            # API路由
│   │   ├── v1/
│   │   │   ├── game.py      # 游戏相关API
│   │   │   ├── player.py    # 玩家相关API
│   │   │   ├── production.py# 生产决策API
│   │   │   └── finance.py   # 财务报表API
│   │   └── websocket.py     # WebSocket路由
│   ├── core/           # 核心配置
│   │   ├── config.py        # 配置管理
│   │   └── security.py      # 安全相关
│   ├── models/         # 数据模型 (SQLAlchemy)
│   │   ├── game.py
│   │   ├── player.py
│   │   ├── shop.py
│   │   └── finance.py
│   ├── schemas/        # Pydantic数据验证
│   │   ├── game.py
│   │   └── player.py
│   ├── services/       # 业务逻辑
│   │   ├── game_service.py
│   │   ├── calculation_engine.py  # 核心计算引擎
│   │   └── finance_service.py
│   └── utils/          # 工具函数
│       ├── redis_client.py
│       └── game_constants.py
└── tests/              # 单元测试
```

---

## 3. 数据库设计

### 3.1 ER图概述

```
Game (游戏房间)
  ├──< Player (玩家)
  │     ├──< Shop (店铺)
  │     │     ├──< Employee (员工)
  │     │     ├──< ProductInventory (产品库存)
  │     │     └──< MaterialInventory (原材料库存)
  │     └──< FinanceRecord (财务记录)
  │
  └──< Round (回合)
        └──< CustomerFlow (客流量)
```

### 3.2 数据表设计

#### 3.2.1 Game (游戏房间表)

```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(6) UNIQUE NOT NULL,        -- 房间号 (6位随机码)
    status VARCHAR(20) NOT NULL,                 -- 游戏状态: waiting, playing, finished
    current_round INT DEFAULT 1,                 -- 当前回合 (1-10)
    max_players INT DEFAULT 4,                   -- 最大玩家数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    settings JSONB                               -- 游戏设置 (JSON格式)
);

CREATE INDEX idx_room_code ON games(room_code);
CREATE INDEX idx_status ON games(status);
```

#### 3.2.2 Player (玩家表)

```sql
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,               -- 玩家昵称
    player_number INT NOT NULL,                  -- 玩家编号 (1-4)
    cash DECIMAL(10, 2) DEFAULT 10000.00,        -- 现金余额
    total_profit DECIMAL(10, 2) DEFAULT 0.00,    -- 累计利润
    is_ready BOOLEAN DEFAULT FALSE,              -- 是否准备
    is_active BOOLEAN DEFAULT TRUE,              -- 是否在线
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_number)
);

CREATE INDEX idx_game_player ON players(game_id, player_number);
```

#### 3.2.3 Shop (店铺表)

```sql
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    location VARCHAR(50),                        -- 店铺位置 (线下抽卡获得)
    rent DECIMAL(8, 2),                          -- 每回合租金
    decoration_level INT DEFAULT 0,              -- 装修等级: 0=无, 1=简装, 2=精装, 3=豪华
    max_employees INT DEFAULT 0,                 -- 最大员工数 (2/3/4)
    created_round INT NOT NULL,                  -- 开店回合
    UNIQUE(player_id)                            -- 一个玩家一个店铺
);
```

#### 3.2.4 ProductRecipe (产品配方表) - 配置表

```sql
CREATE TABLE product_recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,            -- 产品名称
    difficulty INT NOT NULL,                     -- 研发难度 (3/4/5)
    base_fan_rate DECIMAL(5, 2) NOT NULL,        -- 初始圈粉率 (5%/20%/30%)
    cost_per_unit DECIMAL(6, 2) NOT NULL,        -- 单杯成本
    recipe_json JSONB NOT NULL,                  -- 配方 {"tea": 1, "milk": 1}
    is_active BOOLEAN DEFAULT TRUE
);

-- 初始化7种产品
INSERT INTO product_recipes (name, difficulty, base_fan_rate, cost_per_unit, recipe_json) VALUES
('奶茶', 3, 5.00, 10.00, '{"tea": 1, "milk": 1}'),
('椰奶', 3, 5.00, 9.00, '{"milk": 1, "fruit": 1}'),
('柠檬茶', 3, 5.00, 11.00, '{"tea": 1, "fruit": 1}'),
('果汁', 3, 5.00, 10.00, '{"fruit": 2}'),
('珍珠奶茶', 4, 20.00, 16.00, '{"milk": 2, "tea": 1, "ingredient": 1}'),
('水果奶昔', 4, 20.00, 15.00, '{"milk": 1, "fruit": 1, "ingredient": 3}'),
('水果茶', 5, 30.00, 23.00, '{"fruit": 3, "tea": 1, "ingredient": 1}');
```

#### 3.2.5 PlayerProduct (玩家产品表)

```sql
CREATE TABLE player_products (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    recipe_id INT REFERENCES product_recipes(id),
    is_unlocked BOOLEAN DEFAULT FALSE,           -- 是否已解锁
    unlocked_round INT,                          -- 解锁回合
    total_sold INT DEFAULT 0,                    -- 累计销售杯数
    current_price DECIMAL(6, 2),                 -- 当前定价
    current_ad_score INT DEFAULT 0,              -- 当前广告分
    UNIQUE(player_id, recipe_id)
);

CREATE INDEX idx_player_product ON player_products(player_id, recipe_id);
```

#### 3.2.6 Employee (员工表)

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                   -- 员工姓名 (线下抽卡)
    salary DECIMAL(8, 2) NOT NULL,               -- 工资
    productivity INT NOT NULL,                   -- 生产力
    hired_round INT NOT NULL,                    -- 招募回合
    is_active BOOLEAN DEFAULT TRUE               -- 是否在职
);
```

#### 3.2.7 RoundProduction (回合生产计划表)

```sql
CREATE TABLE round_productions (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    product_id INT REFERENCES player_products(id),
    allocated_productivity INT DEFAULT 0,        -- 分配的生产力
    price DECIMAL(6, 2),                         -- 定价
    produced_quantity INT DEFAULT 0,             -- 生产数量
    sold_quantity INT DEFAULT 0,                 -- 实际销售数量
    sold_to_high_tier INT DEFAULT 0,             -- 卖给高购买力客户数量
    sold_to_low_tier INT DEFAULT 0,              -- 卖给低购买力客户数量
    revenue DECIMAL(10, 2) DEFAULT 0.00,         -- 销售收入
    UNIQUE(player_id, round_number, product_id)
);

CREATE INDEX idx_round_prod ON round_productions(player_id, round_number);
```

#### 3.2.8 MaterialInventory (原材料库存表)

```sql
CREATE TABLE material_inventories (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    material_type VARCHAR(20) NOT NULL,          -- tea, milk, fruit, ingredient
    quantity INT DEFAULT 0,                      -- 库存数量
    purchase_price DECIMAL(8, 2),                -- 本回合采购单价
    UNIQUE(player_id, round_number, material_type)
);
```

#### 3.2.9 FinanceRecord (财务记录表)

```sql
CREATE TABLE finance_records (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    round_number INT NOT NULL,

    -- 收入
    total_revenue DECIMAL(10, 2) DEFAULT 0.00,
    revenue_breakdown JSONB,                     -- {"奶茶": 225, "珍珠奶茶": 500}

    -- 支出
    rent_expense DECIMAL(8, 2) DEFAULT 0.00,
    salary_expense DECIMAL(8, 2) DEFAULT 0.00,
    material_expense DECIMAL(8, 2) DEFAULT 0.00,
    decoration_expense DECIMAL(8, 2) DEFAULT 0.00,
    research_expense DECIMAL(8, 2) DEFAULT 0.00,
    ad_expense DECIMAL(8, 2) DEFAULT 0.00,
    research_cost DECIMAL(8, 2) DEFAULT 0.00,
    total_expense DECIMAL(10, 2) DEFAULT 0.00,

    -- 利润
    round_profit DECIMAL(10, 2) DEFAULT 0.00,
    cumulative_profit DECIMAL(10, 2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, round_number)
);

CREATE INDEX idx_finance ON finance_records(player_id, round_number);
```

#### 3.2.10 CustomerFlow (客流量表)

```sql
CREATE TABLE customer_flows (
    id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    high_tier_customers INT NOT NULL,            -- 高购买力客户数
    low_tier_customers INT NOT NULL,             -- 低购买力客户数
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, round_number)
);
```

#### 3.2.11 ResearchLog (研发记录表)

```sql
CREATE TABLE research_logs (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    recipe_id INT REFERENCES product_recipes(id),
    round_number INT NOT NULL,
    dice_result INT NOT NULL,                    -- 骰子点数
    success BOOLEAN NOT NULL,                    -- 是否成功
    cost DECIMAL(8, 2) DEFAULT 600.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.12 MarketAction (市场行动表)

```sql
CREATE TABLE market_actions (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    action_type VARCHAR(20) NOT NULL,            -- ad (广告), research (调研)
    cost DECIMAL(8, 2) NOT NULL,
    result_value INT,                            -- 广告分 或 null
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 数据库索引优化

```sql
-- 复合索引优化查询性能
CREATE INDEX idx_player_round_prod ON round_productions(player_id, round_number);
CREATE INDEX idx_game_round ON customer_flows(game_id, round_number);
CREATE INDEX idx_player_finance ON finance_records(player_id, round_number);
```

---

## 4. 核心模块设计

### 4.1 生产端（玩家操作界面）

#### 4.1.1 功能模块1：开店决策

**界面元素**：
- 店铺位置输入框（文本，来自线下抽卡）
- 租金输入框（数字，来自线下抽卡）
- 装修等级选择（单选：简装/精装/豪华装）
- 确认开店按钮

**业务逻辑**：
```python
# 伪代码
def open_shop(player_id, location, rent, decoration_level):
    decoration_costs = {1: 400, 2: 800, 3: 1600}
    max_employees = {1: 2, 2: 3, 3: 4}

    cost = decoration_costs[decoration_level]

    # 检查余额
    if player.cash < cost:
        raise InsufficientFundsError("现金不足")

    # 创建店铺
    shop = Shop.create(
        player_id=player_id,
        location=location,
        rent=rent,
        decoration_level=decoration_level,
        max_employees=max_employees[decoration_level],
        created_round=current_round
    )

    # 扣除装修费
    player.cash -= cost

    # 记录财务
    finance_record.decoration_expense += cost

    return shop
```

**前端组件** (React + TypeScript):
```typescript
interface ShopSetupProps {
  playerId: number;
  onComplete: () => void;
}

const ShopSetup: React.FC<ShopSetupProps> = ({ playerId, onComplete }) => {
  const [location, setLocation] = useState('');
  const [rent, setRent] = useState(0);
  const [decorationLevel, setDecorationLevel] = useState(1);

  const decorationOptions = [
    { level: 1, name: '简装', cost: 400, employees: 2 },
    { level: 2, name: '精装', cost: 800, employees: 3 },
    { level: 3, name: '豪华装', cost: 1600, employees: 4 },
  ];

  const handleSubmit = async () => {
    try {
      await api.post('/api/v1/shop/create', {
        player_id: playerId,
        location,
        rent,
        decoration_level: decorationLevel
      });
      onComplete();
    } catch (error) {
      message.error('开店失败：' + error.message);
    }
  };

  return (
    <Card title="店铺开设">
      <Form layout="vertical">
        <Form.Item label="店铺位置（线下抽卡）">
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="例如：商业街A区"
          />
        </Form.Item>

        <Form.Item label="每回合租金">
          <InputNumber
            value={rent}
            onChange={setRent}
            min={0}
            addonAfter="元"
          />
        </Form.Item>

        <Form.Item label="装修等级">
          <Radio.Group value={decorationLevel} onChange={e => setDecorationLevel(e.target.value)}>
            {decorationOptions.map(opt => (
              <Radio.Button key={opt.level} value={opt.level}>
                {opt.name} ({opt.cost}元, 容纳{opt.employees}人)
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Button type="primary" onClick={handleSubmit}>
          确认开店
        </Button>
      </Form>
    </Card>
  );
};
```

#### 4.1.2 功能模块2：人力管理

**界面元素**：
- 当前员工列表（表格显示：姓名、工资、生产力）
- 招募员工表单（姓名、工资输入）
- 生产力揭示按钮（模拟线下翻卡）

**业务逻辑**：
```python
def hire_employee(shop_id, name, salary, round_number):
    shop = Shop.get(shop_id)

    # 检查员工数量限制
    current_count = Employee.count(shop_id=shop_id, is_active=True)
    if current_count >= shop.max_employees:
        raise MaxEmployeesReachedError(f"已达到员工上限 {shop.max_employees}")

    # 生成生产力（模拟线下抽卡，前端输入）
    productivity = random.randint(3, 8)  # 实际由前端输入

    employee = Employee.create(
        shop_id=shop_id,
        name=name,
        salary=salary,
        productivity=productivity,
        hired_round=round_number
    )

    return employee

def get_total_productivity(player_id):
    employees = Employee.query(player_id=player_id, is_active=True)
    return sum(e.productivity for e in employees)
```

#### 4.1.3 功能模块3：产品研发

**界面元素**：
- 7种产品配方卡片（显示配方、难度、圈粉率）
- 研发按钮（需要600元）
- 骰子点数输入框
- 研发结果提示

**业务逻辑**：
```python
def research_product(player_id, recipe_id, dice_result, round_number):
    recipe = ProductRecipe.get(recipe_id)
    cost = 600

    # 检查余额
    player = Player.get(player_id)
    if player.cash < cost:
        raise InsufficientFundsError("现金不足")

    # 判断研发成功
    success = dice_result >= recipe.difficulty

    # 扣除研发费
    player.cash -= cost

    # 记录研发日志
    ResearchLog.create(
        player_id=player_id,
        recipe_id=recipe_id,
        round_number=round_number,
        dice_result=dice_result,
        success=success,
        cost=cost
    )

    if success:
        # 解锁产品
        PlayerProduct.update_or_create(
            player_id=player_id,
            recipe_id=recipe_id,
            defaults={
                'is_unlocked': True,
                'unlocked_round': round_number
            }
        )

    return success
```

**前端组件**：
```typescript
interface ProductResearchProps {
  playerId: number;
  availableRecipes: Recipe[];
}

const ProductResearch: React.FC<ProductResearchProps> = ({ playerId, availableRecipes }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [diceResult, setDiceResult] = useState<number>(1);
  const [isResearching, setIsResearching] = useState(false);

  const handleResearch = async () => {
    if (!selectedRecipe) return;

    setIsResearching(true);
    try {
      const result = await api.post('/api/v1/research', {
        player_id: playerId,
        recipe_id: selectedRecipe,
        dice_result: diceResult
      });

      if (result.success) {
        message.success('研发成功！产品已解锁');
      } else {
        message.error('研发失败，请下次再试');
      }
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <Card title="产品研发">
      <Row gutter={[16, 16]}>
        {availableRecipes.map(recipe => (
          <Col span={8} key={recipe.id}>
            <Card
              hoverable
              onClick={() => setSelectedRecipe(recipe.id)}
              style={{
                border: selectedRecipe === recipe.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
              }}
            >
              <Statistic title={recipe.name} value={recipe.fan_rate + '%'} suffix="圈粉率" />
              <p>配方：{recipe.recipe_text}</p>
              <p>难度：{recipe.difficulty}</p>
              <p>成本：{recipe.cost_per_unit}元/杯</p>
              {recipe.is_unlocked && <Tag color="green">已解锁</Tag>}
            </Card>
          </Col>
        ))}
      </Row>

      {selectedRecipe && (
        <div style={{ marginTop: 20 }}>
          <Space>
            <Text>投掷骰子结果：</Text>
            <InputNumber
              min={1}
              max={6}
              value={diceResult}
              onChange={setDiceResult}
            />
            <Button
              type="primary"
              onClick={handleResearch}
              loading={isResearching}
            >
              研发（600元）
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );
};
```

#### 4.1.4 功能模块4：生产决策（核心功能）

**界面元素**：
- 可分配总生产力显示
- 已解锁产品列表
- 为每个产品分配生产力（数字输入）
- 为每个产品设定定价（10-40元，5的倍数）
- 自动计算原材料需求和成本

**业务逻辑**：
```python
def submit_production_plan(player_id, round_number, productions):
    """
    productions = [
        {"recipe_id": 1, "productivity": 5, "price": 15},
        {"recipe_id": 5, "productivity": 10, "price": 25}
    ]
    """
    player = Player.get(player_id)
    total_productivity = get_total_productivity(player_id)

    # 验证总生产力
    allocated = sum(p['productivity'] for p in productions)
    if allocated > total_productivity:
        raise ValidationError(f"生产力超限：{allocated} > {total_productivity}")

    # 验证定价
    for prod in productions:
        price = prod['price']
        if price < 10 or price > 40 or price % 5 != 0:
            raise ValidationError(f"定价必须是10-40元之间的5的倍数")

    # 计算原材料需求
    material_needs = calculate_material_needs(productions)

    # 计算采购成本（含批量折扣）
    purchase_cost = calculate_purchase_cost(material_needs)

    # 检查余额
    if player.cash < purchase_cost:
        raise InsufficientFundsError("原材料采购资金不足")

    # 扣除原材料成本
    player.cash -= purchase_cost

    # 保存生产计划
    for prod in productions:
        RoundProduction.create(
            player_id=player_id,
            round_number=round_number,
            product_id=prod['recipe_id'],
            allocated_productivity=prod['productivity'],
            price=prod['price'],
            produced_quantity=prod['productivity']  # 生产力 = 生产数量
        )

    # 更新原材料库存
    update_material_inventory(player_id, round_number, material_needs, purchase_cost)

    return {
        "material_needs": material_needs,
        "purchase_cost": purchase_cost,
        "remaining_cash": player.cash
    }

def calculate_material_needs(productions):
    """计算原材料总需求"""
    needs = {"tea": 0, "milk": 0, "fruit": 0, "ingredient": 0}

    for prod in productions:
        recipe = ProductRecipe.get(prod['recipe_id'])
        quantity = prod['productivity']

        # 解析配方 JSON
        recipe_dict = recipe.recipe_json  # {"tea": 1, "milk": 2}
        for material, amount_per_unit in recipe_dict.items():
            needs[material] += amount_per_unit * quantity

    return needs

def calculate_purchase_cost(material_needs):
    """计算采购成本（含批量折扣）"""
    base_prices = {
        "tea": 6.0,      # 60元/10份 = 6元/份
        "milk": 4.0,     # 40元/10份 = 4元/份
        "fruit": 5.0,    # 50元/10份 = 5元/份
        "ingredient": 2.0 # 20元/10份 = 2元/份
    }

    total_cost = 0.0

    for material, quantity in material_needs.items():
        if quantity == 0:
            continue

        base_price = base_prices[material]

        # 批量折扣：每50份-10%，最多5次（-50%）
        discount_tiers = quantity // 50
        discount_tiers = min(discount_tiers, 5)  # 最多5次折扣
        discount_rate = 1.0 - (discount_tiers * 0.1)

        unit_price = base_price * discount_rate
        total_cost += unit_price * quantity

    return total_cost
```

**前端组件**：
```typescript
interface ProductionPlanProps {
  playerId: number;
  unlockedProducts: PlayerProduct[];
  totalProductivity: number;
}

const ProductionPlan: React.FC<ProductionPlanProps> = ({
  playerId,
  unlockedProducts,
  totalProductivity
}) => {
  const [allocations, setAllocations] = useState<Record<number, {productivity: number, price: number}>>({});

  const allocatedTotal = Object.values(allocations).reduce(
    (sum, a) => sum + (a.productivity || 0),
    0
  );

  const remaining = totalProductivity - allocatedTotal;

  const handleSubmit = async () => {
    const productions = Object.entries(allocations)
      .filter(([_, v]) => v.productivity > 0)
      .map(([recipeId, v]) => ({
        recipe_id: parseInt(recipeId),
        productivity: v.productivity,
        price: v.price
      }));

    try {
      const result = await api.post('/api/v1/production/submit', {
        player_id: playerId,
        productions
      });

      message.success(`生产计划已提交！原材料成本：${result.purchase_cost}元`);
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Card title="生产决策">
      <Alert
        message={`可分配总生产力：${totalProductivity} | 已分配：${allocatedTotal} | 剩余：${remaining}`}
        type={remaining < 0 ? 'error' : 'info'}
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={unlockedProducts}
        pagination={false}
        columns={[
          {
            title: '产品名称',
            dataIndex: 'name',
            render: (_, record) => (
              <div>
                <strong>{record.recipe.name}</strong>
                <div>
                  <Tag color="blue">圈粉率{record.recipe.fan_rate}%</Tag>
                  <Tag>累计销售{record.total_sold}杯</Tag>
                </div>
              </div>
            )
          },
          {
            title: '分配生产力',
            width: 150,
            render: (_, record) => (
              <InputNumber
                min={0}
                max={totalProductivity}
                value={allocations[record.recipe_id]?.productivity || 0}
                onChange={val => setAllocations({
                  ...allocations,
                  [record.recipe_id]: {
                    ...allocations[record.recipe_id],
                    productivity: val || 0
                  }
                })}
                addonAfter="杯"
              />
            )
          },
          {
            title: '定价',
            width: 150,
            render: (_, record) => (
              <Select
                value={allocations[record.recipe_id]?.price || 15}
                onChange={val => setAllocations({
                  ...allocations,
                  [record.recipe_id]: {
                    ...allocations[record.recipe_id],
                    price: val
                  }
                })}
                style={{ width: '100%' }}
              >
                {[10, 15, 20, 25, 30, 35, 40].map(price => (
                  <Select.Option key={price} value={price}>
                    {price}元
                  </Select.Option>
                ))}
              </Select>
            )
          }
        ]}
      />

      <Button
        type="primary"
        size="large"
        onClick={handleSubmit}
        disabled={remaining < 0 || allocatedTotal === 0}
        style={{ marginTop: 16 }}
      >
        提交生产计划
      </Button>
    </Card>
  );
};
```

#### 4.1.5 功能模块5：市场决策

**业务逻辑**：
```python
def conduct_market_research(player_id, round_number, game_id):
    """市场调研：查看下一回合客流量"""
    cost = 500
    player = Player.get(player_id)

    if player.cash < cost:
        raise InsufficientFundsError("现金不足")

    player.cash -= cost

    # 记录市场行动
    MarketAction.create(
        player_id=player_id,
        round_number=round_number,
        action_type='research',
        cost=cost
    )

    # 返回下一回合客流量
    next_round = round_number + 1
    customer_flow = CustomerFlow.get(game_id=game_id, round_number=next_round)

    if not customer_flow:
        # 如果还未生成，先生成
        customer_flow = generate_customer_flow(game_id, next_round)

    return {
        "high_tier": customer_flow.high_tier_customers,
        "low_tier": customer_flow.low_tier_customers
    }

def place_advertisement(player_id, product_id, round_number, ad_score):
    """投放广告"""
    cost = 800
    player = Player.get(player_id)

    if player.cash < cost:
        raise InsufficientFundsError("现金不足")

    player.cash -= cost

    # 更新产品广告分
    player_product = PlayerProduct.get(player_id=player_id, id=product_id)
    player_product.current_ad_score = ad_score
    player_product.save()

    # 记录市场行动
    MarketAction.create(
        player_id=player_id,
        round_number=round_number,
        action_type='ad',
        cost=cost,
        result_value=ad_score
    )

    return ad_score
```

### 4.2 计算端（后台计算引擎）

计算端是游戏的核心，负责所有复杂的业务计算。

#### 4.2.1 口碑分计算器

```python
class ReputationCalculator:
    """口碑分计算器"""

    @staticmethod
    def calculate(player_product: PlayerProduct) -> int:
        """
        口碑分 = 广告分 + 圈粉率 × 累计销售杯数
        """
        ad_score = player_product.current_ad_score
        fan_rate = player_product.recipe.base_fan_rate / 100  # 转换为小数
        total_sold = player_product.total_sold

        reputation = ad_score + (fan_rate * total_sold)

        return int(reputation)

    @staticmethod
    def calculate_all_for_round(game_id: int, round_number: int) -> Dict:
        """计算本回合所有产品的口碑分"""
        players = Player.query(game_id=game_id)
        reputation_map = {}

        for player in players:
            productions = RoundProduction.query(
                player_id=player.id,
                round_number=round_number
            )

            for prod in productions:
                player_product = prod.product
                reputation = ReputationCalculator.calculate(player_product)

                reputation_map[prod.id] = {
                    "player_id": player.id,
                    "product_name": player_product.recipe.name,
                    "reputation": reputation,
                    "price": prod.price,
                    "productivity": prod.allocated_productivity
                }

        return reputation_map
```

#### 4.2.2 客流分配算法（核心）

这是游戏最核心的算法，决定了销售结果。

```python
class CustomerFlowAllocator:
    """客流分配算法"""

    @staticmethod
    def allocate(game_id: int, round_number: int):
        """
        客流分配主函数

        步骤：
        1. 获取本回合客流量
        2. 获取所有产品的口碑分、定价、生产力
        3. 分配高购买力客户
        4. 分配低购买力客户
        5. 更新销售数据
        """
        # 1. 获取客流量
        customer_flow = CustomerFlow.get(game_id=game_id, round_number=round_number)
        high_tier_total = customer_flow.high_tier_customers
        low_tier_total = customer_flow.low_tier_customers

        # 2. 获取所有产品数据
        products = CustomerFlowAllocator._get_all_products(game_id, round_number)

        # 3. 分配高购买力客户
        high_tier_remaining = high_tier_total
        for product in CustomerFlowAllocator._sort_for_high_tier(products):
            if high_tier_remaining <= 0:
                break

            sold = min(product['available'], high_tier_remaining)
            product['sold_high'] = sold
            product['available'] -= sold
            high_tier_remaining -= sold

        # 4. 分配低购买力客户
        low_tier_remaining = low_tier_total
        for product in CustomerFlowAllocator._sort_for_low_tier(products):
            if low_tier_remaining <= 0:
                break

            # 低购买力客户只购买口碑>0的产品
            if product['reputation'] <= 0:
                continue

            sold = min(product['available'], low_tier_remaining)
            product['sold_low'] = sold
            product['available'] -= sold
            low_tier_remaining -= sold

        # 5. 保存销售结果
        CustomerFlowAllocator._save_sales(products)

        return {
            "high_tier_served": high_tier_total - high_tier_remaining,
            "low_tier_served": low_tier_total - low_tier_remaining,
            "sales_details": products
        }

    @staticmethod
    def _get_all_products(game_id: int, round_number: int) -> List[Dict]:
        """获取所有产品数据"""
        products = []

        players = Player.query(game_id=game_id, is_active=True)
        for player in players:
            productions = RoundProduction.query(
                player_id=player.id,
                round_number=round_number
            )

            for prod in productions:
                player_product = PlayerProduct.get(id=prod.product_id)
                reputation = ReputationCalculator.calculate(player_product)

                products.append({
                    "production_id": prod.id,
                    "player_id": player.id,
                    "product_name": player_product.recipe.name,
                    "reputation": reputation,
                    "price": prod.price,
                    "available": prod.produced_quantity,  # 可售数量
                    "sold_high": 0,
                    "sold_low": 0
                })

        return products

    @staticmethod
    def _sort_for_high_tier(products: List[Dict]) -> List[Dict]:
        """
        高购买力客户排序规则：
        1. 口碑分最高
        2. 口碑相同时，价格最低
        3. 都相同时，随机或按ID排序（平分客户）
        """
        return sorted(
            products,
            key=lambda p: (-p['reputation'], p['price'], p['production_id'])
        )

    @staticmethod
    def _sort_for_low_tier(products: List[Dict]) -> List[Dict]:
        """
        低购买力客户排序规则：
        1. 价格最低（且口碑>0）
        2. 价格相同时，口碑分最高
        3. 都相同时，随机或按ID排序（平分客户）
        """
        return sorted(
            products,
            key=lambda p: (p['price'], -p['reputation'], p['production_id'])
        )

    @staticmethod
    def _save_sales(products: List[Dict]):
        """保存销售结果到数据库"""
        for product in products:
            prod = RoundProduction.get(id=product['production_id'])

            total_sold = product['sold_high'] + product['sold_low']
            revenue = total_sold * product['price']

            prod.sold_quantity = total_sold
            prod.sold_to_high_tier = product['sold_high']
            prod.sold_to_low_tier = product['sold_low']
            prod.revenue = revenue
            prod.save()

            # 更新玩家产品的累计销售数
            player_product = PlayerProduct.get(id=prod.product_id)
            player_product.total_sold += total_sold
            player_product.save()
```

**算法示例（对应需求文档中的案例）**：

```python
# 示例场景
customer_flow = {
    "high_tier": 20,
    "low_tier": 60
}

products = [
    {"name": "A", "reputation": 50, "price": 25, "available": 10},
    {"name": "B", "reputation": 40, "price": 20, "available": 5},
    {"name": "C", "reputation": 30, "price": 15, "available": 15},
    {"name": "D", "reputation": 30, "price": 10, "available": 20},
    {"name": "E", "reputation": 25, "price": 10, "available": 10},
]

# 高购买力客户购买顺序（按口碑分降序，口碑相同按价格升序）
high_tier_sorted = [A(50,25), B(40,20), D(30,10), C(30,15), E(25,10)]
# 结果：A卖10杯, B卖5杯, D卖5杯

# 低购买力客户购买顺序（按价格升序，价格相同按口碑降序）
low_tier_sorted = [D(10,30), E(10,25), C(15,30), B(20,40), A(25,50)]
# D剩余15杯, E剩余10杯, C剩余15杯
# 结果：D卖15杯, E卖10杯, C卖15杯, 剩余20人无法购买
```

#### 4.2.3 客流量生成器

```python
class CustomerFlowGenerator:
    """客流量生成器"""

    @staticmethod
    def generate(game_id: int, round_number: int) -> CustomerFlow:
        """
        生成本回合客流量

        规则：
        - 高购买力客户：10-30人
        - 低购买力客户：40-80人
        """
        import random

        high_tier = random.randint(10, 30)
        low_tier = random.randint(40, 80)

        customer_flow = CustomerFlow.create(
            game_id=game_id,
            round_number=round_number,
            high_tier_customers=high_tier,
            low_tier_customers=low_tier
        )

        return customer_flow

    @staticmethod
    def generate_all_rounds(game_id: int, total_rounds: int = 10):
        """预生成所有回合的客流量"""
        for round_num in range(1, total_rounds + 1):
            CustomerFlowGenerator.generate(game_id, round_num)
```

### 4.3 财务端（报表系统）

#### 4.3.1 财务计算服务

```python
class FinanceService:
    """财务计算服务"""

    @staticmethod
    def calculate_round_finance(player_id: int, round_number: int) -> FinanceRecord:
        """计算某回合的财务数据"""

        # 1. 计算收入
        revenue_data = FinanceService._calculate_revenue(player_id, round_number)

        # 2. 计算支出
        expense_data = FinanceService._calculate_expenses(player_id, round_number)

        # 3. 计算利润
        round_profit = revenue_data['total'] - expense_data['total']

        # 4. 计算累计利润
        previous_finance = FinanceRecord.query(
            player_id=player_id,
            round_number__lt=round_number
        ).order_by('-round_number').first()

        cumulative_profit = (previous_finance.cumulative_profit if previous_finance else 0) + round_profit

        # 5. 保存财务记录
        finance_record = FinanceRecord.create(
            player_id=player_id,
            round_number=round_number,
            total_revenue=revenue_data['total'],
            revenue_breakdown=revenue_data['breakdown'],
            rent_expense=expense_data['rent'],
            salary_expense=expense_data['salary'],
            material_expense=expense_data['material'],
            decoration_expense=expense_data['decoration'],
            research_expense=expense_data['research'],
            ad_expense=expense_data['ad'],
            research_cost=expense_data['research_cost'],
            total_expense=expense_data['total'],
            round_profit=round_profit,
            cumulative_profit=cumulative_profit
        )

        # 6. 更新玩家累计利润
        player = Player.get(player_id)
        player.total_profit = cumulative_profit
        player.save()

        return finance_record

    @staticmethod
    def _calculate_revenue(player_id: int, round_number: int) -> Dict:
        """计算收入"""
        productions = RoundProduction.query(
            player_id=player_id,
            round_number=round_number
        )

        breakdown = {}
        total = 0

        for prod in productions:
            product_name = prod.product.recipe.name
            revenue = prod.revenue

            if revenue > 0:
                breakdown[product_name] = float(revenue)
                total += revenue

        return {
            "total": total,
            "breakdown": breakdown
        }

    @staticmethod
    def _calculate_expenses(player_id: int, round_number: int) -> Dict:
        """计算支出"""
        player = Player.get(player_id)
        shop = Shop.get(player_id=player_id)

        # 租金
        rent = shop.rent if shop else 0

        # 工资
        employees = Employee.query(shop_id=shop.id, is_active=True)
        salary = sum(e.salary for e in employees)

        # 原材料
        materials = MaterialInventory.query(
            player_id=player_id,
            round_number=round_number
        )
        material_cost = sum(m.purchase_price for m in materials)

        # 装修费（仅开店回合）
        decoration = 0
        if shop and shop.created_round == round_number:
            decoration_costs = {1: 400, 2: 800, 3: 1600}
            decoration = decoration_costs.get(shop.decoration_level, 0)

        # 市场行动（广告、调研）
        market_actions = MarketAction.query(
            player_id=player_id,
            round_number=round_number
        )
        ad_cost = sum(a.cost for a in market_actions if a.action_type == 'ad')
        research_market = sum(a.cost for a in market_actions if a.action_type == 'research')

        # 研发费
        research_logs = ResearchLog.query(
            player_id=player_id,
            round_number=round_number
        )
        research_cost = sum(r.cost for r in research_logs)

        total = rent + salary + material_cost + decoration + ad_cost + research_market + research_cost

        return {
            "rent": rent,
            "salary": salary,
            "material": material_cost,
            "decoration": decoration,
            "ad": ad_cost,
            "research": research_market,
            "research_cost": research_cost,
            "total": total
        }
```

#### 4.3.2 报表生成器

```python
class FinanceReportGenerator:
    """财务报表生成器"""

    @staticmethod
    def generate_text_report(finance_record: FinanceRecord) -> str:
        """生成文本格式报表"""
        player = finance_record.player
        round_num = finance_record.round_number

        report = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          【{player.nickname}】第{round_num}回合财务报表
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────┬────────┐  ┌─────────────────┬────────┐
│  支出项目        │  金额  │  │  收入项目        │  金额  │
├─────────────────┼────────┤  ├─────────────────┼────────┤
│【固定成本】      │        │  │【营业收入】      │        │
│  租金            │ {finance_record.rent_expense:>6.0f}元│  │  总营业收入      │ {finance_record.total_revenue:>6.0f}元│
│  员工工资        │ {finance_record.salary_expense:>6.0f}元│  │                  │        │
├─────────────────┼────────┤  │  产品明细：      │        │
│【生产性成本】    │        │  │{FinanceReportGenerator._format_revenue_breakdown(finance_record.revenue_breakdown)}
│  原材料采购      │ {finance_record.material_expense:>6.0f}元│  │                  │        │
├─────────────────┼────────┤  │                  │        │
│【临时成本】      │        │  │                  │        │
│  店铺装修        │ {finance_record.decoration_expense:>6.0f}元│  │                  │        │
│  市场调研        │ {finance_record.research_expense:>6.0f}元│  │                  │        │
│  广告投放        │ {finance_record.ad_expense:>6.0f}元│  │                  │        │
│  研发费用        │ {finance_record.research_cost:>6.0f}元│  │                  │        │
├─────────────────┼────────┤  ├─────────────────┼────────┤
│ 总支出           │ {finance_record.total_expense:>6.0f}元│  │ 总收入           │ {finance_record.total_revenue:>6.0f}元│
└─────────────────┴────────┘  └─────────────────┴────────┘

┌─────────────────────────────────────────────────┐
│  本回合利润：{finance_record.round_profit:>10.0f}元                      │
│  累计利润：  {finance_record.cumulative_profit:>10.0f}元                      │
│  当前现金：  {player.cash:>10.0f}元                      │
└─────────────────────────────────────────────────┘
        """

        return report

    @staticmethod
    def _format_revenue_breakdown(breakdown: Dict) -> str:
        """格式化收入明细"""
        if not breakdown:
            return "│  （无销售）      │      0元│"

        lines = []
        for product, amount in breakdown.items():
            lines.append(f"│  {product:<12} │ {amount:>6.0f}元│")

        return "\n".join(lines)
```

---

## 5. 核心算法设计

### 5.1 客流分配算法详解

**算法复杂度分析**：
- 时间复杂度：O(n log n)，其中n是产品数量（排序）
- 空间复杂度：O(n)

**伪代码**：
```
function allocate_customer_flow(game_id, round_number):
    // 1. 获取数据
    customer_flow = get_customer_flow(game_id, round_number)
    products = get_all_products_in_round(game_id, round_number)

    // 2. 高购买力客户分配
    high_tier_queue = sort_by_high_tier_rules(products)
    high_tier_remaining = customer_flow.high_tier_customers

    for each product in high_tier_queue:
        if high_tier_remaining <= 0:
            break

        sold = min(product.available, high_tier_remaining)
        product.sold_high += sold
        product.available -= sold
        high_tier_remaining -= sold

    // 3. 低购买力客户分配
    low_tier_queue = sort_by_low_tier_rules(products)
    low_tier_remaining = customer_flow.low_tier_customers

    for each product in low_tier_queue:
        if low_tier_remaining <= 0:
            break

        if product.reputation <= 0:
            continue  // 低购买力客户不买口碑<=0的产品

        sold = min(product.available, low_tier_remaining)
        product.sold_low += sold
        product.available -= sold
        low_tier_remaining -= sold

    // 4. 保存结果
    save_sales_results(products)

    return sales_summary

function sort_by_high_tier_rules(products):
    // 排序规则：口碑分降序，口碑相同时价格升序
    return sort(products, key = (-reputation, price, id))

function sort_by_low_tier_rules(products):
    // 排序规则：价格升序，价格相同时口碑分降序
    return sort(products, key = (price, -reputation, id))
```

### 5.2 批量折扣计算

```python
def calculate_discount_price(quantity: int, base_unit_price: float) -> float:
    """
    计算批量折扣后的单价

    规则：每50份-10%，最多-50%（5次折扣）
    """
    discount_tiers = min(quantity // 50, 5)
    discount_rate = 1.0 - (discount_tiers * 0.1)

    return base_unit_price * discount_rate

# 示例
# 购买0-49份：100%原价
# 购买50-99份：90%原价
# 购买100-149份：80%原价
# 购买150-199份：70%原价
# 购买200-249份：60%原价
# 购买250+份：50%原价
```

---

## 6. API接口设计

### 6.1 RESTful API 列表

**基础URL**: `http://localhost:8000/api/v1`

#### 6.1.1 游戏管理

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/games/create` | 创建游戏房间 | `{max_players: 4}` | `{room_code, game_id}` |
| POST | `/games/{room_code}/join` | 加入游戏 | `{nickname}` | `{player_id, player_number}` |
| GET | `/games/{room_code}` | 获取游戏信息 | - | `{game, players, current_round}` |
| POST | `/games/{room_code}/start` | 开始游戏 | - | `{status: "started"}` |
| GET | `/games/{game_id}/players` | 获取玩家列表 | - | `[{player_id, nickname, cash, profit}]` |

#### 6.1.2 店铺管理

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/shops/create` | 开设店铺 | `{player_id, location, rent, decoration_level}` | `{shop_id}` |
| GET | `/shops/{player_id}` | 获取店铺信息 | - | `{shop, employees}` |
| PATCH | `/shops/{shop_id}/upgrade` | 升级装修 | `{new_level}` | `{success}` |

#### 6.1.3 员工管理

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/employees/hire` | 招募员工 | `{shop_id, name, salary, productivity, round}` | `{employee_id}` |
| GET | `/employees/shop/{shop_id}` | 获取员工列表 | - | `[{id, name, salary, productivity}]` |
| DELETE | `/employees/{id}` | 解雇员工 | - | `{success}` |

#### 6.1.4 产品研发

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/recipes` | 获取所有配方 | - | `[{id, name, difficulty, fan_rate}]` |
| POST | `/research` | 研发产品 | `{player_id, recipe_id, dice_result, round}` | `{success, unlocked}` |
| GET | `/products/player/{player_id}` | 获取玩家已解锁产品 | - | `[{recipe, is_unlocked, total_sold}]` |

#### 6.1.5 生产决策

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/production/submit` | 提交生产计划 | `{player_id, round, productions: [{recipe_id, productivity, price}]}` | `{material_cost, remaining_cash}` |
| GET | `/production/{player_id}/{round}` | 获取生产计划 | - | `[{product, productivity, price}]` |

#### 6.1.6 市场决策

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/market/research` | 市场调研 | `{player_id, game_id, round}` | `{next_round_flow: {high_tier, low_tier}}` |
| POST | `/market/advertise` | 投放广告 | `{player_id, product_id, round, ad_score}` | `{new_ad_score}` |

#### 6.1.7 回合控制

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/round/next` | 进入下一回合 | `{game_id}` | `{new_round, customer_flow}` |
| POST | `/round/calculate` | 执行回合计算 | `{game_id, round}` | `{sales_results}` |
| GET | `/round/{game_id}/{round}/results` | 获取回合结果 | - | `{sales, finances}` |

#### 6.1.8 财务报表

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/finance/{player_id}/{round}` | 获取财务报表 | - | `{revenue, expenses, profit}` |
| GET | `/finance/{player_id}/history` | 获取历史财务 | - | `[{round, revenue, profit}]` |
| GET | `/finance/{player_id}/summary` | 获取财务摘要 | - | `{total_profit, cash, ranking}` |

### 6.2 WebSocket事件

**连接URL**: `ws://localhost:8000/ws/{game_id}/{player_id}`

#### 6.2.1 客户端发送事件

| 事件名 | 数据 | 描述 |
|--------|------|------|
| `player_ready` | `{player_id}` | 玩家准备 |
| `production_submitted` | `{player_id, round}` | 生产计划已提交 |
| `action_completed` | `{player_id, action_type}` | 某个操作完成 |

#### 6.2.2 服务器推送事件

| 事件名 | 数据 | 描述 |
|--------|------|------|
| `player_joined` | `{player_id, nickname}` | 新玩家加入 |
| `game_started` | `{start_time}` | 游戏开始 |
| `round_started` | `{round_number, customer_flow}` | 新回合开始 |
| `round_calculated` | `{sales_results}` | 回合计算完成 |
| `player_status_update` | `{player_id, status}` | 玩家状态更新 |
| `game_finished` | `{rankings}` | 游戏结束 |

### 6.3 API请求/响应示例

#### 示例1：创建游戏房间

**请求**：
```http
POST /api/v1/games/create
Content-Type: application/json

{
  "max_players": 4
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "game_id": 123,
    "room_code": "ABC123",
    "status": "waiting",
    "max_players": 4,
    "created_at": "2025-11-16T10:00:00Z"
  }
}
```

#### 示例2：提交生产计划

**请求**：
```http
POST /api/v1/production/submit
Content-Type: application/json

{
  "player_id": 456,
  "round": 3,
  "productions": [
    {
      "recipe_id": 1,
      "productivity": 5,
      "price": 15
    },
    {
      "recipe_id": 5,
      "productivity": 10,
      "price": 25
    }
  ]
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "material_needs": {
      "tea": 15,
      "milk": 25,
      "fruit": 0,
      "ingredient": 10
    },
    "material_cost": 246.0,
    "remaining_cash": 8754.0,
    "productions_saved": 2
  }
}
```

---

## 7. 前端页面设计

### 7.1 页面结构

```
┌─────────────────────────────────────────────────────┐
│  1. 首页 (/)                                         │
│     - 创建房间 / 加入房间                             │
├─────────────────────────────────────────────────────┤
│  2. 游戏大厅 (/lobby/:roomCode)                      │
│     - 显示房间号                                      │
│     - 显示已加入玩家列表                              │
│     - 准备/开始按钮                                   │
├─────────────────────────────────────────────────────┤
│  3. 游戏主界面 (/game/:gameId)                       │
│     ┌─────────────────────────────────────────────┐ │
│     │  顶部导航                                    │ │
│     │  - 当前回合                                  │ │
│     │  - 玩家信息（现金、利润）                    │ │
│     │  - 切换标签：生产端 / 财务端                │ │
│     ├─────────────────────────────────────────────┤ │
│     │  主内容区                                    │ │
│     │                                              │ │
│     │  【生产端标签】                              │ │
│     │  ├─ 店铺管理卡片                             │ │
│     │  ├─ 员工管理卡片                             │ │
│     │  ├─ 产品研发卡片                             │ │
│     │  ├─ 生产决策卡片（核心）                     │ │
│     │  └─ 市场决策卡片                             │ │
│     │                                              │ │
│     │  【财务端标签】                              │ │
│     │  ├─ 本回合财务报表                           │ │
│     │  ├─ 累计财务图表                             │ │
│     │  └─ 历史回合数据                             │ │
│     └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  4. 回合结算页 (/game/:gameId/round-result)         │
│     - 销售结果展示                                   │
│     - 各玩家销售情况对比                             │
│     - 进入下一回合按钮                               │
├─────────────────────────────────────────────────────┤
│  5. 游戏结束页 (/game/:gameId/final)                │
│     - 最终排行榜                                     │
│     - 各玩家财务汇总                                 │
│     - 返回首页按钮                                   │
└─────────────────────────────────────────────────────┘
```

### 7.2 核心页面设计

#### 7.2.1 游戏主界面布局

```typescript
const GameRoom: React.FC = () => {
  const { gameId } = useParams();
  const [activeTab, setActiveTab] = useState<'production' | 'finance'>('production');
  const gameState = useGameStore(state => state.gameState);

  return (
    <Layout>
      {/* 顶部导航 */}
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>第 {gameState.currentRound} 回合 / 共10回合</Title>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title="当前现金" value={gameState.player.cash} suffix="元" />
              <Statistic
                title="累计利润"
                value={gameState.player.totalProfit}
                suffix="元"
                valueStyle={{ color: gameState.player.totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
              />
            </Space>
          </Col>
        </Row>
      </Header>

      {/* 主内容区 */}
      <Content style={{ padding: '24px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="生产端" key="production">
            <ProductionPanel gameId={gameId} />
          </TabPane>
          <TabPane tab="财务报表" key="finance">
            <FinancePanel gameId={gameId} />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};
```

#### 7.2.2 生产端面板

```typescript
const ProductionPanel: React.FC<{gameId: string}> = ({ gameId }) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 店铺管理 */}
      <Card title="店铺管理">
        <ShopManagement />
      </Card>

      {/* 员工管理 */}
      <Card title="员工管理">
        <EmployeeManagement />
      </Card>

      {/* 市场决策 */}
      <Card title="市场决策">
        <Row gutter={16}>
          <Col span={12}>
            <Button type="primary" size="large" block>
              市场调研（500元）
            </Button>
          </Col>
          <Col span={12}>
            <Button type="primary" size="large" block>
              投放广告（800元）
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 产品研发 */}
      <Card title="产品研发">
        <ProductResearch />
      </Card>

      {/* 生产决策（核心） */}
      <Card title="生产决策" style={{ background: '#f0f5ff' }}>
        <ProductionPlan />
      </Card>
    </Space>
  );
};
```

### 7.3 状态管理（Zustand）

```typescript
// store/gameStore.ts
interface GameState {
  gameId: string | null;
  roomCode: string | null;
  currentRound: number;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentPlayer: Player | null;

  // Actions
  setGame: (game: Game) => void;
  updateRound: (round: number) => void;
  updatePlayer: (player: Player) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  roomCode: null,
  currentRound: 1,
  status: 'waiting',
  players: [],
  currentPlayer: null,

  setGame: (game) => set({
    gameId: game.id,
    roomCode: game.room_code,
    status: game.status
  }),

  updateRound: (round) => set({ currentRound: round }),

  updatePlayer: (player) => set({ currentPlayer: player }),
}));

// store/productionStore.ts
interface ProductionState {
  unlockedProducts: PlayerProduct[];
  employees: Employee[];
  totalProductivity: number;
  allocations: Record<number, ProductionAllocation>;

  // Actions
  setUnlockedProducts: (products: PlayerProduct[]) => void;
  setEmployees: (employees: Employee[]) => void;
  updateAllocation: (recipeId: number, allocation: ProductionAllocation) => void;
}

export const useProductionStore = create<ProductionState>((set) => ({
  // ...implementation
}));
```

---

## 8. 实时通信方案

### 8.1 WebSocket连接管理

**后端实现** (FastAPI + Socket.IO):
```python
# backend/app/api/websocket.py
from fastapi import WebSocket
from fastapi_socketio import SocketManager
import socketio

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

# 房间管理
game_rooms = {}  # {game_id: [player_socket_ids]}

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def join_game(sid, data):
    """玩家加入游戏房间"""
    game_id = data['game_id']
    player_id = data['player_id']

    # 加入Socket.IO房间
    sio.enter_room(sid, f"game_{game_id}")

    # 记录玩家连接
    if game_id not in game_rooms:
        game_rooms[game_id] = []
    game_rooms[game_id].append(sid)

    # 通知其他玩家
    await sio.emit('player_joined', {
        'player_id': player_id,
        'nickname': data.get('nickname')
    }, room=f"game_{game_id}", skip_sid=sid)

@sio.event
async def player_ready(sid, data):
    """玩家准备"""
    game_id = data['game_id']
    player_id = data['player_id']

    # 更新数据库
    player = Player.get(player_id)
    player.is_ready = True
    player.save()

    # 广播给所有玩家
    await sio.emit('player_status_update', {
        'player_id': player_id,
        'is_ready': True
    }, room=f"game_{game_id}")

    # 检查是否所有玩家都准备
    game = Game.get(game_id)
    all_ready = all(p.is_ready for p in game.players)

    if all_ready:
        # 开始游戏
        game.status = 'playing'
        game.started_at = datetime.now()
        game.save()

        # 生成所有回合的客流量
        CustomerFlowGenerator.generate_all_rounds(game_id)

        # 通知游戏开始
        await sio.emit('game_started', {
            'start_time': game.started_at.isoformat(),
            'first_round_flow': get_customer_flow(game_id, 1)
        }, room=f"game_{game_id}")

@sio.event
async def production_submitted(sid, data):
    """玩家提交生产计划"""
    game_id = data['game_id']
    player_id = data['player_id']
    round_number = data['round']

    # 广播给其他玩家
    await sio.emit('player_action', {
        'player_id': player_id,
        'action': 'production_submitted',
        'round': round_number
    }, room=f"game_{game_id}", skip_sid=sid)

    # 检查是否所有玩家都提交了
    game = Game.get(game_id)
    all_submitted = check_all_players_submitted(game_id, round_number)

    if all_submitted:
        # 执行回合计算
        sales_results = CustomerFlowAllocator.allocate(game_id, round_number)

        # 计算所有玩家的财务
        for player in game.players:
            FinanceService.calculate_round_finance(player.id, round_number)

        # 广播回合结果
        await sio.emit('round_calculated', {
            'round': round_number,
            'sales_results': sales_results
        }, room=f"game_{game_id}")

@sio.event
async def disconnect(sid):
    """玩家断开连接"""
    # 清理连接记录
    for game_id, sids in game_rooms.items():
        if sid in sids:
            sids.remove(sid)
            sio.leave_room(sid, f"game_{game_id}")
```

**前端实现** (Socket.IO Client):
```typescript
// services/socket.ts
import io from 'socket.io-client';

class SocketService {
  private socket: any;

  connect(gameId: string, playerId: number) {
    this.socket = io('http://localhost:8000', {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to game server');

      // 加入游戏房间
      this.socket.emit('join_game', {
        game_id: gameId,
        player_id: playerId
      });
    });

    // 监听事件
    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('player_joined', (data: any) => {
      console.log('New player joined:', data);
      // 更新UI
      useGameStore.getState().addPlayer(data);
    });

    this.socket.on('game_started', (data: any) => {
      console.log('Game started:', data);
      useGameStore.getState().setStatus('playing');
    });

    this.socket.on('round_calculated', (data: any) => {
      console.log('Round results:', data);
      // 跳转到回合结算页
      window.location.href = `/game/${data.game_id}/round-result`;
    });
  }

  playerReady(gameId: string, playerId: number) {
    this.socket.emit('player_ready', {
      game_id: gameId,
      player_id: playerId
    });
  }

  productionSubmitted(gameId: string, playerId: number, round: number) {
    this.socket.emit('production_submitted', {
      game_id: gameId,
      player_id: playerId,
      round
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
```

### 8.2 房间同步机制

**同步策略**：
1. **玩家状态同步**：玩家加入、准备、断线等状态实时同步
2. **回合流转控制**：所有玩家提交决策后自动进入下一回合
3. **结果广播**：回合计算完成后同步推送给所有玩家

---

## 9. 安全与性能

### 9.1 数据校验

**前端校验**：
```typescript
const validateProductionPlan = (allocations: ProductionAllocation[], totalProductivity: number) => {
  // 1. 检查总生产力
  const allocated = allocations.reduce((sum, a) => sum + a.productivity, 0);
  if (allocated > totalProductivity) {
    throw new Error('生产力分配超过总量');
  }

  // 2. 检查定价
  for (const alloc of allocations) {
    if (alloc.price < 10 || alloc.price > 40 || alloc.price % 5 !== 0) {
      throw new Error('定价必须是10-40元之间的5的倍数');
    }
  }

  return true;
};
```

**后端校验** (Pydantic):
```python
from pydantic import BaseModel, validator

class ProductionPlanItem(BaseModel):
    recipe_id: int
    productivity: int
    price: int

    @validator('productivity')
    def validate_productivity(cls, v):
        if v < 0:
            raise ValueError('生产力不能为负数')
        return v

    @validator('price')
    def validate_price(cls, v):
        if v < 10 or v > 40 or v % 5 != 0:
            raise ValueError('定价必须是10-40元之间的5的倍数')
        return v

class ProductionPlanRequest(BaseModel):
    player_id: int
    round: int
    productions: List[ProductionPlanItem]

    @validator('productions')
    def validate_total_productivity(cls, v, values):
        # 在API层额外验证总生产力
        return v
```

### 9.2 防作弊机制

1. **服务器端权威**：所有计算在服务器端进行，前端只做展示
2. **回合锁定**：玩家只能操作当前回合，无法修改历史数据
3. **操作验证**：每次操作验证玩家身份和权限
4. **数据一致性检查**：定期检查数据完整性

```python
def verify_player_action(player_id: int, game_id: int, round_number: int):
    """验证玩家操作合法性"""
    game = Game.get(game_id)

    # 1. 检查游戏状态
    if game.status != 'playing':
        raise PermissionError("游戏未在进行中")

    # 2. 检查回合
    if round_number != game.current_round:
        raise PermissionError("只能操作当前回合")

    # 3. 检查玩家是否在游戏中
    player = Player.get(player_id)
    if player.game_id != game_id:
        raise PermissionError("玩家不在此游戏中")

    return True
```

### 9.3 性能优化

**数据库优化**：
1. 合理使用索引（已在数据表设计中体现）
2. 查询优化（使用select_related减少查询次数）
3. 数据库连接池

**缓存策略**：
```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_game_state(game_id: int):
    """获取游戏状态（带缓存）"""
    cache_key = f"game:{game_id}:state"

    # 尝试从缓存读取
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # 从数据库读取
    game = Game.get(game_id)
    game_state = {
        "id": game.id,
        "room_code": game.room_code,
        "status": game.status,
        "current_round": game.current_round
    }

    # 写入缓存（60秒过期）
    redis_client.setex(cache_key, 60, json.dumps(game_state))

    return game_state
```

**前端性能优化**：
1. 组件懒加载
2. 虚拟滚动（长列表）
3. 防抖/节流（输入框）
4. React.memo优化不必要的重渲染

---

## 10. 部署方案

### 10.1 开发环境配置

**前端**：
```bash
# 安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev  # Vite开发服务器，默认端口3000
```

**后端**：
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

**数据库**：
```bash
# 使用Docker启动PostgreSQL
docker run -d \
  --name naicha-postgres \
  -e POSTGRES_USER=naicha \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=naicha_game \
  -p 5432:5432 \
  postgres:14

# 使用Docker启动Redis
docker run -d \
  --name naicha-redis \
  -p 6379:6379 \
  redis:7
```

### 10.2 生产环境部署

**Docker Compose配置**：
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://naicha:password@postgres:5432/naicha_game
      - REDIS_URL=redis://redis:6379/0

  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=naicha
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=naicha_game

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**部署命令**：
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 10.3 环境变量配置

**后端 (.env)**：
```env
# 数据库
DATABASE_URL=postgresql://naicha:password@localhost:5432/naicha_game

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT密钥
SECRET_KEY=your-secret-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:80

# 游戏配置
MAX_ROUNDS=10
MAX_PLAYERS=4
```

**前端 (.env)**：
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 11. 开发计划

### 11.1 功能模块优先级

**第一阶段（核心功能）- 预计3周**：
1. 数据库设计与实现（3天）
2. 后端基础框架搭建（2天）
3. 游戏房间管理（创建、加入、开始）（3天）
4. 生产端核心功能（店铺、员工、生产决策）（5天）
5. 计算引擎（客流分配算法）（4天）
6. 基础前端界面（2天）

**第二阶段（完善功能）- 预计2周**：
1. 产品研发系统（2天）
2. 市场决策（广告、调研）（2天）
3. 财务报表系统（3天）
4. 实时通信（WebSocket）（3天）
5. 回合流转控制（2天）

**第三阶段（优化与测试）- 预计1周**：
1. 前端UI优化（2天）
2. 性能优化（1天）
3. 单元测试（2天）
4. 集成测试（2天）

**第四阶段（部署与文档）- 预计3天**：
1. Docker配置（1天）
2. 部署测试（1天）
3. 用户手册（1天）

**总计**：约6-7周

### 11.2 技术栈版本

```json
{
  "frontend": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^4.3.0",
    "antd": "^5.6.0",
    "zustand": "^4.3.0",
    "socket.io-client": "^4.6.0",
    "axios": "^1.4.0"
  },
  "backend": {
    "python": "3.10+",
    "fastapi": "^0.100.0",
    "sqlalchemy": "^2.0.0",
    "pydantic": "^2.0.0",
    "python-socketio": "^5.9.0",
    "psycopg2-binary": "^2.9.0",
    "redis": "^4.6.0",
    "alembic": "^1.11.0"
  },
  "infrastructure": {
    "postgresql": "14+",
    "redis": "7+",
    "docker": "20.10+",
    "nginx": "1.24+"
  }
}
```

### 11.3 开发里程碑

| 里程碑 | 完成标准 | 预计时间 |
|--------|---------|---------|
| M1: 数据库完成 | 所有表创建，测试数据插入成功 | 第1周 |
| M2: 后端API完成 | 所有RESTful API开发完成，Postman测试通过 | 第2周 |
| M3: 前端基础界面 | 游戏大厅、生产端界面可用 | 第3周 |
| M4: 核心算法实现 | 客流分配算法测试通过 | 第4周 |
| M5: 实时通信完成 | WebSocket连接稳定，多人同步正常 | 第5周 |
| M6: 完整游戏流程 | 可完成完整10回合游戏 | 第6周 |
| M7: 部署上线 | Docker部署成功，生产环境可用 | 第7周 |

---

## 附录

### A. 游戏常量定义

```python
# backend/app/utils/game_constants.py

class GameConstants:
    """游戏常量"""

    # 游戏基础
    TOTAL_ROUNDS = 10
    INITIAL_CASH = 10000
    MAX_PLAYERS = 4
    MIN_PLAYERS = 2

    # 店铺装修
    DECORATION_COSTS = {
        1: 400,   # 简装
        2: 800,   # 精装
        3: 1600   # 豪华装
    }

    MAX_EMPLOYEES = {
        1: 2,  # 简装容纳2人
        2: 3,  # 精装容纳3人
        3: 4   # 豪华装容纳4人
    }

    # 原材料价格（每10份）
    MATERIAL_BASE_PRICES = {
        "tea": 60,
        "milk": 40,
        "fruit": 50,
        "ingredient": 20
    }

    # 市场行动费用
    MARKET_RESEARCH_COST = 500
    ADVERTISEMENT_COST = 800
    PRODUCT_RESEARCH_COST = 600

    # 定价规则
    MIN_PRICE = 10
    MAX_PRICE = 40
    PRICE_STEP = 5

    # 客流量范围
    HIGH_TIER_CUSTOMER_RANGE = (10, 30)
    LOW_TIER_CUSTOMER_RANGE = (40, 80)

    # 批量折扣
    DISCOUNT_PER_TIER = 0.1  # 每50份-10%
    DISCOUNT_TIER_SIZE = 50
    MAX_DISCOUNT_TIERS = 5   # 最多5次折扣（-50%）
```

### B. 数据库迁移

```python
# 使用Alembic进行数据库迁移

# 初始化Alembic
alembic init alembic

# 创建迁移脚本
alembic revision --autogenerate -m "Initial schema"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### C. 测试用例示例

```python
# tests/test_customer_flow_allocator.py
import pytest
from app.services.calculation_engine import CustomerFlowAllocator

def test_high_tier_customer_allocation():
    """测试高购买力客户分配逻辑"""
    products = [
        {"reputation": 50, "price": 25, "available": 10},
        {"reputation": 40, "price": 20, "available": 5},
        {"reputation": 30, "price": 10, "available": 20},
    ]

    sorted_products = CustomerFlowAllocator._sort_for_high_tier(products)

    assert sorted_products[0]["reputation"] == 50
    assert sorted_products[1]["reputation"] == 40
    assert sorted_products[2]["reputation"] == 30

def test_low_tier_customer_allocation():
    """测试低购买力客户分配逻辑"""
    products = [
        {"reputation": 30, "price": 15, "available": 15},
        {"reputation": 30, "price": 10, "available": 20},
        {"reputation": 25, "price": 10, "available": 10},
    ]

    sorted_products = CustomerFlowAllocator._sort_for_low_tier(products)

    # 价格10元的优先，相同价格时口碑30优先于25
    assert sorted_products[0]["price"] == 10
    assert sorted_products[0]["reputation"] == 30
```

---

## 总结

本技术方案文档涵盖了"奶茶大作战"线上系统的所有技术细节，包括：

✅ **完整的系统架构**：前后端分离，实时通信，数据持久化
✅ **详细的数据库设计**：12张数据表，ER关系清晰
✅ **核心算法实现**：客流分配、口碑计算、批量折扣
✅ **30+ API接口**：RESTful + WebSocket
✅ **前端组件设计**：React + TypeScript + Ant Design
✅ **部署方案**：Docker容器化，一键部署
✅ **开发计划**：6-7周完成开发

**后续步骤**：
1. 确认技术方案无误
2. 搭建开发环境
3. 按开发计划执行
4. 定期Review进度

**预期成果**：
- 支持2-4人联机游戏
- 完整的10回合游戏流程
- 实时数据同步
- 自动财务报表
- 稳定可靠的计算引擎

---

**文档结束**
