import React, { useEffect, useState } from 'react';
import { App, Form, Button, Card, Statistic, Row, Col, InputNumber } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { shopApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import { useDecisionStore } from '../../stores/decisionStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { Shop } from '../../types';

export const ShopDecision: React.FC = () => {
  const { currentPlayer, currentGame } = useGameStore();
  const { shop, setShop, hasShopInfo, setHasShopInfo } = useDecisionStore();
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [decorationCosts, setDecorationCosts] = useState<Record<number, { cost: number; max_employees: number }>>({});
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [rentInput, setRentInput] = useState<number | null>(null);

  if (shop && !(shop as any).__logged) {
    console.log('[Shop] info:', { rent: shop.rent, decoration_level: shop.decoration_level, max_employees: shop.max_employees });
    (shop as any).__logged = true;
  }

  useEffect(() => {
    loadDecorationCosts();
  }, []);

  useEffect(() => {
    if (!currentPlayer || hasShopInfo) return;
    loadShopInfo();
  }, [currentPlayer?.id, hasShopInfo]);

  const syncShopState = (shopData: Shop) => {
    setShop(shopData);
    setSelectedLevel(shopData.decoration_level ?? 0);
    setHasShopInfo(true);
  };

  const loadDecorationCosts = async () => {
    try {
      const response = await shopApi.getDecorationCosts();
      if (response.success && response.data) {
        setDecorationCosts(response.data as Record<number, { cost: number; max_employees: number }>);
      }
    } catch (error) {
      console.error('Failed to load decoration costs:', error);
    }
  };

  const loadShopInfo = async (): Promise<Shop | null> => {
    if (!currentPlayer) return null;

    try {
      const response = await shopApi.getShop(currentPlayer.id);
      if (response.success) {
        if (response.data) {
          syncShopState(response.data);
          return response.data;
        } else {
          setHasShopInfo(true);
          return null;
        }
      }
    } catch (error: any) {
      console.error('Failed to load shop info:', error);
    }

    return null;
  };

  const handleOpenShop = async () => {
    if (!currentPlayer || !currentGame) return;

    // 验证租金输入
    if (!rentInput || rentInput <= 0) {
      message.error(t('game.shop.messages.rentRequired'));
      return;
    }

    setLoading(true);
    try {
      const targetLevel = selectedLevel;
      const openResponse = await shopApi.openShop({
        player_id: currentPlayer.id,
        round_number: currentGame.current_round,
        rent: rentInput,
      });

      if (openResponse.success && openResponse.data) {
        message.success(t('game.shop.messages.openSuccess', { rent: rentInput }));
        const createdShop = openResponse.data;
        syncShopState(createdShop);

        if (targetLevel > (createdShop.decoration_level ?? 0)) {
          const upgradeResponse = await shopApi.upgradeDecoration(currentPlayer.id, targetLevel);
          if (upgradeResponse.success && upgradeResponse.data) {
            message.success(t('game.shop.messages.upgradeSuccess', { level: targetLevel }));
            const shopData: Shop = {
              id: upgradeResponse.data.id,
              player_id: upgradeResponse.data.player_id,
              location: upgradeResponse.data.location,
              rent: upgradeResponse.data.rent,
              decoration_level: upgradeResponse.data.decoration_level,
              max_employees: upgradeResponse.data.max_employees,
              created_round: upgradeResponse.data.created_round,
            };
            syncShopState(shopData);
          }
        }
      }
    } catch (error: any) {
      message.error(error?.error || t('game.shop.messages.openFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeDecoration = async (targetLevel: number) => {
    if (!currentPlayer) return;

    const currentShop = shop ?? (await loadShopInfo());
    if (!currentShop) {
      message.warning(t('game.shop.messages.needShopFirst'));
      return;
    }

    if (targetLevel <= currentShop.decoration_level) {
      message.info(t('game.shop.messages.noUpgradeNeeded'));
      return;
    }

    setLoading(true);
    try {
      const response = await shopApi.upgradeDecoration(currentPlayer.id, targetLevel);
      if (response.success && response.data) {
        message.success(t('game.shop.messages.upgradeSuccess', { level: targetLevel }));
        const shopData: Shop = {
          id: response.data.id,
          player_id: response.data.player_id,
          location: response.data.location,
          rent: response.data.rent,
          decoration_level: response.data.decoration_level,
          max_employees: response.data.max_employees,
          created_round: response.data.created_round,
        };
        syncShopState(shopData);
      }
    } catch (error: any) {
      console.error('Upgrade failed:', error);
      message.error(error?.error || t('game.shop.messages.upgradeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    const decorationCost = selectedLevel > 0 ? decorationCosts[selectedLevel]?.cost || 0 : 0;
    const rent = rentInput || 0;
    return rent + decorationCost;
  };

  const renderDecorationCard = (level: number) => {
    const titles = [
      t('game.shop.decorationLevels.default'),
      t('game.shop.decorationLevels.simple'),
      t('game.shop.decorationLevels.standard'),
      t('game.shop.decorationLevels.refined'),
      t('game.shop.decorationLevels.luxury'),
    ];
    const emojis = ['🏠', '🧱', '🏡', '🏘️', '🏰'];
    const cost = decorationCosts[level]?.cost || 0;
    const capacity = decorationCosts[level]?.max_employees || 0;
    const title = titles[level] ?? t('game.shop.decorationLevels.unknown');
    const costText = level === 0
      ? t('game.shop.decorationCard.free')
      : t('game.shop.decorationCard.cost', { cost });
    const capacityText = t('game.shop.decorationCard.employees', { count: capacity });

    return (
      <Card
        hoverable
        onClick={() => setSelectedLevel(level)}
        style={{
          textAlign: 'center',
          borderColor: selectedLevel === level ? 'var(--color-milktea-pink)' : '#d9d9d9',
          borderWidth: selectedLevel === level ? 2 : 1,
          background: selectedLevel === level ? '#FFF5F5' : 'white',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: 4 }}>{emojis[level] || '🏠'}</div>
        <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ color: '#666', fontSize: 11 }}>
          {costText}
        </div>
        <div style={{ color: '#666', fontSize: 11 }}>
          {capacityText}
        </div>
      </Card>
    );
  };

  if (shop) {
    const decorationLevels = [
      t('game.shop.decorationLevels.default'),
      t('game.shop.decorationLevels.simple'),
      t('game.shop.decorationLevels.standard'),
      t('game.shop.decorationLevels.refined'),
      t('game.shop.decorationLevels.luxury'),
    ];
    const decorationName = decorationLevels[shop.decoration_level] || t('game.shop.decorationLevels.unknown');

    return (
      <Card className="card-cute">
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>{t('game.shop.myShopTitle')}</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic title={t('game.shop.rentPerRound')} value={shop.rent || 0} prefix="￥" />
            </Col>
            <Col span={12}>
              <Statistic title={t('game.shop.decorationLevel')} value={decorationName} valueStyle={{ fontSize: '18px' }} />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Statistic
                title={t('game.shop.capacity')}
                value={shop.max_employees || decorationCosts[shop.decoration_level]?.max_employees || 0}
                suffix={t('game.shop.capacityUnit')}
              />
            </Col>
          </Row>
        </div>

        <Card size="small" className="card-cute" style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 16 }}>{t('game.shop.upgradeTitle')}</h4>
          <Row gutter={16}>
            {[1, 2, 3].map((level) => {
              const cost = decorationCosts[level]?.cost || 0;
              const maxEmp = decorationCosts[level]?.max_employees || 0;
              const isDisabled = level <= shop.decoration_level;
              const buttonLabel = isDisabled
                ? t('game.shop.upgradeOwned', { level })
                : t('game.shop.upgradeTo', { level, cost });

              return (
                <Col span={8} key={level}>
                  <Button
                    block
                    disabled={isDisabled}
                    loading={loading}
                    onClick={() => handleUpgradeDecoration(level)}
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    {buttonLabel}
                  </Button>
                  <div style={{ textAlign: 'center', marginTop: 4, fontSize: '12px', color: '#666' }}>
                    {t('game.shop.capacityCount', { count: maxEmp })}
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      </Card>
    );
  }

  return (
    <Card className="card-cute">
      <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>{t('game.shop.openShopTitle')}</h3>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleOpenShop}
      >
        <Form.Item
          label={t('game.shop.rentInputLabel')}
          required
          tooltip={t('game.shop.rentInputTip')}
        >
          <InputNumber
            min={0.01}
            step={1}
            precision={2}
            value={rentInput}
            onChange={(value) => setRentInput(value)}
            placeholder={t('game.shop.rentInputPlaceholder')}
            style={{ width: '100%' }}
            prefix="￥"
          />
        </Form.Item>

        <Form.Item
          label={t('game.shop.selectDecoration')}
          tooltip={t('game.shop.decorationTip')}
        >
          <Row gutter={16}>
            {[0, 1, 2, 3].map((level) => (
              <Col span={6} key={level}>
                {renderDecorationCard(level)}
              </Col>
            ))}
          </Row>
        </Form.Item>

        <Card size="small" style={{ background: '#F5F5F5', marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title={t('game.shop.rentLabel')} value={rentInput || 0} prefix="￥" valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={8}>
              <Statistic
                title={t('game.shop.decorationCostLabel')}
                value={selectedLevel > 0 ? decorationCosts[selectedLevel]?.cost || 0 : 0}
                prefix="￥"
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t('game.shop.totalLabel')}
                value={getTotalCost()}
                prefix="￥"
                valueStyle={{ fontSize: 16, color: 'var(--color-milktea-brown)' }}
              />
            </Col>
          </Row>
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            style={{
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-milk-tea)',
              border: 'none',
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            {t('game.shop.confirmOpen')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
