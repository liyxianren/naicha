# 奶茶大作战 - 前端UI/UX整体设计规划方案

## 一、设计理念与核心定位

### 设计理念
**"甜蜜竞争，可爱商战"（Sweet Competition, Cute Business Battle）**

- 通过真实珍珠奶茶的配色传达产品本质
- 使用清晰的数据可视化展示经营数据
- 可爱、轻松、友好的视觉语言降低商业模拟的严肃感
- 通过色彩、动效、图标系统让复杂机制易于理解

### 视觉风格：现代可爱风（Modern Kawaii）

**核心特征**：
- 大圆角（16-32px）、柔和曲线、气泡感
- 高饱和色彩（70-90%）配合渐变层次
- 丰富的微交互动画反馈
- 玻璃态质感（backdrop-filter + 半透明）
- Emoji + 线性图标混合使用
- 轻柔投影（blur 12-32px）

### 情感化目标

用户应该感受到：
- **轻松愉悦** - 像玩手游，而非严肃经营模拟器
- **清晰掌控** - 数据一目了然，决策路径清晰
- **竞争刺激** - 动画和色彩强化成就感
- **沉浸投入** - 统一视觉语言降低学习成本

---

## 二、配色系统

### 2.1 珍珠奶茶主题配色（高饱和度）

```css
:root {
  /* 珍珠黑系 - 文字、重要元素 */
  --color-pearl-black: #2C1810;
  --color-pearl-black-80: #4A3020;
  --color-pearl-black-60: #6B4830;

  /* 奶茶棕系 - 辅助元素、边框 */
  --color-milk-tea-brown: #8B6F47;
  --color-milk-tea-brown-light: #A5865C;
  --color-milk-tea-brown-dark: #6E5638;

  /* 奶盖白系 - 背景、卡片 */
  --color-milk-foam-white: #FFFBF7;
  --color-milk-foam-cream: #FFF8F0;
  --color-milk-foam-beige: #FFF0E6;

  /* 焦糖金系 - 强调、金钱 */
  --color-caramel-gold: #D4A574;
  --color-caramel-gold-light: #E8C194;
  --color-caramel-gold-dark: #B88A5F;
}
```

### 2.2 7种产品主题色

```css
:root {
  --product-milktea: #A5865C;               /* 奶茶 - 经典棕 */
  --product-coconut: #7EC8A3;               /* 椰奶 - 清新绿白 */
  --product-lemon: #F9D56E;                 /* 柠檬茶 - 明亮黄绿 */
  --product-juice: #FF8A65;                 /* 果汁 - 活力橙红 */
  --product-pearl: #9C7A97;                 /* 珍珠奶茶 - 深棕+紫 */
  --product-smoothie: #E58FB1;              /* 水果奶昔 - 梦幻粉紫 */
  --product-fruittea: #64C7B8;              /* 水果茶 - 清爽青绿 */

  /* 每个产品对应渐变 */
  --product-milktea-gradient: linear-gradient(135deg, #C4A67A 0%, #A5865C 100%);
  /* ...其他6个产品的渐变 */
}
```

### 2.3 状态色与渐变

```css
:root {
  /* 状态色 */
  --color-success: #7ED957;        /* 抹茶绿 */
  --color-warning: #FFB648;        /* 芒果黄 */
  --color-error: #FF6B6B;          /* 草莓红 */
  --color-info: #5DADE2;           /* 蓝莓蓝 */
  --color-money: #FFD700;          /* 闪亮金 */

  /* 渐变系统 */
  --gradient-btn-primary: linear-gradient(135deg, #E8C194 0%, #D4A574 100%);
  --gradient-btn-success: linear-gradient(135deg, #A8E68A 0%, #7ED957 100%);
  --gradient-glass-light: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,248,240,0.6) 100%);
  --gradient-money: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}
```

**变量命名规范统一**：
- 废弃旧命名：`--pixel-pink`, `--milktea-pink`
- 统一采用：`--color-{category}-{name}-{variant}`

---

## 三、排版系统

### 3.1 字体方案（双字体策略）

```css
:root {
  /* 主字体：中文正文 - 可爱圆润感 */
  --font-primary: 'Nunito', 'HarmonyOS Sans SC', 'PingFang SC', sans-serif;

  /* 标题字体：中文标题 - 圆润加粗 */
  --font-heading: 'Nunito', 'HarmonyOS Sans SC Bold', sans-serif;

  /* 数字字体：金钱/数据 - 清晰易读 */
  --font-number: 'DM Sans', 'Nunito', monospace;

  /* 像素字体：仅Logo装饰（<5%场景） */
  --font-pixel: 'Press Start 2P', monospace;
}
```

**Press Start 2P使用限制**：
- ❌ 不再用于：Lobby标题、按钮、常规UI
- ✅ 仅保留：游戏Logo、特殊成就徽章

### 3.2 字阶系统

```css
:root {
  --text-hero: 56px;        /* 登录页大标题 */
  --text-h1: 40px;          /* 页面主标题 */
  --text-h2: 32px;          /* 区块标题 */
  --text-h3: 24px;          /* 卡片标题 */
  --text-body: 16px;        /* 标准正文 */
  --text-body-sm: 14px;     /* 辅助正文 */
  --text-caption: 12px;     /* 说明文字 */

  --text-number-hero: 48px; /* 大额金钱 */
  --text-number-lg: 32px;   /* 重要数据 */
}
```

---

## 四、空间与形状系统

### 4.1 间距Scale（基于4px网格）

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### 4.2 圆角规范

```css
:root {
  --radius-xs: 4px;     /* 小标签 */
  --radius-sm: 8px;     /* 按钮、输入框 */
  --radius-md: 12px;    /* 小卡片 */
  --radius-lg: 16px;    /* 中卡片 */
  --radius-xl: 20px;    /* 大卡片 */
  --radius-2xl: 24px;   /* 主容器 */
  --radius-full: 9999px; /* 圆形按钮 */
}
```

**规则**：元素越重要/面积越大，圆角越大，营造柔和包容感。

---

## 五、阴影与发光系统

### 5.1 阴影层级

```css
:root {
  --shadow-xs: 0 1px 2px rgba(44, 24, 16, 0.04);
  --shadow-sm: 0 2px 8px rgba(44, 24, 16, 0.08);
  --shadow-md: 0 4px 16px rgba(44, 24, 16, 0.12);
  --shadow-lg: 0 8px 24px rgba(44, 24, 16, 0.16);
  --shadow-xl: 0 12px 32px rgba(44, 24, 16, 0.20);
}
```

### 5.2 产品主题发光（激活状态）

```css
:root {
  --glow-milktea: 0 0 20px rgba(165, 134, 92, 0.5);
  --glow-success: 0 0 16px rgba(126, 217, 87, 0.4);
  --glow-money: 0 0 24px rgba(255, 215, 0, 0.5);
}
```

---

## 六、动画系统改造

### 6.1 保留的动画（改为现代可爱风）

```css
/* ✅ 基础过渡 */
@keyframes fadeIn { /* 淡入 */ }
@keyframes slideUp { /* 上滑 */ }
@keyframes bounce { /* 弹跳（平滑曲线） */ }
@keyframes pulse { /* 脉冲 */ }
@keyframes float { /* 浮动 */ }

/* ✅ 游戏特效 */
@keyframes coinCollect { /* 金币收集 */ }
@keyframes scoreFloat { /* 分数飘动 */ }
@keyframes levelUp { /* 升级动画 */ }
```

### 6.2 移除的动画（像素风特有）

```css
/* ❌ 移除 */
pixelBlink, pixelShake, pixelRotate, pixelDots
pageDissolve, neonGlow, rainbowText, buttonPress
cloudDrift, starTwinkle
```

### 6.3 新增动画（现代可爱风）

```css
/* ✨ 新增 */
@keyframes glassShimmer { /* 玻璃态闪烁 */ }
@keyframes cardFlip { /* 卡片翻转 */ }
@keyframes ripple { /* 波纹扩散 */ }
@keyframes bounceScale { /* 弹性缩放 */ }
@keyframes gradientFlow { /* 渐变流动 */ }
@keyframes wiggle { /* 微摇晃 */ }
```

### 6.4 Framer Motion配合策略

**分工明确**：
- **CSS动画** - 简单、重复动画（Hover、无限循环）
- **Framer Motion** - 复杂编排、手势交互、页面过渡

---

## 七、组件样式规范

### 7.1 按钮系统

```css
/* 主按钮 - 焦糖金渐变 */
.btn-primary {
  background: var(--gradient-btn-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-6);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 次按钮 - 白色描边 */
.btn-secondary {
  background: white;
  border: 2px solid var(--color-border-primary);
}

/* 成功/危险按钮 */
.btn-success { background: var(--gradient-btn-success); }
.btn-danger { background: var(--gradient-btn-danger); }

/* 尺寸变体 */
.btn-sm { padding: var(--space-2) var(--space-4); }
.btn-lg { padding: var(--space-4) var(--space-8); }
```

### 7.2 卡片系统

```css
/* 玻璃态卡片（主要） */
.card-glass {
  background: var(--gradient-glass-light);
  backdrop-filter: blur(16px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

.card-glass:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 实色/边框卡片 */
.card-solid { background: white; }
.card-outlined { border: 2px solid var(--color-border-primary); }

/* 激活状态 */
.card-active {
  border-color: var(--color-caramel-gold);
  box-shadow: var(--shadow-lg), var(--glow-money);
}
```

### 7.3 表单元素

```css
.input {
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
}

.input:focus {
  border-color: var(--color-caramel-gold);
  box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.2);
}
```

---

## 八、响应式设计

### 8.1 断点定义

```css
:root {
  --breakpoint-sm: 576px;    /* 手机横屏 */
  --breakpoint-md: 768px;    /* 平板竖屏 */
  --breakpoint-lg: 992px;    /* 平板横屏 */
  --breakpoint-xl: 1200px;   /* 小桌面 */
}
```

### 8.2 移动端适配要点

```css
@media (max-width: 767px) {
  /* 单列布局 */
  .game-layout { grid-template-columns: 1fr; }

  /* 横向滚动Tab */
  .decision-tabs { overflow-x: auto; }

  /* 缩小字体 */
  :root {
    --text-h1: 32px;
    --text-body: 14px;
  }

  /* 按钮全宽 */
  .btn-primary { width: 100%; }

  /* Modal全屏 */
  .modal { width: 100%; border-radius: 0; }

  /* 增大点击区域 */
  .btn-primary { min-height: 48px; }
}
```

---

## 九、CSS重构计划

### 9.1 内联样式迁移（278处→<100处）

**策略**：
1. 识别重复的内联样式模式
2. 创建可复用CSS类
3. 逐组件迁移
4. 仅保留动态计算的样式

```tsx
// ❌ 静态内联
<div style={{ padding: '24px', borderRadius: '16px' }}>

// ✅ 改为CSS类
<div className="card-glass">

// ✅ 动态样式保留
<div style={{ width: `${percentage}%` }}>
```

### 9.2 文件结构重构

**删除/废弃（3个）**：
```
frontend/src/styles/pixel.css    # 废弃，改为utilities.css
frontend/src/styles/theme.css    # 合并到variables.css
```

**新建文件（6个）**：
```
frontend/src/styles/variables.css    # 所有CSS变量
frontend/src/styles/base.css         # 全局重置
frontend/src/styles/utilities.css    # 工具类
frontend/src/styles/components.css   # 组件样式
frontend/src/styles/animations.css   # 精简动画（覆盖）
frontend/src/styles/responsive.css   # 响应式
```

**导入顺序**（main.tsx）：
```tsx
import './styles/variables.css';
import './styles/base.css';
import './styles/utilities.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/responsive.css';
```

### 9.3 工具类库（参考Tailwind）

```css
/* utilities.css - 新增~200行 */

/* 间距 */
.p-0, .p-1, .p-2, .p-4, .p-6, .p-8
.px-4, .py-4, .m-4, .mx-4, .my-4

/* 文本 */
.text-primary, .text-secondary, .text-success
.text-sm, .text-base, .text-lg
.font-normal, .font-semibold, .font-bold

/* 布局 */
.flex, .flex-col, .items-center, .justify-between
.gap-2, .gap-4, .grid, .grid-cols-2

/* 背景 */
.bg-white, .bg-primary, .bg-glass

/* 圆角/阴影 */
.rounded-sm, .rounded-lg, .rounded-full
.shadow-sm, .shadow-md, .shadow-lg

/* 过渡 */
.transition, .hover-lift, .hover-scale
```

### 9.4 Ant Design定制更新

**App.tsx theme配置**：
```tsx
const theme = {
  token: {
    colorPrimary: '#D4A574',      // 焦糖金
    colorSuccess: '#7ED957',      // 抹茶绿
    colorWarning: '#FFB648',      // 芒果黄
    colorError: '#FF6B6B',        // 草莓红

    borderRadius: 12,
    borderRadiusLG: 16,

    fontFamily: "'Nunito', 'HarmonyOS Sans SC', sans-serif",
    fontSize: 16,

    boxShadow: '0 2px 8px rgba(44, 24, 16, 0.08)',
  },

  components: {
    Button: { borderRadius: 8, controlHeight: 40 },
    Card: { borderRadius: 16 },
    Modal: { borderRadius: 24 },
  },
};
```

---

## 十、实施优先级（4个Phase）

### Phase 1: 基础设计系统（1-2周）

**目标**：建立设计token体系

**任务**：
1. 创建 `variables.css` - 定义所有CSS变量
2. 更新 `App.tsx` - Ant Design theme配置
3. 创建 `utilities.css` - 基础工具类
4. 迁移高频组件（DecisionPanel, PlayerList, GameHeader）

**验收**：
- [ ] CSS变量定义完成
- [ ] Ant Design主题同步
- [ ] 至少3个组件迁移完成
- [ ] 无视觉回归

### Phase 2: 组件样式改造（2-3周）

**目标**：统一所有组件为现代可爱风

**任务**：
1. **Lobby页改造** - 移除NES.css，改为玻璃态
2. **游戏页组件** - 12个组件统一样式
3. **Modal组件** - 圆角渐变头部
4. **移除Press Start 2P** - 改为Nunito

**验收**：
- [ ] 全站视觉统一
- [ ] 无像素风残留
- [ ] 内联样式<100处
- [ ] 移动端适配良好

### Phase 3: 动画与交互（1-2周）

**目标**：提升交互流畅度

**任务**：
1. 精简 `animations.css`（移除像素风，新增6-8个）
2. Framer Motion编排（列表Stagger、Modal、金钱跳动）
3. Hover/Active反馈（抬升、阴影、ripple）
4. 状态过渡动画

**验收**：
- [ ] animations.css<300行
- [ ] 所有交互有反馈
- [ ] 无性能问题
- [ ] 缓动曲线统一

### Phase 4: 响应式与细节（1周）

**目标**：完善移动端体验

**任务**：
1. 移动端适配（单列、横滚、全屏Modal）
2. 平板端优化（双列）
3. 可访问性（focus样式、对比度）
4. 性能优化（硬件加速）

**验收**：
- [ ] 移动/平板测试通过
- [ ] 键盘导航可用
- [ ] Lighthouse>90
- [ ] 无视觉bug

---

## 十一、关键设计Token速查表

| 类别 | Token | 值 | 用途 |
|------|-------|-----|------|
| 主色 | --color-pearl-black | #2C1810 | 主文字 |
| 主色 | --color-caramel-gold | #D4A574 | 强调/金钱 |
| 状态 | --color-success | #7ED957 | 成功 |
| 产品 | --product-milktea | #A5865C | 奶茶色 |
| 字体 | --font-primary | Nunito | 正文 |
| 字阶 | --text-h1 | 40px | 标题 |
| 间距 | --space-4 | 16px | 标准 |
| 圆角 | --radius-lg | 16px | 卡片 |
| 阴影 | --shadow-md | 0 4px 16px... | 卡片 |

---

## 十二、需要修改的关键文件

### 核心配置（4个）
```
frontend/src/App.tsx              # Ant Design theme配置
frontend/src/main.tsx             # CSS导入顺序
frontend/package.json             # 移除nes.css依赖
```

### 页面（4个）
```
frontend/src/pages/Lobby.tsx      # 移除NES.css → 玻璃态
frontend/src/pages/Room.tsx       # 统一可爱风
frontend/src/pages/Game.tsx       # 更新布局
```

### 游戏组件（12个）
```
frontend/src/components/game/DecisionPanel.tsx
frontend/src/components/game/GameHeader.tsx
frontend/src/components/game/PlayerList.tsx
frontend/src/components/game/ShopDecision.tsx
frontend/src/components/game/EmployeeManagement.tsx
frontend/src/components/game/MarketAction.tsx
frontend/src/components/game/ProductResearch.tsx
frontend/src/components/game/ProductionPlan.tsx
frontend/src/components/game/RoundSummary.tsx
frontend/src/components/game/GameEnd.tsx
...
```

### 样式文件（6个新建）
```
frontend/src/styles/variables.css    # 所有变量（新建）
frontend/src/styles/base.css         # 全局重置（新建）
frontend/src/styles/utilities.css    # 工具类（新建，替代pixel.css）
frontend/src/styles/components.css   # 组件样式（新建）
frontend/src/styles/animations.css   # 精简动画（覆盖）
frontend/src/styles/responsive.css   # 响应式（新建）
```

---

## 十三、实施建议

### 版本控制
```bash
# Feature Branch工作流
main
└─ feature/design-system-v2
    ├─ phase-1/foundation
    ├─ phase-2/components
    ├─ phase-3/animations
    └─ phase-4/responsive
```

### 测试策略
- **视觉回归测试** - Percy/Chromatic对比截图
- **性能监控** - FCP<1.5s, LCP<2.5s, CLS<0.1
- **浏览器兼容** - Chrome/Firefox/Safari/Edge 最新版
- **移动端测试** - iOS Safari 14+, Android Chrome 90+

### Code Review检查点
- [ ] 无硬编码颜色值（使用CSS变量）
- [ ] 无内联样式（除动态计算）
- [ ] 遵循间距scale（4px倍数）
- [ ] 遵循圆角规范
- [ ] 有Hover/Active反馈
- [ ] 移动端适配

---

## 附录：快速参考

### CSS变量使用示例

```css
/* ✅ 正确 */
.my-card {
  background: var(--gradient-glass-light);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

/* ❌ 错误（硬编码） */
.my-card {
  background: rgba(255,255,255,0.8);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
```

### 工具类组合示例

```tsx
// ✅ 使用工具类
<div className="flex items-center gap-4 p-6 bg-glass rounded-lg shadow-md">
  <div className="text-lg font-semibold text-primary">奶茶大作战</div>
  <button className="btn-primary hover-lift">开始游戏</button>
</div>

// ❌ 使用内联样式（避免）
<div style={{ display: 'flex', padding: '24px', ... }}>
```

---

## 预期成果

**视觉**：
- 全站统一现代可爱风格
- 珍珠奶茶配色高识别度
- 玻璃态+圆角现代感

**可维护性**：
- CSS变量 + 工具类体系
- 内联样式减少70%+
- 组件样式复用率提升

**用户体验**：
- 动画流畅，微交互及时
- 响应式适配良好
- 可访问性增强

**开发效率**：
- 工具类快速组合
- 设计token一处修改全局生效
- 组件库与自定义样式统一
