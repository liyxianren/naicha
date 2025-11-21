import React, { useEffect, useState } from 'react';
import { App, Button, Card, Input, Typography } from 'antd';
import { authApi } from '../api';
import { useSessionStore } from '../stores/sessionStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setSession, sessionToken, hydrateFromStorage, hydrated, nickname } = useSessionStore();
  const [name, setName] = useState(nickname || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (sessionToken && hydrated) {
      navigate('/', { replace: true });
    }
  }, [sessionToken, hydrated, navigate]);

  const handleLogin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning('请输入昵称');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(trimmed);
      if (res.success && res.data) {
        setSession(res.data.session_token, res.data.nickname);
        message.success('登录成功');
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      message.error(error.error || '登录失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) return null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1f1737 0%, #2b1f4d 40%, #ffb6c1 100%)',
      padding: '24px',
    }}>
      <Card
        className="card-cute"
        style={{
          width: 420,
          maxWidth: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          borderRadius: '24px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧋</div>
          <Title level={2} style={{ margin: 0, color: '#ff7aa2' }}>
            奶茶大战
          </Title>
          <Text type="secondary">进入前请先设置你的昵称</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>昵称</Text>
            <Input
              size="large"
              placeholder="取一个好听的昵称吧"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>昵称会显示在房间和对局中</Text>
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleLogin}
            style={{ borderRadius: 999, background: 'linear-gradient(135deg, #ff8fb1 0%, #ffb6c1 100%)', border: 'none' }}
          >
            进入大厅
          </Button>
        </div>
      </Card>
    </div>
  );
};
