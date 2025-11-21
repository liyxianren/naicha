import React, { useEffect, useState } from 'react';
import { App, Form, Input, Button, Card, Statistic, Row, Col } from 'antd';
import { ShopOutlined, HomeOutlined } from '@ant-design/icons';
import { shopApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import { useDecisionStore } from '../../stores/decisionStore';
import type { Shop } from '../../types';

export const ShopDecision: React.FC = () => {
  const { currentPlayer, currentGame } = useGameStore();
  const { shop, setShop, hasShopInfo, setHasShopInfo } = useDecisionStore();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [decorationCosts, setDecorationCosts] = useState({});
  const [selectedLevel, setSelectedLevel] = useState(0);

  // 只在shop状态改变时打印日志
  if (shop && !shop.__logged) {
    console.log('🏠 商店信息:', { rent: shop.rent, decoration_level: shop.decoration_level, max_employees: shop.max_employees });
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
      console.error('加载装修费用失败:', error);
    }
  };

  const loadShopInfo = async (): Promise<Shop | null> => {
    if (!currentPlayer) return null;

    try {
      const response = await shopApi.getShop(currentPlayer.id);
      if (response.success) {
        // 后端现在返回 has_shop 字段来表示玩家是否有店铺
        if (response.data) {
          syncShopState(response.data);
          return response.data;
        } else {
          // 玩家还没有店铺，这是正常情况
          setHasShopInfo(true);
          return null;
        }
      }
    } catch (error: any) {
      // 只有真正的错误才打印（4xx/5xx错误已经被前端过滤）
      console.error('加载店铺信息失败:', error);
    }

    return null;
  };

  const handleOpenShop = async (values: any) => {
    if (!currentPlayer || !currentGame) return;

    setLoading(true);
    try {
      const targetLevel = selectedLevel;
      const openResponse = await shopApi.openShop({
        player_id: currentPlayer.id,
        location: values.location || '商业街',
        rent: Number(values.rent),
        round_number: currentGame.current_round,
      });

      if (openResponse.success && openResponse.data) {
        message.success('开店成功！');
        const createdShop = openResponse.data;
        syncShopState(createdShop);

        if (targetLevel > (createdShop.decoration_level ?? 0)) {
          const upgradeResponse = await shopApi.upgradeDecoration(currentPlayer.id, targetLevel);
          if (upgradeResponse.success && upgradeResponse.data) {
            message.success(`装修升级成功！达到${targetLevel}级`);
            // Map the response to Shop object
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
      message.error(error.error || '开店失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeDecoration = async (targetLevel: number) => {
    if (!currentPlayer) return;

    const currentShop = shop ?? (await loadShopInfo());
    if (!currentShop) {
      message.warning('请先开设一家门店');
      return;
    }

    if (targetLevel <= currentShop.decoration_level) {
      message.info('当前装修等级已达到或超过目标等级');
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 发送升级请求 - targetLevel:', targetLevel);
      const response = await shopApi.upgradeDecoration(currentPlayer.id, targetLevel);
      console.log('🔧 升级响应:', response);
      if (response.success && response.data) {
        message.success('装修升级成功！');
        // Response.data now contains the full shop info
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
      console.error('❌ 升级失败:', error);
      message.error(error.error || '升级失败');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    const rent = Number(form.getFieldValue('rent')) || 0;
    const decorationCost = selectedLevel > 0 ? decorationCosts[selectedLevel]?.cost || 0 : 0;
    return rent + decorationCost;
  };

  const renderDecorationCard = (level: number) => {
    const titles = ['简陋', '普通', '精致', '豪华'];
    const emojis = ['🪑', '🪴', '🎀', '💎'];
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
        <div style={{ fontSize: '24px', marginBottom: 4 }}>{emojis[level] || '✨'}</div>
        <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
          {level === 0 ? '默认装修' : `${titles[level]}装修`}
        </div>
        <div style={{ color: '#666', fontSize: 11 }}>
          {level === 0 ? '¥0' : `¥${decorationCosts[level]?.cost || 0}`}
        </div>
        <div style={{ color: '#666', fontSize: 11 }}>
          容纳 {decorationCosts[level]?.max_employees || 0} 员工
        </div>
      </Card>
    );
  };

  if (shop) {
    const decorationLevels = ['默认装修', '简陋装修', '普通装修', '精致装修', '豪华装修'];
    const decorationName = decorationLevels[shop.decoration_level] || '未知';

    return (
      <Card className="card-cute">
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>🏠 我的门店</h3>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="门店位置" value={shop.location || '商业街'} prefix={<ShopOutlined />} />
            </Col>
            <Col span={8}>
              <Statistic title="每回合租金" value={shop.rent || 0} prefix="¥" />
            </Col>
            <Col span={8}>
              <Statistic title="装修等级" value={decorationName} valueStyle={{ fontSize: '18px' }} />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Statistic
                title="可容纳员工"
                value={shop.max_employees || decorationCosts[shop.decoration_level]?.max_employees || 0}
                suffix="人"
              />
            </Col>
          </Row>
        </div>

        <Card size="small" className="card-cute" style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 16 }}>升级装修</h4>
          <Row gutter={16}>
            {[1, 2, 3].map((level) => {
              const cost = decorationCosts[level]?.cost || 0;
              const maxEmp = decorationCosts[level]?.max_employees || 0;
              const isDisabled = level <= shop.decoration_level;

              return (
                <Col span={8} key={level}>
                  <Button
                    block
                    disabled={isDisabled}
                    loading={loading}
                    onClick={() => handleUpgradeDecoration(level)}
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    {isDisabled ? `Lv.${level} (已拥有)` : `升级到 Lv.${level} (¥${cost})`}
                  </Button>
                  <div style={{ textAlign: 'center', marginTop: 4, fontSize: '12px', color: '#666' }}>
                    容纳{maxEmp}人
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
      <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>🏗️ 开设门店</h3>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleOpenShop}
        initialValues={{ location: '商业街', rent: 500 }}
      >
        <Form.Item label="门店位置" name="location" tooltip="可以自定义门店所在的商圈">
          <Input prefix={<HomeOutlined />} placeholder="请输入门店位置" style={{ borderRadius: 'var(--radius-sm)' }} />
        </Form.Item>

        <Form.Item
          label="每回合租金"
          name="rent"
          rules={[
            { required: true, message: '请输入租金' },
            { type: 'number', min: 0, transform: (value) => Number(value), message: '租金必须大于0' },
          ]}
          tooltip="每回合需要支付的租金"
        >
          <Input
            type="number"
            prefix="¥"
            placeholder="请输入租金"
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
        </Form.Item>

        <Form.Item label="选择装修等级" tooltip="装修等级决定可雇佣的员工数量">
          <Row gutter={16}>{[0, 1, 2, 3].map((level) => <Col span={6} key={level}>{renderDecorationCard(level)}</Col>)}</Row>
        </Form.Item>

        <Card size="small" style={{ background: '#F5F5F5', marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="租金" value={form.getFieldValue('rent') || 0} prefix="¥" valueStyle={{ fontSize: 16 }} />
            </Col>
            <Col span={8}>
              <Statistic
                title="装修费"
                value={selectedLevel > 0 ? decorationCosts[selectedLevel]?.cost || 0 : 0}
                prefix="¥"
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="总计"
                value={getTotalCost()}
                prefix="¥"
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
            🚀 确认开店
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

