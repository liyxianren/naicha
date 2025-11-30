# 奶茶大作战 - 中英文切换功能实施计划

## 一、方案概述

基于用户需求，我们将实现一个**轻量级的自定义国际化方案**：
- **语言切换位置**：仅在 GameHeader 组件中显示
- **技术方案**：自定义轻量方案（无需 react-i18next）
- **作用范围**：仅前端国际化
- **翻译内容**：由 Claude 提供机器翻译

**预估工作量**：8-9 小时
**涉及文本数量**：约 400-550 个翻译条目

---

## 二、技术架构

### 2.1 核心组件

```

frontend/src/
├── stores/languageStore.ts      # Zustand 语言状态管理 + localStorage 持久化
├── hooks/useTranslation.ts      # 翻译 Hook，提供 t() 函数
├── locales/
│   ├── index.ts                 # 导出所有语言
│   ├── types.ts                 # TypeScript 类型定义
│   ├── zh-CN.ts                 # 中文翻译（400-500 行）
│   └── en-US.ts                 # 英文翻译（400-500 行）
```

### 2.2 翻译文件结构

按模块组织翻译键：
```typescript
{
  common: { confirm, cancel, submit, ... },
  auth: { title, nickname, login, ... },
  lobby: { createRoom, joinRoom, ... },
  game: {
    steps: { shop, employees, market, research, production },
    shop: { title, openShop, rent, ... },
    employees: { title, hire, fire, ... },
    market: { advertisement, research, ... },
    production: { title, plan, submit, ... },
    // ...
  },
  messages: {
    success: { loginSuccess, roomCreated, ... },
    error: { loginFailed, insufficientCash, ... },
    warning: { pleaseEnterNickname, ... }
  }
}
```

### 2.3 翻译函数特性

- ✅ 嵌套键支持：`t('game.shop.title')`
- ✅ 模板字符串：`t('lobby.currentNickname', { nickname: '张三' })`
- ✅ 类型安全：TypeScript 自动补全翻译键
- ✅ 缺失警告：开发环境显示缺失翻译的警告

---

## 三、实施步骤

### 阶段 1：搭建基础设施（1.5 小时）

#### 1.1 创建核心文件

**新建文件：**
1. `frontend/src/stores/languageStore.ts`
   - 使用 Zustand + persist 中间件
   - 支持 localStorage 持久化
   - 默认语言：浏览器语言 or 中文

2. `frontend/src/hooks/useTranslation.ts`
   - 实现 `t(key, params)` 函数
   - 支持嵌套键和模板字符串替换

3. `frontend/src/locales/` 目录
   - `index.ts` - 导出翻译
   - `types.ts` - 类型定义
   - `zh-CN.ts` - 中文翻译（先创建架构）
   - `en-US.ts` - 英文翻译（先创建架构）

#### 1.2 集成 Ant Design 多语言

修改 **`frontend/src/App.tsx`**：
```typescript
import { useLanguageStore } from './stores/languageStore';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

function App() {
  const language = useLanguageStore((state) => state.language);
  const antdLocale = language === 'zh-CN' ? zhCN : enUS;

  return (
    <ConfigProvider locale={antdLocale} theme={theme}>
      {/* ... */}
    </ConfigProvider>
  );
}
```

#### 1.3 添加语言切换按钮

修改 **`frontend/src/components/game/GameHeader.tsx`**：
- 右上角添加语言切换按钮（Globe 图标）
- 显示当前语言：中文时显示 "EN"，英文时显示 "中文"
- 点击切换语言

---

### 阶段 2：提取和翻译文本（2 小时）

#### 2.1 按模块提取中文文本

**优先级顺序：**
1. auth 模块（Login.tsx）- ~10 条
2. lobby 模块（Lobby.tsx）- ~15 条
3. room 模块（Room.tsx）- ~12 条
4. game 核心（Game.tsx, GameHeader.tsx, PlayerList.tsx）- ~30 条
5. 决策模块（DecisionPanel.tsx）- ~10 条
6. 商店决策（ShopDecision.tsx）- ~25 条
7. 员工管理（EmployeeManagement.tsx）- ~30 条
8. 市场行动（MarketAction.tsx）- ~20 条
9. 产品研发（ProductResearch.tsx）- ~25 条
10. 生产计划（ProductionPlan.tsx）- ~40 条
11. 回合结算（RoundSummary.tsx, RoundSettlement.tsx）- ~30 条
12. 游戏结束（GameEnd.tsx）- ~10 条

#### 2.2 构建完整翻译字典

**关键翻译示例：**

| 模块 | 中文 | 英文 | 翻译键 |
|------|------|------|--------|
| 通用 | 确认 | Confirm | common.confirm |
| 通用 | 取消 | Cancel | common.cancel |
| 登录 | 奶茶大战 | Milk Tea Battle | auth.title |
| 登录 | 进入大厅 | Enter Lobby | auth.enterLobby |
| 游戏 | 第{{round}} / {{total}}回合 | Round {{round}} / {{total}} | game.roundProgress |
| 商店 | 开设门店 | Open Shop | game.shop.openShop |
| 员工 | 员工管理 | Employee Management | game.employees.title |
| 市场 | 投放广告 | Advertisement | game.market.advertisement |
| 消息 | 登录成功 | Login successful | messages.success.loginSuccess |

**完整翻译对照表见方案附录**

---

### 阶段 3：迁移硬编码文本（3.5 小时）

#### 3.1 迁移页面级组件（4 个文件）

**修改文件：**
1. `frontend/src/pages/Login.tsx`
2. `frontend/src/pages/Lobby.tsx`
3. `frontend/src/pages/Room.tsx`
4. `frontend/src/pages/Game.tsx`

**迁移模式：**
```typescript
// 迁移前
<Title level={2}>奶茶大战</Title>
<Input placeholder="取一个好听的昵称吧" />
message.success('登录成功');

// 迁移后
const { t } = useTranslation();

<Title level={2}>{t('auth.title')}</Title>
<Input placeholder={t('auth.nicknamePlaceholder')} />
message.success(t('messages.success.loginSuccess'));
```

#### 3.2 迁移游戏组件（11 个文件）

**修改文件：**
1. `frontend/src/components/game/GameHeader.tsx` ⭐
2. `frontend/src/components/game/PlayerList.tsx`
3. `frontend/src/components/game/DecisionPanel.tsx`
4. `frontend/src/components/game/ShopDecision.tsx`
5. `frontend/src/components/game/EmployeeManagement.tsx`
6. `frontend/src/components/game/MarketAction.tsx`
7. `frontend/src/components/game/ProductResearch.tsx`
8. `frontend/src/components/game/ProductionPlan.tsx`
9. `frontend/src/components/game/RoundSummary.tsx`
10. `frontend/src/components/game/RoundSettlement.tsx`
11. `frontend/src/components/game/GameEnd.tsx`

**每个组件的修改步骤：**
1. 导入 `useTranslation` Hook
2. 调用 `const { t } = useTranslation();`
3. 替换所有硬编码文本为 `t('key')`
4. 模板字符串使用 `t('key', { var: value })`

#### 3.3 处理动态文本

**模板字符串示例：**
```typescript
// 翻译文件
zh-CN: { currentNickname: '当前登录昵称：{{nickname}}' }
en-US: { currentNickname: 'Current Nickname: {{nickname}}' }

// 组件中使用
t('lobby.currentNickname', { nickname: '张三' })
// 中文输出："当前登录昵称：张三"
// 英文输出："Current Nickname: Zhang San"
```

**消息提示统一处理：**
```typescript
// 创建辅助函数（可选）
const msg = {
  success: (key: string, params?: any) =>
    message.success(t(`messages.success.${key}`, params)),
  error: (key: string, params?: any) =>
    message.error(t(`messages.error.${key}`, params)),
};

// 使用
msg.success('loginSuccess');
msg.error('insufficientCash');
```

---

### 阶段 4：测试和优化（1.5 小时）

#### 4.1 功能测试清单

- [ ] 语言切换立即生效（无需刷新页面）
- [ ] Ant Design 组件（日期选择、分页等）语言正确
- [ ] 所有页面文本均已翻译
- [ ] 模板字符串变量正确替换
- [ ] 错误提示语言正确
- [ ] localStorage 持久化有效
- [ ] 刷新页面保持语言选择
- [ ] 未翻译的键显示警告（开发环境）

#### 4.2 边界情况处理

1. **翻译缺失**：显示翻译键，开发环境 console.warn
2. **后端错误消息**：保留原样（后端暂不支持国际化）
3. **长文本溢出**：使用 `text-overflow: ellipsis` 或 Tooltip

#### 4.3 性能优化

- `useTranslation` 内部使用 `useMemo` 缓存
- 语言切换避免不必要的组件重渲染
- 考虑 `React.memo` 包裹大型组件

---

## 四、关键技术点

### 4.1 languageStore.ts 实现

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'zh-CN' | 'en-US';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const getBrowserLanguage = (): Language => {
  const browserLang = navigator.language || navigator.languages?.[0];
  return browserLang?.startsWith('zh') ? 'zh-CN' : 'en-US';
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: getBrowserLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'mt-language' }
  )
);
```

### 4.2 useTranslation Hook 实现

```typescript
import { useMemo } from 'react';
import { useLanguageStore } from '../stores/languageStore';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';

const translations = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, any>): string => {
      const keys = key.split('.');
      let value: any = translations[language];

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          if (import.meta.env.DEV) {
            console.warn(`[i18n] Missing: ${key} [${language}]`);
          }
          return key;
        }
      }

      // 模板字符串替换 {{variable}}
      if (typeof value === 'string' && params) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, p1) =>
          params[p1] !== undefined ? String(params[p1]) : `{{${p1}}}`
        );
      }

      return typeof value === 'string' ? value : key;
    };
  }, [language]);

  return { t, language };
}
```

### 4.3 GameHeader 语言切换按钮

```typescript
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguageStore } from '../../stores/languageStore';
import { useTranslation } from '../../hooks/useTranslation';

export const GameHeader: React.FC<GameHeaderProps> = ({ game, player }) => {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* 左侧内容 */}
        <div>...</div>

        {/* 右侧：语言切换 + 资金显示 */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Button
            icon={<GlobalOutlined />}
            onClick={toggleLanguage}
            size="small"
            type="text"
          >
            {language === 'zh-CN' ? 'EN' : '中文'}
          </Button>

          <div>
            <Text type="secondary">{t('game.yourCash')}</Text>
            <div>💰 ¥{player.cash.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
```

---

## 五、需要修改的文件清单

### 新建文件（7 个）

1. ✨ `frontend/src/stores/languageStore.ts` - 语言状态管理（30 行）
2. ✨ `frontend/src/hooks/useTranslation.ts` - 翻译 Hook（40 行）
3. ✨ `frontend/src/locales/index.ts` - 导出翻译（10 行）
4. ✨ `frontend/src/locales/types.ts` - 类型定义（50 行）
5. ✨ `frontend/src/locales/zh-CN.ts` - 中文翻译（400-500 行）
6. ✨ `frontend/src/locales/en-US.ts` - 英文翻译（400-500 行）
7. ✨ `frontend/src/utils/messageHelper.ts` - 消息辅助函数（可选，40 行）

### 需要修改的文件（16 个）

#### 核心配置（1 个）
1. `frontend/src/App.tsx` - 添加动态 locale 切换（~10 行修改）

#### 页面组件（4 个）
2. `frontend/src/pages/Login.tsx` - 替换文本（~20 行修改）
3. `frontend/src/pages/Lobby.tsx` - 替换文本（~30 行修改）
4. `frontend/src/pages/Room.tsx` - 替换文本（~25 行修改）
5. `frontend/src/pages/Game.tsx` - 替换文本（~40 行修改）

#### 游戏组件（11 个）
6. `frontend/src/components/game/GameHeader.tsx` ⭐ - 添加按钮 + 替换文本（~25 行修改）
7. `frontend/src/components/game/PlayerList.tsx` - 替换文本（~12 行修改）
8. `frontend/src/components/game/DecisionPanel.tsx` - 替换文本（~15 行修改）
9. `frontend/src/components/game/ShopDecision.tsx` - 替换文本（~40 行修改）
10. `frontend/src/components/game/EmployeeManagement.tsx` - 替换文本（~45 行修改）
11. `frontend/src/components/game/MarketAction.tsx` - 替换文本（~35 行修改）
12. `frontend/src/components/game/ProductResearch.tsx` - 替换文本（~35 行修改）
13. `frontend/src/components/game/ProductionPlan.tsx` - 替换文本（~60 行修改）
14. `frontend/src/components/game/RoundSummary.tsx` - 替换文本（~18 行修改）
15. `frontend/src/components/game/RoundSettlement.tsx` - 替换文本（~28 行修改）
16. `frontend/src/components/game/GameEnd.tsx` - 替换文本（~15 行修改）

**总计**：7 个新文件 + 16 个修改文件 = 23 个文件

---

## 六、风险点和缓解措施

### 6.1 类型安全问题

**风险**：翻译键拼写错误在运行时才发现

**缓解措施**：
- 在 `locales/types.ts` 中定义所有翻译键的类型
- 修改 `t()` 函数签名使用 TypeScript 联合类型
- 利用 IDE 自动补全避免拼写错误

### 6.2 性能问题

**风险**：语言切换触发大量组件重渲染

**缓解措施**：
- `useTranslation` 内部使用 `useMemo` 缓存
- 对大型组件使用 `React.memo`
- Zustand selector 精确订阅

### 6.3 UI 布局问题

**风险**：英文文本长度导致按钮、标签溢出

**缓解措施**：
- 关键位置使用 `text-overflow: ellipsis`
- 长文本使用 Tooltip 显示完整内容
- 测试英文场景下的 UI 表现

### 6.4 后端兼容性

**风险**：后端返回的中文错误消息无法翻译

**缓解措施**：
- 前端识别常见错误文本，映射到翻译键
- 保留原始后端消息作为 fallback
- 长期计划：后端返回错误码而非文本

---

## 七、验收标准

### 功能验收
- ✅ 语言切换按钮仅在 GameHeader 显示
- ✅ 点击按钮立即切换中英文（无需刷新）
- ✅ 所有 UI 文本、消息提示均已翻译
- ✅ 刷新页面保持语言选择
- ✅ Ant Design 组件语言正确

### 质量验收
- ✅ 无硬编码中文/英文文本
- ✅ 翻译键命名规范（模块.类别.键）
- ✅ 长文本无 UI 溢出
- ✅ 控制台无翻译缺失警告（生产环境）
- ✅ TypeScript 类型检查通过

### 性能验收
- ✅ 语言切换响应时间 < 100ms
- ✅ 无明显卡顿或闪烁
- ✅ 首次加载无额外延迟

---

## 八、实施顺序

**推荐实施顺序：**

1. **阶段 1**（基础设施）→ 可立即测试语言切换功能
2. **阶段 2**（翻译文本）→ 构建完整翻译字典
3. **阶段 3.1**（页面组件）→ 优先迁移 Login/Lobby/Game
4. **阶段 3.2**（游戏组件）→ 按优先级逐个迁移
5. **阶段 4**（测试优化）→ 全面测试和调优

**每个阶段完成后都应进行测试，确保功能正常再进入下一阶段。**

---

## 九、关键游戏术语翻译标准

| 中文 | 英文 | 说明 |
|------|------|------|
| 圈粉率 | Fan Attraction Rate | 产品吸引粉丝的能力 |
| 口碑分 | Reputation Score | 口碑评分 |
| 生产力 | Productivity | 员工生产力 |
| 客流 | Customer Traffic | 客户流量 |
| 高端客流 | Premium Traffic | 高消费客户 |
| 低端客流 | Budget Traffic | 价格敏感客户 |
| 装修等级 | Decoration Level | 店铺装修档次 |
| 回合结算 | Round Settlement | 回合财务结算 |
| 市场调研 | Market Research | 市场调查 |
| 广告投放 | Advertisement | 投放广告 |

---

## 十、后续扩展建议

1. **产品名称国际化**：后端返回产品 ID，前端映射到翻译
2. **错误码国际化**：后端返回错误码，前端映射到具体文本
3. **动态语言包加载**：使用 React.lazy 按需加载翻译文件
4. **日期/数字格式化**：集成 Intl API 支持地区格式
5. **多语言 CMS**：使用内容管理系统管理翻译

---

## 附录：完整翻译对照表

完整的中英文翻译对照表（400-500 条）将在实施阶段提供，包含以下模块的所有文本：

- **common**（通用）：确认、取消、提交等
- **auth**（登录）：登录、昵称、进入大厅等
- **lobby**（大厅）：创建房间、加入房间、房间列表等
- **room**（房间）：准备、开始游戏、玩家列表等
- **game**（游戏）：
  - steps（决策步骤）
  - shop（商店决策）
  - employees（员工管理）
  - market（市场行动）
  - research（产品研发）
  - production（生产计划）
  - settlement（回合结算）
  - end（游戏结束）
- **messages**（消息）：
  - success（成功消息）
  - error（错误消息）
  - warning（警告消息）
  - info（信息消息）

---

**计划制定完成时间**：2025-11-26
**预计实施时间**：8-9 小时
**方案优势**：轻量、灵活、易维护、无第三方库依赖
