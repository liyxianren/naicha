import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Row, Col, Button, Space, Tag, Typography, Spin } from 'antd';
import {
  SendOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { gameApi, playerApi } from '../api';
import { useGameStore } from '../stores/gameStore';
import { useDecisionStore } from '../stores/decisionStore';
import { useGameRoundStore } from '../stores/gameRoundStore';
import { useSessionStore } from '../stores/sessionStore';
import { GameHeader } from '../components/game/GameHeader';
import { PlayerList } from '../components/game/PlayerList';
import { DecisionPanel, type DecisionStepMeta } from '../components/game/DecisionPanel';
import { ShopDecision } from '../components/game/ShopDecision';
import { EmployeeManagement } from '../components/game/EmployeeManagement';
import { MarketAction } from '../components/game/MarketAction';
import { ProductResearch } from '../components/game/ProductResearch';
import { ProductionPlan } from '../components/game/ProductionPlan';
import { RoundSummary } from '../components/game/RoundSummary';
import { GameEnd } from '../components/game/GameEnd';
import type { DecisionStepKey } from '../types';

const { Text } = Typography;

const TOTAL_ROUNDS = 10;

const decisionSteps: DecisionStepMeta[] = [
  { key: 'shop', title: '门店决策', emoji: '🏠', description: '选择位置和店铺装修' },
  { key: 'employees', title: '员工管理', emoji: '🧋', description: '招聘制茶师和服务员' },
  { key: 'market', title: '市场行动', emoji: '📣', description: '市场调研和广告投放' },
  { key: 'research', title: '产品研发', emoji: '🧪', description: '研究产品配方' },
  { key: 'production', title: '生产计划', emoji: '⚙️', description: '制定生产计划' },
];

const phaseTagMap: Record<string, { text: string; color: string }> = {
  planning: { text: '规划阶段', color: 'blue' },
  waiting: { text: '等待阶段', color: 'gold' },
  summary: { text: '回合结算', color: 'purple' },
  finished: { text: '游戏结束', color: 'red' },
};

export const Game: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const {
    currentGame,
    currentPlayer,
    players,
    setPlayers,
    setCurrentGame,
    setCurrentPlayer,
  } = useGameStore();
  const { hydrated } = useSessionStore();
  const {
    currentRound,
    setRoundInfo,
    roundPhase,
    setRoundPhase,
    isRoundLocked,
    setRoundLocked,
    isWaitingForPlayers,
    setWaitingForPlayers,
    submittingStep,
    setSubmittingStep,
  } = useDecisionStore();
  const {
    activeStep,
    setActiveStep,
    stepStatuses,
    setStepStatus,
    resetSteps,
    markWaitingForSummary,
    isSummaryVisible,
    setSummaryVisible,
  } = useGameRoundStore();
  const [pageLoading, setPageLoading] = useState(false);

  const gameId = currentGame?.id;
  const playerId = currentPlayer?.id;

  const handleBackToLobby = () => {
    navigate('/');
  };

  const loadLatestState = useCallback(async (opts: { withLoader?: boolean } = {}) => {
    if (!gameId || !playerId) {
      setPageLoading(false);
      return;
    }

    if (opts.withLoader) {
      setPageLoading(true);
    }

    try {
      const [gameResp, playersResp, playerResp] = await Promise.all([
        gameApi.getGame(gameId),
        gameApi.getGamePlayers(gameId),
        playerApi.getPlayer(playerId),
      ]);

      if (gameResp.success && gameResp.data) {
        setCurrentGame(gameResp.data);
        setRoundInfo(gameResp.data.current_round ?? 1, TOTAL_ROUNDS);

        if (gameResp.data.status === 'finished') {
          setRoundPhase('finished');
          setSummaryVisible(true);
          setRoundLocked(true);
          setWaitingForPlayers(false);
        }
      }

      if (playersResp.success && playersResp.data) {
        setPlayers(playersResp.data);
      }

      if (playerResp.success && playerResp.data) {
        setCurrentPlayer(playerResp.data);
      }
    } catch (error: any) {
      message.error(error?.error || '刷新游戏数据出错');
    } finally {
      setPageLoading(false);
    }
  }, [
    gameId,
    playerId,
    setCurrentGame,
    setPlayers,
    setCurrentPlayer,
    setRoundInfo,
    setRoundPhase,
    setSummaryVisible,
    setRoundLocked,
    setWaitingForPlayers,
  ]);

  useEffect(() => {
    if (!hydrated) return;

    if (!gameId || !playerId) {
      setPageLoading(false);
      navigate('/');
      return;
    }

    loadLatestState({ withLoader: true });
    const interval = setInterval(() => loadLatestState(), 5000);
    return () => clearInterval(interval);
  }, [hydrated, gameId, playerId, loadLatestState, navigate]);

  // 防御性：loading 超过 5 秒自动解除，避免遮罩卡死
  useEffect(() => {
    if (!pageLoading) return;
    const timer = setTimeout(() => setPageLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [pageLoading]);

  const handleSubmitDecisions = () => {
    if (isRoundLocked) {
      message.info('已经提交，等待回合结算');
      return;
    }

    // 提交所有决策，结束本回合
    // 不再绑定到某个具体步骤，而是提交整个回合的所有决策
    setSubmittingStep(null);

    // 标记所有步骤为已完成
    Object.keys(stepStatuses).forEach((key) => {
      setStepStatus(key as DecisionStepKey, 'completed');
    });

    setRoundLocked(true);
    setWaitingForPlayers(true);
    setRoundPhase('waiting');
    markWaitingForSummary();
    message.success('回合决策已提交，等待其他玩家完成决策');
  };

  const handleShowSummary = () => {
    setRoundPhase(roundPhase === 'finished' ? 'finished' : 'summary');
    setSummaryVisible(true);
    setWaitingForPlayers(false);
  };

  const handleNextRound = () => {
    setSummaryVisible(false);
    setRoundLocked(false);
    setWaitingForPlayers(false);
    setSubmittingStep(null);
    setRoundPhase('planning');
    resetSteps();
    loadLatestState();
  };

  const activeStepMeta = useMemo(
    () => decisionSteps.find((step) => step.key === activeStep),
    [activeStep],
  );

  const renderActivePanel = () => {
    switch (activeStep) {
      case 'shop':
        return <ShopDecision />;
      case 'employees':
        return <EmployeeManagement disabled={isRoundLocked} />;
      case 'market':
        return <MarketAction />;
      case 'research':
        return <ProductResearch />;
      case 'production':
        return <ProductionPlan />;
      default:
        return null;
    }
  };

  const currentPhase = phaseTagMap[roundPhase] ?? phaseTagMap.planning;
  const submitDisabled = isRoundLocked || roundPhase === 'finished';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        padding: '24px',
        background: '#f0f2f5',
        backgroundImage: 'radial-gradient(#e6f7ff 1px, transparent 1px), radial-gradient(#fff1f0 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
      }}
    >
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <Spin spinning={pageLoading} tip="加载中...">
          {currentGame && currentPlayer && (
            <GameHeader
              game={currentGame}
              player={currentPlayer}
              currentRound={currentRound}
            />
          )}

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={7}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <PlayerList players={players} currentPlayerId={currentPlayer?.id ?? 0} />
              </Space>
            </Col>
            <Col xs={24} lg={17}>
              <DecisionPanel
                steps={decisionSteps}
                activeStep={activeStep}
                stepStatuses={stepStatuses}
                onStepChange={(step: DecisionStepKey) => setActiveStep(step)}
                isRoundLocked={isRoundLocked}
              >
                {renderActivePanel()}
              </DecisionPanel>
            </Col>
          </Row>

          <div className="card-cute game-action-bar">
            <div>
              <Space size="large" wrap>
                <div>
                  <Text type="secondary">当前回合</Text>
                  <Tag color="blue" style={{ marginLeft: '8px' }}>
                    第{currentRound} / {TOTAL_ROUNDS}回合
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">回合状态</Text>
                  <Tag color={currentPhase.color} style={{ marginLeft: '8px' }}>
                    {currentPhase.text}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">当前模块</Text>
                  <Tag color="purple" style={{ marginLeft: '8px' }}>
                    {activeStepMeta?.title ?? '--'}
                  </Tag>
                </div>
              </Space>
            </div>

            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToLobby}>
                返回大厅
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => loadLatestState()}>
                刷新数据
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={handleShowSummary}
                disabled={roundPhase === 'finished'}
              >
                查看回合结算
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitDecisions}
                disabled={submitDisabled}
                loading={isWaitingForPlayers}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                提交回合决策
              </Button>
            </Space>
          </div>

          {roundPhase === 'finished' && (
            <GameEnd players={players} onBackToLobby={handleBackToLobby} />
          )}
        </Spin>
      </div>

      <RoundSummary
        visible={isSummaryVisible}
        players={players}
        roundNumber={currentRound}
        onClose={() => setSummaryVisible(false)}
        onNextRound={handleNextRound}
      />
    </div>
  );
};
