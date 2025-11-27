修复游戏第10回合结束Bug

 问题描述

 游戏进行到第10回合后，不会结束游戏，还会尝试进入第11回合。预期行为应该是：
 - 第10回合客流量计算结束后
 - 点击"继续"应该跳转到结束页面
 - 结束页面展示各个玩家每回合的收入

 Bug分析

 后端逻辑（正常工作）

 文件: backend/app/services/round_service.py (82-85行)

 game_finished = False
 if game.current_round > GameConstants.TOTAL_ROUNDS:
     game.status = 'finished'
     game_finished = True

 后端逻辑正确：
 - 当回合数超过10时，将game.status设为'finished'
 - 返回game_finished标志

 前端Bug（问题所在）

 问题根源: 前端在第10回合结束后，没有正确处理游戏结束逻辑

 Bug位置1: RoundSettlement.tsx

 文件: frontend/src/components/game/RoundSettlement.tsx

 这是回合结算后显示的弹窗。当用户点击"继续游戏"按钮时：
 - 调用 onClose() 回调
 - 父组件（Game.tsx）收到回调后重新加载游戏状态
 - 问题: 没有检查当前是否是第10回合

 Bug位置2: Game.tsx 的 handleNextRound

 文件: frontend/src/pages/Game.tsx (211-219行)

 const handleNextRound = () => {
   setRoundPhase('planning');
   setSummaryVisible(false);
   setRoundLocked(false);
   setWaitingForPlayers(false);
   loadLatestState();
 };

 问题:
 - 这个函数被回合结算弹窗关闭时调用
 - 它直接将阶段设为'planning'，而不检查游戏是否已结束
 - 虽然loadLatestState()会检测到status为'finished'，但时机可能有问题

 Bug位置3: 缺少最后回合的特殊处理

 当第10回合结束时：
 1. 所有玩家提交生产计划 ✓
 2. 调用 advanceRound API ✓
 3. 后端将current_round设为11，status设为'finished' ✓
 4. 前端显示RoundSettlement弹窗 ✓
 5. 问题: 用户点击"继续"时，应该直接跳转到GameEnd页面，而不是尝试进入第11回合

 解决方案

 方案概述

 在回合结算后检测是否为第10回合，如果是则直接跳转到游戏结束页面，而不是尝试进入下一回合。

 实施步骤

 步骤1: 修改RoundSettlement组件

 文件: frontend/src/components/game/RoundSettlement.tsx

 修改点:
 - 接收当前回合号作为prop
 - 检测是否为第10回合
 - 如果是第10回合，修改按钮文本为"查看结果"而不是"继续游戏"
 - 调用不同的回调函数

 修改代码:

 interface RoundSettlementProps {
   visible: boolean;
   roundNumber: number;  // 新增：当前回合号
   onClose: () => void;
   // ... 其他props
 }

 export const RoundSettlement: React.FC<RoundSettlementProps> = ({
   visible,
   roundNumber,
   onClose,
   // ...
 }) => {
   const { t } = useTranslation();
   const isLastRound = roundNumber === 10;  // 检测是否最后回合

   return (
     <Modal
       // ...
       footer={[
         <Button
           key="continue"
           type="primary"
           onClick={onClose}
         >
           {isLastRound ? t('game.settlement.viewResults') : t('game.settlement.continue')}
         </Button>
       ]}
     >
       {/* ... */}
     </Modal>
   );
 };

 步骤2: 修改Game.tsx的handleNextRound

 文件: frontend/src/pages/Game.tsx

 修改点:
 - 在调用handleNextRound之前检查回合数
 - 如果是第10回合，设置roundPhase为'finished'而不是'planning'

 修改代码 (在211-219行附近):

 const handleNextRound = () => {
   // 检查是否是最后回合
   if (game && game.current_round > TOTAL_ROUNDS) {
     setRoundPhase('finished');
     setSummaryVisible(false);
     setRoundLocked(true);
     return;
   }

   setRoundPhase('planning');
   setSummaryVisible(false);
   setRoundLocked(false);
   setWaitingForPlayers(false);
   loadLatestState();
 };

 步骤3: 确保loadLatestState正确处理finished状态

 文件: frontend/src/pages/Game.tsx (141-146行)

 这段代码已经存在，确保它正常工作：

 if (gameResp.data.status === 'finished') {
   setRoundPhase('finished');
   setSummaryVisible(true);
   setRoundLocked(true);
   setWaitingForPlayers(false);
 }

 步骤4: 改进GameEnd组件显示每回合收入

 文件: frontend/src/components/game/GameEnd.tsx

 当前GameEnd组件只显示最终排名和总现金。需要增强它来显示每回合的收入。

 需要的数据: 调用finance API获取所有玩家所有回合的财务记录

 修改后的组件结构:

 export const GameEnd: React.FC<GameEndProps> = ({ players, onBackToLobby }) => {
   const [financeData, setFinanceData] = useState<Record<number, FinanceRecord[]>>({});
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     // 加载所有玩家的财务记录
     const loadFinanceData = async () => {
       const data: Record<number, FinanceRecord[]> = {};

       for (const player of players) {
         try {
           const resp = await financeApi.getAllRecords(player.id);
           if (resp.success && resp.data) {
             data[player.id] = resp.data;
           }
         } catch (error) {
           console.error(`Failed to load finance for player ${player.id}`, error);
         }
       }

       setFinanceData(data);
       setLoading(false);
     };

     loadFinanceData();
   }, [players]);

   // 准备表格数据
   const tableData = players.map(player => {
     const records = financeData[player.id] || [];
     const roundRevenues: Record<number, number> = {};

     records.forEach(record => {
       roundRevenues[record.round_number] = record.revenue?.total || 0;
     });

     return {
       player_name: player.nickname,
       total_cash: player.cash,
       round_revenues: roundRevenues,
       cumulative_profit: records[records.length - 1]?.profit?.cumulative || 0
     };
   });

   // 按累计利润排序
   tableData.sort((a, b) => b.cumulative_profit - a.cumulative_profit);

   return (
     <div className="game-end-container">
       <Title level={2}>游戏结束</Title>

       {loading ? (
         <Spin />
       ) : (
         <Table
           dataSource={tableData}
           pagination={false}
           columns={[
             { title: '排名', render: (_, __, index) => index + 1 },
             { title: '玩家', dataIndex: 'player_name' },
             ...Array.from({ length: 10 }, (_, i) => ({
               title: `第${i + 1}回合`,
               dataIndex: ['round_revenues', i + 1],
               render: (val: number) => `${val || 0}元`
             })),
             {
               title: '累计利润',
               dataIndex: 'cumulative_profit',
               render: (val: number) => (
                 <Text strong style={{ color: val >= 0 ? 'green' : 'red' }}>
                   {val}元
                 </Text>
               )
             },
             {
               title: '最终现金',
               dataIndex: 'total_cash',
               render: (val: number) => `${val}元`
             }
           ]}
         />
       )}

       <Button type="primary" onClick={onBackToLobby} style={{ marginTop: 24 }}>
         返回大厅
       </Button>
     </div>
   );
 };

 步骤5: 添加i18n翻译

 文件: frontend/src/locales/zh-CN.ts

 在game.settlement部分添加：

 settlement: {
   continue: '继续游戏',
   viewResults: '查看结果',
   // ...
 }

 文件: frontend/src/locales/en-US.ts

 settlement: {
   continue: 'Continue',
   viewResults: 'View Results',
   // ...
 }

 实施优先级

 高优先级（必须修复）

 1. 修改Game.tsx的handleNextRound - 核心bug修复
 2. 修改RoundSettlement组件 - 添加最后回合检测
 3. 测试: 完整游戏流程到第10回合

 中优先级（功能增强）

 4. 改进GameEnd组件 - 显示每回合收入表格
 5. 添加i18n翻译

 低优先级（可选）

 6. 添加动画效果（胜利特效等）
 7. 导出报表功能

 关键文件清单

 必须修改的文件

 1. frontend/src/pages/Game.tsx - 修复handleNextRound逻辑
 2. frontend/src/components/game/RoundSettlement.tsx - 添加最后回合检测
 3. frontend/src/components/game/GameEnd.tsx - 增强显示每回合收入

 需要更新的文件

 4. frontend/src/locales/zh-CN.ts - 添加翻译
 5. frontend/src/locales/en-US.ts - 添加翻译

 测试计划

 测试场景1: 正常游戏流程

 1. 创建游戏，4个玩家加入
 2. 进行9个回合
 3. 在第10回合：
   - 所有玩家提交生产计划 ✓
   - 回合结算弹窗显示 ✓
   - 按钮显示"查看结果"而不是"继续游戏" ✓
   - 点击后跳转到GameEnd页面 ✓
 4. GameEnd页面显示：
   - 玩家排名 ✓
   - 每回合收入（10列） ✓
   - 累计利润 ✓
   - 最终现金 ✓

 测试场景2: 边缘情况

 1. 只有2个玩家的游戏
 2. 有玩家中途退出的游戏
 3. 第10回合有玩家未提交（不应该发生，但要确保不崩溃）

 风险与注意事项

 1. 数据加载性能: GameEnd组件需要加载所有玩家所有回合的数据，如果玩家多可能较慢
   - 解决：添加loading状态，显示加载动画
 2. 后端API限制: 确保finance API支持批量查询
   - 当前使用getAllRecords(playerId)，需要循环调用
   - 未来可优化为单个API调用返回所有玩家数据
 3. 状态同步: 确保在回合结算弹窗关闭后，状态正确更新
   - 使用useEffect监听roundPhase变化
   - 确保finished状态优先级最高

 预期成果

 修复后的游戏流程：
 1. 第10回合结束后，不会尝试进入第11回合 ✓
 2. 回合结算弹窗显示"查看结果"按钮 ✓
 3. 点击后直接跳转到游戏结束页面 ✓
 4. 结束页面显示完整的每回合收入数据 ✓
 5. 玩家可以返回大厅开始新游戏 ✓