import React, { useState } from 'react';
import { Card, Row, Col, Button, App, Modal, InputNumber, Alert, Statistic } from 'antd';
import { SoundOutlined, LineChartOutlined } from '@ant-design/icons';
import { marketApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';

interface MarketActionProps {
  disabled?: boolean;
}

/**
 * 市场行动：广告分为玩家级，不选产品。线下掷骰子输入结果，扣费用。
 */
export const MarketAction: React.FC<MarketActionProps> = ({ disabled = false }) => {
  const { currentPlayer, currentGame, setCurrentPlayer } = useGameStore();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);

  const [showAdModal, setShowAdModal] = useState(false);
  const [adDiceResult, setAdDiceResult] = useState<number>(1);

  const handleAdvertisement = () => {
    setAdDiceResult(1);
    setShowAdModal(true);
  };

  const handlePlaceAd = async () => {
    if (!currentPlayer || !currentGame) return;
    setLoading(true);
    try {
      const response = await marketApi.placeAdvertisement({
        player_id: currentPlayer.id,
        round_number: currentGame.current_round,
        dice_result: adDiceResult,
      });
      if (response.success && response.data) {
        setShowAdModal(false);
        modal.success({
          title: '广告投放成功！',
          content: (
            <div>
              <p>本回合广告分：{response.data.ad_score}</p>
              <p>花费：￥{response.data.cost}，余额：￥{response.data.remaining_cash}</p>
            </div>
          ),
        });
        setCurrentPlayer({ ...currentPlayer, cash: response.data.remaining_cash });
      }
    } catch (error: any) {
      message.error(error.error || '广告投放失败');
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
        const { next_round, customer_flow, remaining_cash, cost } = response.data;
        modal.info({
          title: `第${next_round}回合客流预估`,
          content: (
            <div>
              <p><strong>高消费客户：</strong>{customer_flow.high_tier_customers} 人</p>
              <p><strong>低消费客户：</strong>{customer_flow.low_tier_customers} 人</p>
              <p style={{ color: '#999', fontSize: '12px', marginTop: 12 }}>
                花费：￥{cost}，余额：￥{remaining_cash}
              </p>
              <p style={{ color: '#999', fontSize: '12px', marginTop: 8 }}>
                提示：此为下回合客流数据，请据此调整生产计划
              </p>
            </div>
          ),
        });
        setCurrentPlayer({ ...currentPlayer, cash: remaining_cash });
      }
    } catch (error: any) {
      message.error(error.error || '市场调研失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="card-cute" style={{ opacity: disabled ? 0.6 : 1 }}>
        <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>📣 市场行动</h3>

        <Row gutter={16}>
          <Col span={12}>
            <Card hoverable={!disabled} style={{ borderColor: '#ff7a45', borderWidth: 2, height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <SoundOutlined style={{ fontSize: 32, color: '#ff7a45', marginBottom: 12 }} />
                <h4>投放广告</h4>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: 12 }}>
                  线下掷骰子（1-6），结果作为本回合广告分<br />
                  <strong>注意：广告分不累计，每回合独立计算</strong>
                </p>
                <Statistic title="费用" value={800} prefix="￥" valueStyle={{ fontSize: 20 }} />
                <Button
                  type="primary"
                  block
                  icon={<SoundOutlined />}
                  onClick={handleAdvertisement}
                  disabled={disabled}
                  loading={loading}
                  style={{
                    marginTop: 12,
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #ff7a45 0%, #ff9c6e 100%)',
                    border: 'none',
                  }}
                >
                  投放广告
                </Button>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card hoverable={!disabled} style={{ borderColor: '#1890ff', borderWidth: 2, height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <LineChartOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 12 }} />
                <h4>市场调研</h4>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: 12 }}>
                  查看下回合客流数据<br />
                  （高消费客户 + 低消费客户）
                </p>
                <Statistic title="费用" value={500} prefix="￥" valueStyle={{ fontSize: 20 }} />
                <Button
                  type="primary"
                  block
                  icon={<LineChartOutlined />}
                  onClick={handleMarketResearch}
                  disabled={disabled}
                  loading={loading}
                  style={{
                    marginTop: 12,
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    border: 'none',
                  }}
                >
                  市场调研
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="投放广告"
        open={showAdModal}
        onCancel={() => setShowAdModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAdModal(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handlePlaceAd}>
            确认投放
          </Button>,
        ]}
      >
        <Alert
          message="请在线下掷一个6面骰子，然后在下方输入结果"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ marginBottom: 8 }}>请输入骰子结果（1-6）：</p>
          <InputNumber
            min={1}
            max={6}
            value={adDiceResult}
            onChange={(value) => setAdDiceResult(value || 1)}
            style={{ width: 120 }}
            size="large"
          />
        </div>
        <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#1890ff' }}>
            费用：￥800 | 本回合广告分将设置为：{adDiceResult}
          </p>
        </div>
      </Modal>
    </>
  );
};
