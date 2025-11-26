import React, { useEffect, useState } from 'react';
import { App, Button, Card, Input, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import { useSessionStore } from '../stores/sessionStore';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setSession, sessionToken, hydrateFromStorage, hydrated, nickname } = useSessionStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
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

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  const handleLogin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning(t('auth.messages.nicknameRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(trimmed);
      if (res.success && res.data) {
        setSession(res.data.session_token, res.data.nickname);
        message.success(t('auth.messages.loginSuccess'));
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      message.error(error.error || t('auth.messages.loginFailed'));
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
        }}
      >
        {language === 'zh-CN' ? 'EN' : '中文'}
      </Button>

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
            {t('auth.title')}
          </Title>
          <Text type="secondary">{t('auth.subtitle')}</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>{t('auth.nickname')}</Text>
            <Input
              size="large"
              placeholder={t('auth.placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{t('auth.nicknameHint')}</Text>
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleLogin}
            style={{ borderRadius: 999, background: 'linear-gradient(135deg, #ff8fb1 0%, #ffb6c1 100%)', border: 'none' }}
          >
            {t('auth.enterLobby')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
