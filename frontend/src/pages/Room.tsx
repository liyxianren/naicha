import React, { useState, useEffect, useRef } from 'react';
import { App, Button, Typography, Tag, Space, Spin } from 'antd';
import { CheckOutlined, CloseOutlined, GlobalOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
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
  const hasNavigatedRef = useRef(false);

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

  const checkGameStatus = async () => {
    if (!currentGame || hasNavigatedRef.current) return;
    try {
      const response = await gameApi.getGame(currentGame.id);
      if (response.success && response.data) {
        if (response.data.status === 'in_progress' && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          message.success(t('room.messages.gameStarted'));
          navigate('/game');
        }
      }
    } catch (error: any) {
      console.error('Check game status failed:', error);
    }
  };

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

  useEffect(() => {
    if (!playerId || !playersLoaded) return;
    const me = players.find(p => p.id === playerId);
    if (me) {
      setCurrentPlayer(me);
    }
  }, [players, playerId, playersLoaded, setCurrentPlayer]);

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

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF8F0 30%, #FFF0E6 60%, #E8C194 100%)',
      }}>
        <Spin size="large" tip={t('room.loading')} />
      </div>
    );
  }

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
        hasNavigatedRef.current = true;
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #FFFBF7 0%, #FFF8F0 30%, #FFF0E6 60%, #E8C194 100%)',
    }}>
      {/* 语言切换按钮 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ position: 'absolute', top: 24, right: 24, zIndex: 100 }}
      >
        <button
          onClick={toggleLanguage}
          className="glass-effect rounded-full px-4 py-2 shadow-md hover-lift"
          style={{ border: '2px solid var(--color-border-secondary)' }}
        >
          <GlobalOutlined /> {language === 'zh-CN' ? 'EN' : '中文'}
        </button>
      </motion.div>

      {/* 装饰性泡泡 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${30 + Math.random() * 50}px`,
              height: `${30 + Math.random() * 50}px`,
              background: i % 3 === 0 ? 'var(--product-milktea-gradient)' :
                          i % 3 === 1 ? 'var(--product-coconut-gradient)' :
                          'var(--product-smoothie-gradient)',
              opacity: 0.12,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 20px rgba(255,255,255,0.3)`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 30 - 15, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* 珍珠装饰 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`pearl-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${10 + Math.random() * 14}px`,
              height: `${10 + Math.random() * 14}px`,
              background: 'var(--color-pearl-black)',
              opacity: 0.06,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.06, 0.1, 0.06],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-8 max-w-4xl mx-auto">
        {/* 房间标题卡片 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-effect rounded-2xl p-6 mb-8 border-2 shadow-xl"
          style={{ borderColor: 'var(--color-border-primary)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🧋</div>
              <div>
                <Title level={2} style={{ margin: 0, color: 'var(--color-pearl-black)', fontFamily: 'var(--font-heading)' }}>
                  {currentGame?.name}
                </Title>
                <div className="flex items-center gap-3 mt-2">
                  <Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    {t('room.waiting')} ({players.length}/{currentGame?.max_players})
                  </Text>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
              </div>
            </div>
            <Tag color="green" style={{ fontSize: '16px', padding: '6px 20px', borderRadius: 'var(--radius-full)' }}>
              {t('room.status.waiting')}
            </Tag>
          </div>
        </motion.div>

        {/* 玩家列表 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-effect rounded-2xl p-6 mb-8 border-2 shadow-xl"
          style={{ borderColor: 'var(--color-border-secondary)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👥</span>
            <Text strong style={{ fontSize: '20px', color: 'var(--color-pearl-black)' }}>
              {t('room.playerList')}
            </Text>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {players.map((player, index) => {
              const isCurrent = player.id === currentPlayer?.id;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl p-4 border-2 transition-all"
                  style={{
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(255,255,255,0.9) 100%)'
                      : 'rgba(255,255,255,0.6)',
                    borderColor: isCurrent ? 'var(--color-caramel-gold)' : 'var(--color-border-light)',
                    boxShadow: isCurrent ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full flex items-center justify-center font-bold text-white shadow-md" style={{
                        width: '56px',
                        height: '56px',
                        background: index === 0 ? 'var(--gradient-money)' : 'var(--gradient-milk-tea)',
                        fontSize: '24px',
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong style={{ fontSize: '18px', color: 'var(--color-pearl-black)' }}>
                            {player.name}
                          </Text>
                          {isCurrent && (
                            <Tag color="blue" className="rounded-full">✨ {t('room.selfTag')}</Tag>
                          )}
                          {index === 0 && (
                            <Tag color="gold" className="rounded-full">👑 {t('room.hostTag')}</Tag>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                          💰 {t('room.initialCash')}: ￥{player.cash.toLocaleString()}
                        </Text>
                      </div>
                    </div>

                    <div>
                      {player.is_ready ? (
                        <Tag icon={<CheckOutlined />} color="success" className="rounded-full px-4 py-2" style={{ fontSize: '15px' }}>
                          {t('room.ready')}
                        </Tag>
                      ) : (
                        <Tag icon={<CloseOutlined />} color="default" className="rounded-full px-4 py-2" style={{ fontSize: '15px' }}>
                          {t('room.notReady')}
                        </Tag>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 空位 */}
            {Array.from({ length: (currentGame?.max_players || 0) - players.length }).map((_, index) => (
              <motion.div
                key={`empty-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (players.length + index) * 0.1 }}
                className="rounded-xl p-4 border-2 text-center"
                style={{
                  background: 'rgba(255,255,255,0.3)',
                  borderColor: 'var(--color-border-light)',
                  borderStyle: 'dashed',
                  color: 'var(--text-tertiary)',
                }}
              >
                <div className="text-2xl mb-1">💭</div>
                {t('room.emptySlot')}
              </motion.div>
            ))}
          </Space>
        </motion.div>

        {/* 操作按钮区 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-effect rounded-2xl p-6 border-2 shadow-xl"
          style={{ borderColor: 'var(--color-border-secondary)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 准备按钮 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleReady}
              disabled={loading}
              className="w-full rounded-full shadow-md transition-all"
              style={{
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold',
                border: currentPlayer?.is_ready ? '2px solid var(--color-border-primary)' : 'none',
                background: currentPlayer?.is_ready ? 'white' : 'var(--gradient-btn-success)',
                color: currentPlayer?.is_ready ? 'var(--text-primary)' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {currentPlayer?.is_ready ? (
                <><CloseOutlined /> {t('room.cancelReady')}</>
              ) : (
                <><CheckOutlined /> {t('room.readyButton')}</>
              )}
            </motion.button>

            {/* 开始游戏按钮（仅房主） */}
            {isRoomOwner && (
              <motion.button
                whileHover={allReady ? { scale: 1.02, y: -2 } : {}}
                whileTap={allReady ? { scale: 0.98 } : {}}
                onClick={startGame}
                disabled={!allReady || loading}
                className={`w-full rounded-full shadow-xl transition-all ${allReady ? 'animate-pulse' : ''}`}
                style={{
                  height: '56px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  border: 'none',
                  background: allReady ? 'var(--gradient-money)' : 'var(--bg-secondary)',
                  color: allReady ? 'var(--color-pearl-black)' : 'var(--text-tertiary)',
                  cursor: !allReady || loading ? 'not-allowed' : 'pointer',
                  boxShadow: allReady ? '0 8px 24px rgba(255, 215, 0, 0.4), var(--glow-money)' : 'var(--shadow-sm)',
                }}
              >
                {allReady ? `🚀 ${t('room.startGame')}` : t('room.waitingAllReady')}
              </motion.button>
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
                height: '48px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 'bold',
              }}
            >
              {t('room.leaveRoom')}
            </Button>
          </Space>
        </motion.div>
      </div>
    </div>
  );
};
