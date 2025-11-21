# 🧋 奶茶大作战 - 前端开发完整指南

## 📋 项目概述

**项目名称**: 奶茶大作战 (Bubble Tea Battle)
**项目类型**: 多人在线商业模拟桌游
**目标用户**: 桌游玩家、商业策略游戏爱好者
**核心玩法**: 2-4人实时对战，10回合经营奶茶店，累计利润最高者获胜

---

## 🎨 设计风格定位（基于DESIGN_PROMPT.md）

### 核心关键词
- **二次元游戏风格** (Anime Game Style)
- **可爱活泼** (Cute & Lively)
- **年轻化** (Youthful)
- **互动性强** (Interactive)
- **商业模拟** (Business Simulation)

### 设计理念
> 将商业模拟桌游与二次元游戏风格结合，用色彩、动画和游戏化元素，让玩家在轻松愉快的氛围中体验经营乐趣。

---

## 🌈 色彩系统

### 主色调
```css
/* 奶茶主题色彩 - 明亮活泼 */
--primary-pink: #FF6B9D;          /* 草莓奶茶粉 - 主色调 */
--primary-brown: #8B4513;         /* 奶茶棕 - 商业感 */
--primary-purple: #A78BFA;        /* 薰衣草紫 - 梦幻感 */
--primary-yellow: #FFC107;        /* 芒果黄 - 活力 */
--primary-green: #7FE5A8;         /* 薄荷绿 - 清新 */
```

**使用场景**:
- 草莓粉：主要CTA按钮、重要标题、现金/利润显示
- 奶茶棕：导航栏、店铺相关元素
- 薰衣草紫：产品、研发相关
- 芒果黄：警告、提示、回合提示
- 薄荷绿：成功提示、正向数据

### 辅助色
```css
/* 柔和的辅助色调 */
--accent-pink: #FFB6C1;           /* 浅粉 - 卡片背景 */
--accent-brown: #D2691E;          /* 浅棕 - hover状态 */
--accent-purple: #D4BBFF;         /* 浅紫 - 标签背景 */
--accent-green: #B8F5D0;          /* 浅绿 - 成功背景 */
--accent-yellow: #FFE082;         /* 浅黄 - 提示背景 */
```

### 渐变色（奶茶主题）
```css
/* 游戏化渐变效果 */
--gradient-milk-tea: linear-gradient(135deg, #D2691E 0%, #FFB6C1 100%);  /* 奶茶渐变 */
--gradient-money: linear-gradient(135deg, #FFD700 0%, #FF9800 100%);     /* 金钱渐变 */
--gradient-success: linear-gradient(135deg, #7FE5A8 0%, #4ECDC4 100%);  /* 成功渐变 */
--gradient-game: linear-gradient(135deg, #667eea 0%, #764ba2 100%);     /* 游戏渐变 */
```

### 背景色系统
```css
--bg-main: #FFF8F0;               /* 奶茶白 - 主背景 */
--bg-secondary: #F5F5DC;          /* 米色 - 次级背景 */
--bg-card: #FFFFFF;               /* 纯白 - 卡片背景 */
--bg-dark: #2D3748;               /* 深灰 - 暗色区域 */
```

### 文字色系统
```css
--text-primary: #2D3748;          /* 主文字 */
--text-secondary: #718096;        /* 次要文字 */
--text-light: #A0AEC0;            /* 辅助文字 */
--text-money: #FFD700;            /* 金钱数字 */
```

---

## 🎭 UI组件风格

### 1. 按钮设计

**主要按钮**
```css
.btn-primary {
    background: var(--gradient-milk-tea);
    color: white;
    border: none;
    border-radius: 25px;  /* 圆润的边角 */
    padding: 12px 32px;
    font-weight: 600;
    box-shadow: 0 8px 20px rgba(210, 105, 30, 0.3);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(210, 105, 30, 0.4);
}
```

**金钱按钮**（市场调研、广告等）
```css
.btn-money {
    background: var(--gradient-money);
    color: #2D3748;
    border: none;
    border-radius: 25px;
    padding: 12px 32px;
    font-weight: 700;
    box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
}
```

**特点**:
- ✨ 使用渐变色增加视觉吸引力
- 🎈 圆润的圆角 (25px+)
- 💫 hover时有浮动效果
- 🌟 柔和的阴影营造立体感

### 2. 卡片设计

**决策卡片**（开店、招聘、研发等）
```css
.decision-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 3px solid transparent;
    transition: all 0.3s ease;
}

.decision-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--primary-purple);
}

.decision-card.active {
    border-color: var(--primary-pink);
    background: var(--accent-pink);
}
```

**产品卡片**
```css
.product-card {
    background: linear-gradient(135deg, #ffffff 0%, var(--accent-purple) 100%);
    border-radius: 20px;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
}

.product-card::before {
    content: '🧋';
    position: absolute;
    font-size: 4rem;
    opacity: 0.1;
    right: -20px;
    bottom: -20px;
}
```

### 3. 表单元素

**输入框**
```css
.form-control {
    border: 2px solid #e5e7eb;
    border-radius: 15px;
    padding: 12px 20px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-purple);
    box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.1);
}
```

**选择框**（装修等级、产品选择等）
```css
.custom-select {
    border-radius: 15px;
    border: 2px solid var(--primary-brown);
    padding: 12px 20px;
    background: white;
    cursor: pointer;
}
```

### 4. 标签/徽章

**玩家状态标签**
```css
.player-tag {
    display: inline-block;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    padding: 0.5rem 1rem;
    border-radius: 20px;  /* 胶囊形状 */
    font-size: 0.9rem;
    font-weight: 600;
}

.player-tag.ready {
    background: linear-gradient(135deg, #7FE5A8 0%, #4ECDC4 100%);
    color: white;
}
```

**回合标签**
```css
.round-badge {
    background: var(--gradient-game);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 30px;
    font-size: 1.2rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

---

## ✨ 动画效果系统

### 1. 核心动画

**金币闪烁** (用于现金显示)
```css
@keyframes coinShine {
    0%, 100% {
        transform: scale(1);
        filter: brightness(1);
    }
    50% {
        transform: scale(1.05);
        filter: brightness(1.2);
    }
}

.money-display {
    animation: coinShine 2s ease-in-out infinite;
}
```

**奶茶杯浮动** (用于装饰)
```css
@keyframes bubbleTeaFloat {
    0%, 100% {
        transform: translateY(0) rotate(0deg);
    }
    25% {
        transform: translateY(-15px) rotate(3deg);
    }
    75% {
        transform: translateY(-8px) rotate(-3deg);
    }
}

.bubble-tea-emoji {
    animation: bubbleTeaFloat 5s ease-in-out infinite;
}
```

**倒计时脉冲** (用于等待其他玩家)
```css
@keyframes waitingPulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
}

.waiting-indicator {
    animation: waitingPulse 1.5s ease-in-out infinite;
}
```

**提交成功** (提交决策后)
```css
@keyframes successBounce {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.submit-success {
    animation: successBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## 🎮 游戏化元素

### 1. 奶茶店装饰元素

**漂浮奶茶Emoji**
```html
<div class="floating-emoji bubble-tea" style="top: 10%; left: 5%;">🧋</div>
<div class="floating-emoji milk" style="top: 20%; right: 10%;">🥛</div>
<div class="floating-emoji fruit" style="top: 30%; left: 15%;">🍓</div>
```

**金币图标**
```html
<div class="coin-icon">💰</div>
```

### 2. 玩家头像系统

**房间准备页玩家列表**
```html
<div class="player-avatar">
    <div class="avatar-circle" style="background: var(--gradient-milk-tea);">
        <span class="player-initial">玩</span>
    </div>
    <div class="player-status ready">✅</div>
</div>
```

### 3. 数据展示游戏化

**现金显示**
```html
<div class="money-display">
    <i class="fas fa-coins" style="color: var(--text-money);"></i>
    <span class="money-amount">¥10,000</span>
</div>
```

**排行榜**
```html
<div class="leaderboard-item rank-1">
    <div class="rank-badge">🥇</div>
    <div class="player-name">玩家1</div>
    <div class="profit-amount">¥5,000</div>
</div>
```

---

## 🎮 完整游戏流程设计

### 阶段1：游戏大厅

#### 页面1.1：首页
```
┌─────────────────────────────────────────────┐
│                                             │
│           🧋 奶茶大作战                      │
│        Bubble Tea Battle                    │
│                                             │
│   ┌──────────────────────────────────┐     │
│   │  [创建房间] 🎮                   │     │
│   └──────────────────────────────────┘     │
│                                             │
│   ┌──────────────────────────────────┐     │
│   │  [加入房间] 🚪                   │     │
│   └──────────────────────────────────┘     │
│                                             │
│   装饰元素：🧋 🥛 🍓 💰                    │
└─────────────────────────────────────────────┘
```

**功能**:
- 创建房间：弹窗输入昵称 → 生成6位房间码
- 加入房间：弹窗输入房间码 + 昵称

**API调用**:
- POST `/api/v1/games/create`
- POST `/api/v1/players/join/{room_code}`

---

### 阶段2：房间准备

#### 页面2.1：房间准备页
```
┌─────────────────────────────────────────────┐
│ 🏠 房间码: ABCDEF       [复制] 📋          │
├─────────────────────────────────────────────┤
│ 👥 玩家列表 (2/4)                           │
│ ┌─────────────────────────────────────┐    │
│ │ 👤 玩家1 (房主) 🎖️  ✅ 已准备      │    │
│ │ 👤 玩家2            ⏳ 未准备       │    │
│ │ 👤 等待加入...                      │    │
│ │ 👤 等待加入...                      │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ [准备] / [取消准备]                         │
│ [开始游戏] (房主，所有人准备后亮起)         │
└─────────────────────────────────────────────┘
```

**实时更新**:
- 轮询间隔：2秒
- 监听：玩家加入、玩家准备状态

**API调用**:
- GET `/api/v1/games/{room_code}` (轮询)
- PATCH `/api/v1/players/{player_id}/ready`
- POST `/api/v1/games/{room_code}/start`

---

### 阶段3：游戏主界面

#### 页面3.1：游戏主界面布局
```
┌───────────────────────────────────────────────────────────┐
│ 🎮 第1回合/10 | 💰 ¥10,000 | 🏆 排名: #2 | 👤 玩家1     │
├────────────────────────┬──────────────────────────────────┤
│ [左侧：操作面板]       │ [右侧：信息面板]                  │
│                        │                                   │
│ 📍 1. 开店决策         │ 💼 本回合财务                     │
│ 👥 2. 人力管理         │ ├─ 💰 收入: ¥XXX                 │
│ 📢 3. 市场决策         │ ├─ 💸 支出: ¥XXX                 │
│ 🔬 4. 研发决策         │ └─ 📈 利润: ¥XXX                 │
│ 🏭 5. 生产决策 ⚠️     │                                   │
│                        │ 🏆 实时排名                       │
│ ┌────────────────────┐│ 1. 🥇 玩家1 - ¥5000              │
│ │ [提交本回合决策]   ││ 2. 🥈 玩家2 - ¥4500              │
│ │ (需完成生产计划)   ││ 3. 🥉 玩家3 - ¥4000              │
│ └────────────────────┘│ 4. 4️⃣  玩家4 - ¥3500              │
│                        │                                   │
│ ⏳ 等待玩家: 2/4       │ 📊 上回合销售                     │
└────────────────────────┴──────────────────────────────────┘
```

---

## 📱 5大决策模块详细设计

### 模块1️⃣：开店决策

**仅第1回合显示**

```html
<div class="decision-card shop-decision">
    <h3>🏪 开店决策</h3>

    <!-- 租金输入 -->
    <div class="form-group">
        <label>租金（线下抽卡获得）</label>
        <input type="number" class="form-control" placeholder="输入租金...">
    </div>

    <!-- 装修等级选择 -->
    <div class="decoration-options">
        <div class="decoration-item" data-level="1">
            <div class="decoration-icon">🏠</div>
            <h4>简装</h4>
            <p class="price">¥400</p>
            <p class="capacity">可容纳 2 位员工</p>
        </div>

        <div class="decoration-item" data-level="2">
            <div class="decoration-icon">🏢</div>
            <h4>精装</h4>
            <p class="price">¥800</p>
            <p class="capacity">可容纳 3 位员工</p>
        </div>

        <div class="decoration-item" data-level="3">
            <div class="decoration-icon">🏛️</div>
            <h4>豪华装</h4>
            <p class="price">¥1,600</p>
            <p class="capacity">可容纳 4 位员工</p>
        </div>
    </div>

    <button class="btn btn-primary">确认开店</button>
</div>
```

**API**: POST `/api/v1/shops/open`

---

### 模块2️⃣：人力管理

```html
<div class="decision-card employee-management">
    <h3>👥 人力管理</h3>

    <!-- 员工列表 -->
    <div class="employee-list">
        <div class="employee-item">
            <div class="employee-info">
                <span class="employee-name">张三</span>
                <span class="employee-salary">💰 ¥1,000/回合</span>
                <span class="employee-productivity">⚡ 5杯/回合</span>
            </div>
            <button class="btn btn-danger btn-sm">解雇</button>
        </div>
    </div>

    <!-- 总生产力显示 -->
    <div class="productivity-summary">
        <h4>⚡ 总生产力: <span class="total-productivity">15</span> 杯</h4>
    </div>

    <!-- 招聘按钮（未达上限时显示） -->
    <button class="btn btn-success" v-if="canHire">
        ➕ 招聘新员工 (2/3)
    </button>

    <!-- 招聘表单（点击后显示） -->
    <div class="hire-form" v-if="showHireForm">
        <input type="text" placeholder="姓名">
        <input type="number" placeholder="工资">
        <input type="number" placeholder="生产力">
        <button class="btn btn-primary">确认招聘</button>
    </div>
</div>
```

**API**:
- GET `/api/v1/employees/player/{player_id}`
- POST `/api/v1/employees/hire`
- POST `/api/v1/employees/{id}/fire`

---

### 模块3️⃣：市场决策

```html
<div class="decision-card market-decisions">
    <h3>📢 市场决策</h3>

    <!-- 市场调研 -->
    <div class="market-action research">
        <div class="action-header">
            <span class="action-icon">🔍</span>
            <h4>市场调研</h4>
            <span class="action-cost">¥500</span>
        </div>
        <p>查看下一回合的客流量</p>
        <button class="btn btn-money">执行调研</button>

        <!-- 调研结果（执行后显示） -->
        <div class="research-result" v-if="researchDone">
            <p>👥 高购买力客户: <strong>25</strong> 人</p>
            <p>👥 低购买力客户: <strong>40</strong> 人</p>
        </div>
    </div>

    <!-- 广告投放 -->
    <div class="market-action advertisement">
        <div class="action-header">
            <span class="action-icon">📣</span>
            <h4>广告投放</h4>
            <span class="action-cost">¥800</span>
        </div>

        <!-- 选择产品 -->
        <select class="custom-select">
            <option>选择产品...</option>
            <option>奶茶</option>
            <option>珍珠奶茶</option>
        </select>

        <!-- 输入骰子点数 -->
        <input type="number" min="1" max="6" placeholder="骰子点数 (1-6)">

        <button class="btn btn-money">投放广告</button>
    </div>
</div>
```

**API**:
- POST `/api/v1/market/research`
- POST `/api/v1/market/advertisement`

---

### 模块4️⃣：研发决策

```html
<div class="decision-card research-lab">
    <h3>🔬 产品研发</h3>

    <!-- 产品列表 -->
    <div class="product-recipes">
        <!-- 已解锁产品 -->
        <div class="product-item unlocked">
            <div class="product-icon">🧋</div>
            <div class="product-info">
                <h4>奶茶</h4>
                <p class="recipe">配方: 1茶1奶</p>
                <p class="fan-rate">圈粉率: 5%</p>
            </div>
            <div class="product-status">
                <span class="badge badge-success">已解锁</span>
            </div>
        </div>

        <!-- 未解锁产品 -->
        <div class="product-item locked">
            <div class="product-icon">🍹</div>
            <div class="product-info">
                <h4>珍珠奶茶</h4>
                <p class="recipe">配方: 2奶1茶1配料</p>
                <p class="difficulty">难度: ≥3</p>
                <p class="fan-rate">圈粉率: 20%</p>
            </div>
            <div class="product-action">
                <p class="cost">¥600</p>
                <button class="btn btn-purple">研发</button>
            </div>
        </div>
    </div>
</div>

<!-- 研发弹窗 -->
<div class="modal research-modal">
    <h3>🎲 掷骰子研发</h3>
    <p>需要点数 ≥ 3 才能成功</p>
    <input type="number" min="1" max="6" placeholder="输入骰子点数">
    <button class="btn btn-primary">确认</button>
</div>
```

**API**:
- GET `/api/v1/products/recipes?player_id={player_id}`
- POST `/api/v1/products/research`

---

### 模块5️⃣：生产决策（核心模块）

```html
<div class="decision-card production-planning">
    <h3>🏭 生产决策</h3>

    <!-- 生产力分配提示 -->
    <div class="productivity-bar">
        <p>⚡ 可分配生产力: <span class="allocated">10</span> / <span class="total">15</span></p>
        <div class="progress">
            <div class="progress-bar" style="width: 66.6%"></div>
        </div>
    </div>

    <!-- 已解锁产品的生产设置 -->
    <div class="production-items">
        <div class="production-item">
            <div class="product-header">
                <h4>🧋 奶茶</h4>
                <p class="product-stats">
                    圈粉率: 5% | 累计销售: 30杯
                </p>
            </div>

            <!-- 分配生产力 -->
            <div class="form-group">
                <label>分配生产力</label>
                <input type="number" min="0" max="15"
                       class="form-control" placeholder="杯数">
            </div>

            <!-- 定价 -->
            <div class="form-group">
                <label>定价 (10-40元, 5的倍数)</label>
                <input type="number" min="10" max="40" step="5"
                       class="form-control" value="15">
                <small class="price-lock-info">
                    ⚠️ 定价锁定至第4回合
                </small>
            </div>

            <!-- 原料需求预览 -->
            <div class="material-preview">
                <p>📦 原料需求:</p>
                <ul>
                    <li>茶叶: 5份</li>
                    <li>牛奶: 5份</li>
                </ul>
                <p class="material-cost">💰 成本: ¥50</p>
            </div>
        </div>
    </div>

    <!-- 总成本预览 -->
    <div class="cost-summary">
        <h4>📊 本次生产总成本</h4>
        <table>
            <tr>
                <td>茶叶 (10份)</td>
                <td>¥54</td>
            </tr>
            <tr>
                <td>牛奶 (20份)</td>
                <td>¥72</td>
            </tr>
            <tr>
                <td><strong>总计</strong></td>
                <td><strong>¥126</strong></td>
            </tr>
        </table>
        <button class="btn btn-secondary">预览成本</button>
    </div>
</div>
```

**API**:
- GET `/api/v1/products/player/{player_id}/unlocked`
- POST `/api/v1/production/material-preview`
- POST `/api/v1/production/submit`

---

## 🔄 回合流程控制

### 完整流程图
```
第N回合开始
    ↓
[玩家进行5大决策]
    1. 开店决策 (仅第1回合)
    2. 人力管理 (可选)
    3. 市场决策 (可选)
    4. 研发决策 (可选)
    5. 生产决策 (必须！)
    ↓
[点击"提交本回合决策"]
    - 前端验证：生产计划是否完成
    - API调用：保存所有决策
    - 显示提交成功动画
    ↓
[等待其他玩家]
    - 显示等待界面
    - 实时更新：2/4 玩家已完成
    - 每2秒轮询一次
    ↓
[所有人完成，自动推进回合]
    - 调用 POST /api/v1/rounds/{game_id}/advance
    - 后端计算：
      ✓ 生成客流
      ✓ 分配销售
      ✓ 计算收入
      ✓ 生成财务报表
    ↓
[显示本回合结果]
    - 弹窗显示：
      ✓ 我的销售数据
      ✓ 我的财务报表
      ✓ 当前排行榜
    - 用户点击"确认"
    ↓
[进入下一回合]
    - 回合数 +1
    - 刷新页面数据
    - 重复流程
    ↓
[第10回合结束]
    - 显示最终结果
    - 排行榜
    - 胜利者动画
```

### 关键状态管理
```typescript
interface GameState {
    currentRound: number;          // 当前回合
    playerId: number;              // 我的玩家ID
    gameId: number;                // 游戏ID
    cash: number;                  // 当前现金
    submitted: boolean;            // 是否已提交本回合
    waitingPlayers: string[];      // 等待的玩家列表
}
```

---

## 🔧 技术栈

### 前端框架
- **React 18** + **TypeScript**
- **Vite** (构建工具)
- **Ant Design** (UI组件库)
- **Zustand** (状态管理)
- **React Router** (路由)
- **Axios** (HTTP请求)

### 样式方案
```
CSS Variables (基于DESIGN_PROMPT.md)
    +
Ant Design 组件覆盖
    +
自定义动画
```

### 项目结构
```
frontend/
├── public/
│   └── fonts/              # Fredoka, Nunito字体
├── src/
│   ├── assets/
│   │   └── images/         # 游戏图标、装饰元素
│   ├── components/
│   │   ├── Common/         # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── Shop/           # 开店模块
│   │   ├── Employee/       # 员工模块
│   │   ├── Market/         # 市场模块
│   │   ├── Research/       # 研发模块
│   │   ├── Production/     # 生产模块
│   │   └── Finance/        # 财务模块
│   ├── pages/
│   │   ├── Home.tsx        # 首页
│   │   ├── RoomLobby.tsx   # 房间准备
│   │   └── Game.tsx        # 游戏主界面
│   ├── stores/
│   │   └── gameStore.ts    # Zustand状态
│   ├── services/
│   │   └── api.ts          # API封装
│   ├── types/
│   │   └── game.d.ts       # TS类型
│   ├── styles/
│   │   ├── variables.css   # CSS变量
│   │   ├── animations.css  # 动画
│   │   └── global.css      # 全局样式
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 🎯 开发阶段规划

### MVP阶段（核心功能）
1. ✅ 创建/加入房间
2. ✅ 房间准备页
3. ✅ 游戏主界面框架
4. ✅ 生产决策（核心）
5. ✅ 回合推进
6. ✅ 财务报表显示

### 完整功能阶段
7. 开店决策
8. 人力管理
9. 市场决策
10. 研发决策
11. 实时排行榜

### 优化阶段
12. WebSocket实时通信
13. 动画效果增强
14. 响应式适配
15. 性能优化

---

## 📝 设计清单（基于DESIGN_PROMPT.md）

### 必备元素 ✅
- [ ] 使用奶茶主题色彩系统（粉、棕、紫）
- [ ] 圆润的边角（20px+）
- [ ] 柔和的阴影效果
- [ ] Hover交互动画
- [ ] 可爱的字体 (Fredoka/Nunito)
- [ ] 渐变色应用
- [ ] Emoji装饰（🧋🥛🍓💰）

### 加分元素 ⭐
- [ ] 漂浮奶茶Emoji
- [ ] 金币闪烁动画
- [ ] 倒计时脉冲效果
- [ ] 提交成功动画
- [ ] 排行榜动态更新
- [ ] 胜利者特效

### 禁忌 ❌
- ❌ 尖锐的直角
- ❌ 纯黑色（使用深灰）
- ❌ 单调的纯色背景
- ❌ 缺乏动画的静态页面
- ❌ 过小的点击区域
- ❌ 低对比度文字

---

## 🚀 开始开发

### 初始化项目
```bash
# 创建Vite + React + TypeScript项目
npm create vite@latest frontend -- --template react-ts
cd frontend

# 安装依赖
npm install
npm install antd zustand react-router-dom axios
npm install -D @types/node

# 启动开发服务器
npm run dev
```

### 配置API基础URL
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    timeout: 10000,
});

export default api;
```

---

**文档创建时间**: 2025-11-19
**设计风格**: 二次元游戏风格（基于DESIGN_PROMPT.md）
**后端API**: Flask 3.0 (已完成)
**前端技术**: React 18 + TypeScript + Vite

---

🧋 让我们创造一个可爱、有趣、充满活力的奶茶经营游戏！
