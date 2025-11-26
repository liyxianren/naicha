import React, { useState, useEffect } from 'react';
import { App, Modal, Typography, Input, Space, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { gameApi, playerApi } from '../api';
import { useGameStore } from '../stores/gameStore';
import { useSessionStore } from '../stores/sessionStore';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import type { Game } from '../types';
import '../styles/theme.css';

const { Text } = Typography;

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setCurrentGame, setCurrentPlayer } = useGameStore();
  const { sessionToken, nickname, hydrateFromStorage, hydrated, setPlayerContext } = useSessionStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };
  const [games, setGames] = useState<Game[]>([]);
  const [_loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    if (!sessionToken) {
      navigate('/login');
    }
  }, [hydrated, sessionToken, navigate]);

  // 仅保留轻量轮询，避免频繁刷新
  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await gameApi.getGames();
      if (response.success && response.data) {
        setGames(response.data.filter(g => g.status === 'waiting'));
      }
    } catch (error: any) {
      message.error(error.error || 'Failed to load game list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionToken) return;
    loadGames();
    const interval = setInterval(loadGames, 10000); // 10s 轮询
    return () => clearInterval(interval);
  }, [sessionToken]);

  const handleCreateGame = async () => {
    const finalGameName = nickname || '奶茶房间';

    if (!sessionToken) {
      message.error('Please log in first');
      navigate('/login');
      return;
    }

    try {
      const response = await gameApi.createGame({
        name: finalGameName,
        max_players: maxPlayers,
        player_name: (nickname || '').trim() || '玩家',
        session_token: sessionToken,
      });

      if (response.success && response.data) {
        message.success('Room created');
        setCurrentGame(response.data.game);
        setCurrentPlayer(response.data.player);
        setPlayerContext(response.data.player.id, response.data.game.id);
        setCreateModalVisible(false);
        navigate('/room');
      }
    } catch (error: any) {
      message.error(error.error || 'Create room failed');
    }
  };

  const handleJoinGame = async () => {
    if (!selectedGame) {
      message.warning('Please select a room');
      return;
    }
    if (!sessionToken) {
      message.error('Please log in first');
      navigate('/login');
      return;
    }

    try {
      const response = await playerApi.joinGame({
        game_id: selectedGame.id,
        player_name: (nickname || '玩家'),
        session_token: sessionToken,
      });

      if (response.success && response.data) {
        message.success('Joined room');
        setCurrentGame(selectedGame);
        setCurrentPlayer(response.data);
        setPlayerContext(response.data.id, selectedGame.id);
        setJoinModalVisible(false);
        navigate('/room');
      }
    } catch (error: any) {
      message.error(error.error || 'Join room failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 30%, #4a2c5e 60%, #8b5a8e 100%)',
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
          zIndex: 100,
        }}
      >
        {language === 'zh-CN' ? 'EN' : '中文'}
      </Button>

      {/* 背景和装饰省略，保持原有视觉 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `
          radial-gradient(2px 2px at 20% 30%, white, transparent),
          radial-gradient(2px 2px at 60% 70%, white, transparent),
          radial-gradient(1px 1px at 50% 50%, white, transparent),
          radial-gradient(1px 1px at 80% 10%, white, transparent),
          radial-gradient(2px 2px at 90% 60%, white, transparent),
          radial-gradient(1px 1px at 33% 80%, white, transparent),
          radial-gradient(1px 1px at 15% 15%, white, transparent)
        `,
        opacity: 0.6,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 10, padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              textAlign: 'center',
              marginBottom: '40px',
              padding: '32px 20px',
              background: 'rgba(255, 182, 193, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '3px solid rgba(255, 182, 193, 0.25)',
              boxShadow: '0 8px 32px rgba(255, 182, 193, 0.2)',
              position: 'relative',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '72px', marginBottom: '12px' }}
            >
              🧋
            </motion.div>
            <div style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '40px',
              letterSpacing: '6px',
              color: '#FFD700',
            }}>
              MILK TEA BATTLE
            </div>
            <div style={{ marginTop: 12, color: '#ffe4e1' }}>
              当前登录昵称：{nickname || '未设置'}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', bounce: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '24px' }}
          >
            <button
              className="nes-btn is-primary"
              onClick={() => setCreateModalVisible(true)}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '16px',
                padding: '16px 40px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: '4px solid #FF8C00',
                boxShadow: '0 8px 0 #CC6600, 0 12px 20px rgba(0,0,0,0.4)',
              }}
            >
              🚀 创建房间
            </button>
          </motion.div>

          {/* 房间列表 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            <AnimatePresence>
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <div
                    className="nes-container"
                    onClick={() => {
                      setSelectedGame(game);
                      setJoinModalVisible(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      background: 'rgba(26, 10, 46, 0.75)',
                      backdropFilter: 'blur(10px)',
                      borderColor: '#FFB6C1',
                      borderWidth: '3px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontFamily: 'var(--font-pixel)', color: '#FFD700' }}>
                        {game.name}
                      </Text>
                      <span style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '10px',
                        padding: '4px 10px',
                        background: '#7FFF00',
                        color: '#1a0a2e',
                        border: '2px solid #6BCF00',
                      }}>
                        WAITING
                      </span>
                    </div>
                    <div style={{ marginTop: 12, color: '#FFE4E1' }}>
                      <div>人数：{game.max_players}</div>
                      <div>回合：{game.current_round}/10</div>
                    </div>
                    <button className="nes-btn is-success" style={{ width: '100%', marginTop: 12 }}>
                      👉 加入
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 创建房间 */}
      <Modal
        title={<span style={{ fontFamily: 'var(--font-pixel)', fontSize: 18, color: '#FFD700' }}>🚀 创建房间</span>}
        open={createModalVisible}
        onOk={handleCreateGame}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        okText="创建"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>房间名称</Text>
            <div style={{ marginTop: 8 }}>{nickname || '奶茶房间'}</div>
            <Text type="secondary">房间名称自动使用登录昵称</Text>
          </div>
          <div>
            <Text strong>人数上限</Text>
            <Input
              type="number"
              min={2}
              max={4}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value) || 4)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* 加入房间确认 */}
      <Modal
        title={<span style={{ fontFamily: 'var(--font-pixel)', fontSize: 18, color: '#FFD700' }}>👉 加入房间</span>}
        open={joinModalVisible}
        onOk={handleJoinGame}
        onCancel={() => {
          setJoinModalVisible(false);
          setSelectedGame(null);
        }}
        okText="加入"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>房间</Text>
            <div>{selectedGame?.name}</div>
          </div>
          <div>
            <Text type="secondary">将使用登录昵称：{nickname || '未设置'}</Text>
          </div>
        </Space>
      </Modal>
    </div>
  );
};
