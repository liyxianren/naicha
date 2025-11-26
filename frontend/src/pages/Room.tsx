import React, { useState, useEffect, useRef } from 'react';
import { App, Button, Card, Typography, Tag, Space, Spin } from 'antd';
import { CheckOutlined, CloseOutlined, GlobalOutlined } from '@ant-design/icons';
import { gameApi, playerApi } from '../api';
import { useGameStore } from '../stores/gameStore';
import { useSessionStore } from '../stores/sessionStore';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Room: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentGame, currentPlayer, players, setPlayers, setCurrentGame, setCurrentPlayer } = useGameStore();
  const { hydrated, playerId, gameId } = useSessionStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const hasNavigatedRef = useRef(false); // 防止重复导航和消息

  // 加载玩家列表
  const loadPlayers = async () => {
    if (!currentGame) return;
    try {
      const response = await gameApi.getGamePlayers(currentGame.id);
      if (response.success && response.data) {
        setPlayers(response.data);
        setPlayersLoaded(true);
      }
    } catch (error: any) {
      message.error(error.error || t('room.messages.loadFailed'));
    }
  };

  // 检查游戏状态
  const checkGameStatus = async () => {
    if (!currentGame || hasNavigatedRef.current) return;
    try {
      const response = await gameApi.getGame(currentGame.id);
      if (response.success && response.data) {
        if (response.data.status === 'in_progress' && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true; // 防止重复触发
          message.success(t('room.messages.gameStarted'));
          navigate('/game');
        }
      }
    } catch (error: any) {
      console.error('Check game status failed:', error);
    }
  };

  // 刷新后根据会话恢复房间/玩家信息
  useEffect(() => {
    const restore = async () => {
      if (!hydrated || currentGame || currentPlayer || !playerId || !gameId) return;
      setRestoring(true);
      try {
        const [gameRes, playerRes, playersRes] = await Promise.all([
          gameApi.getGame(gameId),
          playerApi.getPlayer(playerId),
          gameApi.getGamePlayers(gameId),
        ]);
        if (gameRes.success && gameRes.data) setCurrentGame(gameRes.data);
        if (playerRes.success && playerRes.data) setCurrentPlayer(playerRes.data);
        if (playersRes.success && playersRes.data) setPlayers(playersRes.data);
      } finally {
        setRestoring(false);
      }
    };
    restore();
  }, [hydrated, currentGame, currentPlayer, playerId, gameId, setCurrentGame, setCurrentPlayer, setPlayers]);

  // 确保 currentPlayer 同步到列表中的自身
  useEffect(() => {
    if (!playerId || !playersLoaded) return;
    const me = players.find(p => p.id === playerId);
    if (me) {
      setCurrentPlayer(me);
    }
  }, [players, playerId, playersLoaded, setCurrentPlayer]);

  // 常规轮询与跳转保护
  useEffect(() => {
    if (!hydrated) return;

    if (!currentGame || !currentPlayer) {
      if (restoring) return;
      const timer = setTimeout(() => {
        if (!currentGame || !currentPlayer) {
          navigate('/');
        }
      }, 300);
      return () => clearTimeout(timer);
    }

    loadPlayers();
    checkGameStatus();

    const playersInterval = setInterval(loadPlayers, 2000);
    const statusInterval = setInterval(checkGameStatus, 1000);

    return () => {
      clearInterval(playersInterval);
      clearInterval(statusInterval);
    };
  }, [currentGame, currentPlayer, hydrated, restoring, navigate]);

  // 正在恢复时显示加载态
  if (restoring) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip={t('room.loading')} />
      </div>
    );
  }

  // 切换准备状态
  const toggleReady = async () => {
    if (!currentPlayer) return;

    setLoading(true);
    try {
      await playerApi.setReady(currentPlayer.id, !currentPlayer.is_ready);
      message.success(currentPlayer.is_ready ? t('room.messages.cancelReadySuccess') : t('room.messages.readySuccess'));
      loadPlayers();
    } catch (error: any) {
      message.error(error.error || t('room.messages.setReadyFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 开始游戏
  const startGame = async () => {
    if (!currentGame) return;

    const allReady = players.every(p => p.is_ready);
    if (!allReady) {
      message.warning(t('room.messages.waitAllReady'));
      return;
    }

    if (players.length < 2) {
      message.warning(t('room.messages.needMorePlayers'));
      return;
    }

    setLoading(true);
    try {
      const response = await gameApi.startGame(currentGame.id);
      if (response.success) {
        hasNavigatedRef.current = true; // 防止 checkGameStatus 重复触发
        setCurrentGame({ ...currentGame, status: 'in_progress' });
        message.success(t('room.messages.gameStarted'));
        navigate('/game');
      }
    } catch (error: any) {
      message.error(error.error || t('room.messages.startFailed'));
    } finally {
      setLoading(false);
    }
  };

  const isRoomOwner = currentPlayer?.turn_order === 0;
  const allReady = players.length >= 2 && players.every(p => p.is_ready);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      background: 'var(--gradient-milk-tea)',
      position: 'relative',
    }}>
      {/* 语言切换按钮 - 右上角 */}
      <Button
        icon={<GlobalOutlined />}
        onClick={toggleLanguage}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          fontWeight: 'bold',
          zIndex: 10,
        }}
      >
        {language === 'zh-CN' ? 'EN' : '中文'}
      </Button>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* 房间标题 */}
        <Card className="card-cute" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: 'var(--color-milktea-brown)' }}>
                🏠 {currentGame?.name}
              </Title>
              <Text type="secondary">
                {t('room.waiting')} ({players.length}/{currentGame?.max_players})
              </Text>
            </div>
            <Tag color="green" style={{ fontSize: '14px', padding: '4px 16px' }}>
              {t('room.status.waiting')}
            </Tag>
          </div>
        </Card>

        {/* 玩家列表 */}
        <Card
          className="card-cute"
          title={<span style={{ color: 'var(--color-milktea-brown)', fontSize: '18px' }}>👥 {t('room.playerList')}</span>}
          style={{ marginBottom: '24px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {players.map((player, index) => (
              <div
                key={player.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: player.id === currentPlayer?.id
                    ? 'linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 100%)'
                    : '#F5F5F5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--gradient-milk-tea)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white',
                    fontWeight: 'bold',
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {player.name}
                      </Text>
                      {player.id === currentPlayer?.id && (
                        <Tag color="blue">{t('room.selfTag')}</Tag>
                      )}
                      {index === 0 && (
                        <Tag color="gold">{t('room.hostTag')}</Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {t('room.initialCash')}: ¥{player.cash.toLocaleString()}
                    </Text>
                  </div>
                </div>

                <div>
                  {player.is_ready ? (
                    <Tag icon={<CheckOutlined />} color="success" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      {t('room.ready')}
                    </Tag>
                  ) : (
                    <Tag icon={<CloseOutlined />} color="default" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      {t('room.notReady')}
                    </Tag>
                  )}
                </div>
              </div>
            ))}

            {/* 空位 */}
            {Array.from({ length: (currentGame?.max_players || 0) - players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#FAFAFA',
                  border: '2px dashed #D9D9D9',
                  textAlign: 'center',
                  color: '#999',
                }}
              >
                {t('room.emptySlot')}
              </div>
            ))}
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card className="card-cute">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 准备按钮 */}
            <Button
              type={currentPlayer?.is_ready ? 'default' : 'primary'}
              size="large"
              block
              icon={currentPlayer?.is_ready ? <CloseOutlined /> : <CheckOutlined />}
              onClick={toggleReady}
              loading={loading}
              style={{
                height: '48px',
                borderRadius: 'var(--radius-full)',
                fontSize: '16px',
                fontWeight: 'bold',
                background: currentPlayer?.is_ready ? undefined : 'var(--gradient-success)',
                border: currentPlayer?.is_ready ? undefined : 'none',
                color: currentPlayer?.is_ready ? undefined : 'white',
              }}
            >
              {currentPlayer?.is_ready ? t('room.cancelReady') : t('room.readyButton')}
            </Button>

            {/* 开始游戏按钮（仅房主） */}
            {isRoomOwner && (
              <Button
                type="primary"
                size="large"
                block
                onClick={startGame}
                loading={loading}
                disabled={!allReady}
                style={{
                  height: '48px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: allReady ? 'var(--gradient-money)' : undefined,
                  border: allReady ? 'none' : undefined,
                }}
                className={allReady ? 'animate-pulse' : ''}
              >
                {allReady ? `🎮 ${t('room.startGame')}` : t('room.waitingAllReady')}
              </Button>
            )}

            {/* 离开房间 */}
            <Button
              size="large"
              block
              danger
              onClick={async () => {
                if (!currentPlayer) return;
                try {
                  await playerApi.leaveGame(currentPlayer.id);
                  message.success(t('room.messages.leftRoom'));
                  navigate('/');
                } catch (error: any) {
                  message.error(error.error || t('room.messages.leaveFailed'));
                }
              }}
              style={{
                height: '40px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {t('room.leaveRoom')}
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};
