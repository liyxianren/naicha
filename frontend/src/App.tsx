import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { Lobby } from './pages/Lobby';
import { Room } from './pages/Room';
import { Game } from './pages/Game';
import { Login } from './pages/Login';
import { useSessionStore } from './stores/sessionStore';
import { useGameStore } from './stores/gameStore';
import { useLanguageStore } from './stores/languageStore';
import { authApi, gameApi } from './api';

const theme = {
  token: {
    colorPrimary: '#D4A574',
    colorSuccess: '#7ED957',
    colorWarning: '#FFB648',
    colorError: '#FF6B6B',
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

// 管理心跳和状态恢复
const SessionManager: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessionToken,
    playerId,
    hydrateFromStorage,
    hydrated,
    clearSession,
    setPlayerContext,
  } = useSessionStore();
  const { setCurrentGame, setCurrentPlayer, setPlayers, reset } = useGameStore();
  const restoredForToken = useRef<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // Session 恢复（页面刷新后重新拉取玩家/房间数据）
  useEffect(() => {
    const restore = async () => {
      // 没有 playerId 表示还未加入房间，避免无意义的 /session 404
      if (!sessionToken || !hydrated || !playerId) return;
      if (restoredForToken.current === sessionToken) return;
      restoredForToken.current = sessionToken;

      try {
        const sessionRes = await authApi.getSession(sessionToken);
        if (!sessionRes.success || !sessionRes.data) {
          throw sessionRes;
        }

        const player = sessionRes.data;
        setPlayerContext(player.id, player.game_id);
        setCurrentPlayer(player);

        const [gameRes, playersRes] = await Promise.all([
          gameApi.getGame(player.game_id),
          gameApi.getGamePlayers(player.game_id),
        ]);

        if (gameRes.success && gameRes.data) {
          setCurrentGame(gameRes.data);
        }
        if (playersRes.success && playersRes.data) {
          setPlayers(playersRes.data);
        }
      } catch (err: any) {
        // 404 表示会话不存在或已清理，直接清空本地并回登录，避免循环请求
        if (err?.status === 404) {
          clearSession();
          reset();
          navigate('/login', { replace: true });
          return;
        }
        clearSession();
        reset();
        navigate('/login', { replace: true });
      }
    };

    restore();
  }, [sessionToken, hydrated, setCurrentGame, setCurrentPlayer, setPlayers, setPlayerContext, clearSession, reset, navigate]);

  // 心跳维持
  useEffect(() => {
    if (!sessionToken) return;

    const timer = setInterval(async () => {
      try {
        await authApi.heartbeat(sessionToken);
      } catch (error: any) {
        // 401 代表过期，其它错误先不打断
        if (error?.status === 401) {
          clearSession();
          reset();
          navigate('/login', { replace: true });
        }
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [sessionToken, clearSession, reset, navigate]);

  return null;
};

// 登录保护
const RequireSession: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { sessionToken, hydrated, hydrateFromStorage } = useSessionStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!hydrated) return null;
  if (!sessionToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const language = useLanguageStore((state) => state.language);
  const antdLocale = language === 'zh-CN' ? zhCN : enUS;

  return (
    <ConfigProvider locale={antdLocale} theme={theme}>
      <AntApp>
        <BrowserRouter>
          <SessionManager />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireSession><Lobby /></RequireSession>} />
            <Route path="/room" element={<RequireSession><Room /></RequireSession>} />
            <Route path="/game" element={<RequireSession><Game /></RequireSession>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
