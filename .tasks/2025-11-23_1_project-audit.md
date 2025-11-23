
## 初始分析
- 确认项目为 React + Flask 架构。
- 发现潜在问题：README 提及 SocketIO 但 main.py 中未见初始化。
- React 版本为 19.x，较为超前。
- 后端采用模块化结构 (Blueprints)。
## 深度分析
- 发现严重逻辑缺陷：CustomerFlowAllocator 在平局时使用 production_id 排序，违反
平分规则。
- 确认 SocketIO 未实现。
- 前端 Game.tsx 需要检查数据同步机制。
## 最终审计总结
1. **通信机制不匹配**：文档称 SocketIO，实际为 HTTP 轮询。
2. **算法公平性问题**：客流分配算法在平局时使用 ID 排序，违反公平原则。
3. **前端状态重置**：依赖页面刷新 (reload) 而非状态重置逻辑。
4. **React 版本风险**：使用 React 19 (Beta/RC)，可能存在兼容性隐患。
## Bug修复: 推进回合500错误
- 接口: POST /api/v1/rounds/{id}/advance
- 现象: 500 Internal Server Error
- 疑似原因: 结算逻辑崩溃(calculation_engine或round_service)
## 修复执行 (2025-11-23)
- [x] 修复 RoundService 中的 500 错误 (float NoneType)
- [x] 修复客流分配算法的不公平性 (引入随机洗牌)
- [x] 增强 Round API 的错误日志

