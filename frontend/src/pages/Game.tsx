import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Row, Col, Button, Space, Tag, Typography, Spin } from 'antd';
import {
  SendOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { gameApi, playerApi, roundApi } from '../api';
import { useGameStore } from '../stores/gameStore';
import { useDecisionStore } from '../stores/decisionStore';
import { useGameRoundStore } from '../stores/gameRoundStore';
import { useSessionStore } from '../stores/sessionStore';
import { useTranslation } from '../hooks/useTranslation';
import { GameHeader } from '../components/game/GameHeader';
import { PlayerList } from '../components/game/PlayerList';
import { DecisionPanel, type DecisionStepMeta } from '../components/game/DecisionPanel';
import { ShopDecision } from '../components/game/ShopDecision';
import { EmployeeManagement } from '../components/game/EmployeeManagement';
import { MarketAction } from '../components/game/MarketAction';
import { ProductResearch } from '../components/game/ProductResearch';
import { ProductionPlan } from '../components/game/ProductionPlan';
import { RoundSummary } from '../components/game/RoundSummary';
import { RoundSettlement } from '../components/game/RoundSettlement';
import { GameEnd } from '../components/game/GameEnd';
import type { DecisionStepKey, RoundSummary as RoundSummaryType } from '../types';

const { Text } = Typography;

const TOTAL_ROUNDS = 10;

export const Game: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { t } = useTranslation();
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
  const decisionSteps: DecisionStepMeta[] = useMemo(() => ([
    { key: 'shop', title: t('game.steps.shop.title'), emoji: '🏬', description: t('game.steps.shop.description') },
    { key: 'employees', title: t('game.steps.employees.title'), emoji: '👩‍🍳', description: t('game.steps.employees.description') },
    { key: 'market', title: t('game.steps.market.title'), emoji: '📢', description: t('game.steps.market.description') },
    { key: 'research', title: t('game.steps.research.title'), emoji: '🔬', description: t('game.steps.research.description') },
    { key: 'production', title: t('game.steps.production.title'), emoji: '🏭', description: t('game.steps.production.description') },
  ]), [t]);
  const phaseTagMap: Record<string, { text: string; color: string }> = useMemo(() => ({
    planning: { text: t('game.phase.planning'), color: 'blue' },
    waiting: { text: t('game.phase.waiting'), color: 'gold' },
    summary: { text: t('game.phase.summary'), color: 'purple' },
    finished: { text: t('game.phase.finished'), color: 'red' },
  }), [t]);
  const [pageLoading, setPageLoading] = useState(false);
  const [settlementVisible, setSettlementVisible] = useState(false);
  const [settlementRound, setSettlementRound] = useState(0);
  const [settlementData, setSettlementData] = useState<RoundSummaryType[] | null>(null);
  const [settlementCustomerFlow, setSettlementCustomerFlow] = useState<any>(null);
  const [settlementRawSummary, setSettlementRawSummary] = useState<any>(null);

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
        const serverRound = gameResp.data.current_round ?? 1;
        const localRound = useDecisionStore.getState().currentRound;

        // 检测被动回合推进 (其他玩家触发了回合结束)
        if (serverRound > localRound && localRound > 0) {
          console.log(`[Game] Detected round advance: ${localRound} -> ${serverRound}`);
          try {
            const prevRound = serverRound - 1;
            if (prevRound >= 1) {
              const summaryResp = await roundApi.getRoundSummary(gameId, prevRound);
              if (summaryResp.success && summaryResp.data) {
                // 兼容后端返回格式 { players: [...] }
                const data: any = summaryResp.data;
                const playersData = Array.isArray(data) ? data : (data.players || []);
                
                setSettlementRound(prevRound);
                setSettlementData(playersData);
                setSettlementCustomerFlow(data.customer_flow || null);
                setSettlementRawSummary(data);
                setSettlementVisible(true);
                
                // 重置状态准备下一回合
                setRoundLocked(false);
                setWaitingForPlayers(false);
                setSubmittingStep(null);
                resetSteps();
                setRoundPhase('planning');
              }
            }
          } catch (e) {
            console.error('[Game] Failed to fetch settlement data:', e);
          }
        }

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
      message.error(error?.error || t('game.messages.refreshFailed'));
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

  // 监听回合结算事件
  useEffect(() => {
    const handleSettlement = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { roundNumber, summaryData, customerFlow, rawSummary } = customEvent.detail || {};
      const playersData = summaryData || [];

      setSettlementRound(roundNumber);
      setSettlementData(playersData);
      setSettlementCustomerFlow(customerFlow || null);
      setSettlementRawSummary(rawSummary || null);
      setSettlementVisible(true);

      // 调试输出：结算时打印本回合的客流和销量/营收分配
      console.log('[Settlement] payload', { roundNumber, customerFlow, summaryData: playersData, rawSummary });
      console.groupCollapsed(`[Settlement] Round ${roundNumber}`);
      if (customerFlow) {
        console.log('Customer flow', customerFlow);
      }
      if (playersData && playersData.length > 0) {
        const overview = playersData.map((p: any) => ({
          player_id: p.player_id,
          nickname: p.nickname || p.player_name,
          total_revenue: p.total_revenue,
          total_sold: p.total_sold,
          round_profit: p.round_profit,
          productions: p.productions,
        }));
        console.table(overview);
      }
      if (rawSummary) {
        console.log('Raw summary payload', rawSummary);
      }
      console.groupEnd();
    };

    window.addEventListener('showRoundSettlement', handleSettlement);
    return () => window.removeEventListener('showRoundSettlement', handleSettlement);
  }, []);

  const handleSubmitDecisions = () => {
    if (isRoundLocked) {
      message.info(t('game.messages.waitingForSettlement'));
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
    message.success(t('game.messages.submitSuccess'));
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
        <Spin spinning={pageLoading} tip={t('game.loading')}>
          {currentGame && currentPlayer && (
            <GameHeader
              game={currentGame}
              player={currentPlayer}
              currentRound={currentRound}
              totalRounds={TOTAL_ROUNDS}
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
                  <Text type="secondary">{t('game.actionBar.currentRound')}</Text>
                  <Tag color="blue" style={{ marginLeft: '8px' }}>
                    {t('game.header.roundProgress', { current: currentRound, total: TOTAL_ROUNDS })}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">{t('game.actionBar.roundStatus')}</Text>
                  <Tag color={currentPhase.color} style={{ marginLeft: '8px' }}>
                    {currentPhase.text}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">{t('game.actionBar.currentStep')}</Text>
                  <Tag color="purple" style={{ marginLeft: '8px' }}>
                    {activeStepMeta?.title ?? '--'}
                  </Tag>
                </div>
              </Space>
            </div>

            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToLobby}>
                {t('game.actionBar.backToLobby')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => loadLatestState()}>
                {t('game.actionBar.refresh')}
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={handleShowSummary}
                disabled={roundPhase === 'finished'}
              >
                {t('game.actionBar.viewSettlement')}
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitDecisions}
                disabled={submitDisabled}
                loading={isWaitingForPlayers}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                {t('game.actionBar.submitDecisions')}
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

      <RoundSettlement
        visible={settlementVisible}
        roundNumber={settlementRound}
        summaryData={settlementData}
        customerFlow={settlementCustomerFlow}
        rawSummary={settlementRawSummary}
        onClose={() => {
          setSettlementVisible(false);
          setSettlementCustomerFlow(null);
          setSettlementRawSummary(null);
          // 关闭结算弹窗，刷新状态进入下一回合
          setRoundPhase('planning');
          setRoundLocked(false);
          setWaitingForPlayers(false);
          setSubmittingStep(null);
          resetSteps();
          loadLatestState({ withLoader: true });
        }}
      />
    </div>
  );
};
