import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, App, Modal, Alert, Statistic, Tag } from 'antd';
import { SoundOutlined, LineChartOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { marketApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../hooks/useTranslation';

interface MarketActionProps {
  disabled?: boolean;
}

/**
 * 市场行动：广告/调研
 */
export const MarketAction: React.FC<MarketActionProps> = ({ disabled = false }) => {
  const { currentPlayer, currentGame, setCurrentPlayer } = useGameStore();
  const { message, modal } = App.useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [showAdModal, setShowAdModal] = useState(false);
  const [adDiceResult, setAdDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const [hasUsedAd, setHasUsedAd] = useState(false);
  const [hasUsedResearch, setHasUsedResearch] = useState(false);

  useEffect(() => {
    if (currentPlayer && currentGame) {
      loadMarketActions();
    }
  }, [currentPlayer?.id, currentGame?.current_round]);

  const loadMarketActions = async () => {
    if (!currentPlayer || !currentGame) return;

    try {
      const response = await marketApi.getMarketActions(currentPlayer.id, currentGame.current_round);
      if (response.success && response.data) {
        const actions = Array.isArray(response.data) ? response.data : [];
        const hasAd = actions.some((action: any) => action.action_type === 'ad');
        const hasResearch = actions.some((action: any) => action.action_type === 'research');
        setHasUsedAd(hasAd);
        setHasUsedResearch(hasResearch);
      }
    } catch (error) {
      console.error('Failed to load market actions:', error);
    }
  };

  const handleAdvertisement = () => {
    setAdDiceResult(null);
    setShowAdModal(true);
  };

  const handleRollDice = () => {
    setIsRolling(true);

    let count = 0;
    const rollInterval = setInterval(() => {
      setAdDiceResult(Math.floor(Math.random() * 6) + 1);
      count++;

      if (count >= 10) {
        clearInterval(rollInterval);
        const finalResult = Math.floor(Math.random() * 6) + 1;
        setAdDiceResult(finalResult);
        setIsRolling(false);
      }
    }, 100);
  };

  const handlePlaceAd = async () => {
    if (!currentPlayer || !currentGame || adDiceResult === null) {
      message.warning(t('game.market.messages.rollFirst'));
      return;
    }

    setLoading(true);
    try {
      const response = await marketApi.placeAdvertisement({
        player_id: currentPlayer.id,
        round_number: currentGame.current_round,
        dice_result: adDiceResult,
      });
      if (response.success && response.data) {
        setShowAdModal(false);
        setHasUsedAd(true);
        modal.success({
          title: t('game.market.ad.successTitle'),
          content: (
            <div>
              <p>{t('game.market.ad.score', { score: response.data.ad_score })}</p>
              <p>{t('game.market.ad.costRemaining', { cost: response.data.cost, cash: response.data.remaining_cash })}</p>
            </div>
          ),
        });
        setCurrentPlayer({ ...currentPlayer, cash: response.data.remaining_cash });
      }
    } catch (error: any) {
      message.error(error.error || t('game.market.messages.adFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarketResearch = async () => {
    if (!currentPlayer || !currentGame) return;

    setLoading(true);
    try {
      const response = await marketApi.conductResearch({
        player_id: currentPlayer.id,
        round_number: currentGame.current_round,
      });

      if (response.success && response.data) {
        setHasUsedResearch(true);
        const { next_round, customer_flow, remaining_cash, cost } = response.data;
        modal.info({
          title: t('game.market.research.modalTitle', { round: next_round }),
          content: (
            <div>
              <p><strong>{t('game.market.research.highTier')}</strong>{customer_flow.high_tier_customers} {t('game.market.research.people')}</p>
              <p><strong>{t('game.market.research.lowTier')}</strong>{customer_flow.low_tier_customers} {t('game.market.research.people')}</p>
              <p style={{ color: '#999', fontSize: '12px', marginTop: 12 }}>
                {t('game.market.research.costRemaining', { cost, cash: remaining_cash })}
              </p>
              <p style={{ color: '#999', fontSize: '12px', marginTop: 8 }}>
                {t('game.market.research.tip')}
              </p>
            </div>
          ),
        });
        setCurrentPlayer({ ...currentPlayer, cash: remaining_cash });
      }
    } catch (error: any) {
      message.error(error.error || t('game.market.messages.researchFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="card-cute" style={{ opacity: disabled ? 0.6 : 1 }}>
        <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>{t('game.market.title')}</h3>

        <Row gutter={16}>
          <Col span={12}>
            <Card hoverable={!disabled && !hasUsedAd} style={{ borderColor: '#ff7a45', borderWidth: 2, height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <SoundOutlined style={{ fontSize: 32, color: '#ff7a45', marginBottom: 12 }} />
                  {hasUsedAd && (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ position: 'absolute', top: -8, right: '30%' }}>
                      {t('game.market.common.used')}
                    </Tag>
                  )}
                </div>
                <h4>{t('game.market.ad.title')}</h4>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: 12 }}>
                  {t('game.market.ad.descriptionLine1')}<br />
                  <strong>{t('game.market.common.oncePerRound')}</strong>
                </p>
                <Statistic title={t('game.market.common.cost')} value={800} prefix="￥" valueStyle={{ fontSize: 20 }} />
                <Button
                  type="primary"
                  block
                  icon={<SoundOutlined />}
                  onClick={handleAdvertisement}
                  disabled={disabled || hasUsedAd}
                  loading={loading}
                  style={{
                    marginTop: 12,
                    borderRadius: 'var(--radius-full)',
                    background: hasUsedAd ? '#d9d9d9' : 'linear-gradient(135deg, #ff7a45 0%, #ff9c6e 100%)',
                    border: 'none',
                  }}
                >
                  {hasUsedAd ? t('game.market.ad.usedButton') : t('game.market.ad.action')}
                </Button>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card hoverable={!disabled && !hasUsedResearch} style={{ borderColor: '#1890ff', borderWidth: 2, height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <LineChartOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 12 }} />
                  {hasUsedResearch && (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ position: 'absolute', top: -8, right: '30%' }}>
                      {t('game.market.common.used')}
                    </Tag>
                  )}
                </div>
                <h4>{t('game.market.research.title')}</h4>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: 12 }}>
                  {t('game.market.research.descriptionLine1')}<br />
                  <strong>{t('game.market.common.oncePerRound')}</strong>
                </p>
                <Statistic title={t('game.market.common.cost')} value={500} prefix="￥" valueStyle={{ fontSize: 20 }} />
                <Button
                  type="primary"
                  block
                  icon={<LineChartOutlined />}
                  onClick={handleMarketResearch}
                  disabled={disabled || hasUsedResearch}
                  loading={loading}
                  style={{
                    marginTop: 12,
                    borderRadius: 'var(--radius-full)',
                    background: hasUsedResearch ? '#d9d9d9' : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    border: 'none',
                  }}
                >
                  {hasUsedResearch ? t('game.market.research.usedButton') : t('game.market.research.action')}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title={t('game.market.ad.modalTitle')}
        open={showAdModal}
        onCancel={() => setShowAdModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAdModal(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handlePlaceAd}
            disabled={adDiceResult === null}
          >
            {t('game.market.ad.modalConfirm')}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>{t('game.market.ad.modalIntroTitle')}</strong></p>
          <p>{t('game.market.ad.costLine')}</p>
          <p>{t('game.market.ad.diceRule')}</p>
          <p style={{ color: '#999', fontSize: '12px' }}>{t('game.market.ad.note')}</p>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '24px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: 16
        }}>
          {adDiceResult === null ? (
            <>
              <p style={{ marginBottom: 16, fontSize: '14px', color: '#666' }}>
                {t('game.market.ad.rollPrompt')}
              </p>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleRollDice}
                disabled={isRolling}
                style={{
                  height: 56,
                  fontSize: 18,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #ff7a45 0%, #ff9c6e 100%)',
                  border: 'none',
                }}
              >
                {isRolling ? t('game.market.ad.rolling') : t('game.market.ad.rollButton')}
              </Button>
            </>
          ) : (
            <>
              <div style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: '#ff7a45',
                marginBottom: 8,
                animation: isRolling ? 'none' : 'bounce 0.5s ease'
              }}>
                🎲 {adDiceResult}
              </div>
              <p style={{ fontSize: 14, color: '#52c41a', marginBottom: 8 }}>
                {t('game.market.ad.rolled')}
              </p>
            </>
          )}
        </div>

        {adDiceResult !== null && (
          <Alert
            message={t('game.market.ad.resultAlert', { score: adDiceResult })}
            type="info"
            showIcon
          />
        )}
      </Modal>
    </>
  );
};
