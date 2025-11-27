import React from 'react';
import { Modal, Table, Typography, Divider, Tag, Space } from 'antd';
import { TrophyOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { RoundSummary } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { translateProductName } from '../../utils/productName';

const { Title, Text } = Typography;

const TOTAL_ROUNDS = 10;

interface RoundSettlementProps {
  visible: boolean;
  roundNumber: number;
  summaryData: RoundSummary[] | null;
  customerFlow?: any;
  rawSummary?: any;
  onClose: () => void;
}

export const RoundSettlement: React.FC<RoundSettlementProps> = ({
  visible,
  roundNumber,
  summaryData,
  customerFlow,
  rawSummary,
  onClose,
}) => {
  const { t } = useTranslation();
  
  // 检测是否为最后回合
  const isLastRound = roundNumber === TOTAL_ROUNDS;

  if (!summaryData || summaryData.length === 0) {
    return null;
  }

  // 按照利润排序
  const sortedPlayers = [...summaryData].sort((a, b) => b.round_profit - a.round_profit);

  const columns = [
    {
      title: t('game.settlement.rank'),
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => {
        const icons = ['🥇', '🥈', '🥉'];
        return (
          <Space>
            <span style={{ fontSize: 20 }}>{icons[index] || '🏅'}</span>
            <Text strong>{index + 1}</Text>
          </Space>
        );
      },
    },
    {
      title: t('game.settlement.player'),
      dataIndex: 'player_name',
      key: 'player_name',
      render: (name: string) => <Text strong style={{ fontSize: 16 }}>{name}</Text>,
    },
    {
      title: (
        <Space>
          <ShoppingOutlined />
          <span>{t('game.settlement.cupsSold')}</span>
        </Space>
      ),
      dataIndex: 'total_sold',
      key: 'total_sold',
      render: (sold: number) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
          {sold} {t('game.settlement.cup')}
        </Tag>
      ),
    },
    {
      title: (
        <Space>
          <DollarOutlined />
          <span>{t('game.settlement.revenue')}</span>
        </Space>
      ),
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (revenue: number) => (
        <Text style={{ fontSize: 16, color: '#52c41a', fontWeight: 'bold' }}>
          ¥{revenue.toFixed(2)}
        </Text>
      ),
    },
    {
      title: (
        <Space>
          <TrophyOutlined />
          <span>{t('game.settlement.roundProfit')}</span>
        </Space>
      ),
      dataIndex: 'round_profit',
      key: 'round_profit',
      render: (profit: number) => (
        <Text
          style={{
            fontSize: 18,
            color: profit >= 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
          }}
        >
          {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)}
        </Text>
      ),
    },
  ];

  // 计算总数据
  const totalSold = sortedPlayers.reduce((sum, p) => sum + p.total_sold, 0);
  const totalRevenue = sortedPlayers.reduce((sum, p) => sum + p.total_revenue, 0);

  // 未满足客流
  const unmetHigh =
    customerFlow && typeof customerFlow.high_tier_customers === 'number' && rawSummary?.allocation_result
      ? Math.max(customerFlow.high_tier_customers - (rawSummary.allocation_result.high_tier_served ?? 0), 0)
      : null;
  const unmetLow =
    customerFlow && typeof customerFlow.low_tier_customers === 'number' && rawSummary?.allocation_result
      ? Math.max(customerFlow.low_tier_customers - (rawSummary.allocation_result.low_tier_served ?? 0), 0)
      : null;

  // 产品高低客明细
  const productDetails = sortedPlayers.flatMap((p) =>
    (p.productions || []).map((prod: any) => ({
      player: p.nickname || p.player_name,
      product: translateProductName(prod.product_name, t),
      price: prod.price,
      produced: prod.produced,
      sold_high: prod.sold_to_high,
      sold_low: prod.sold_to_low,
      sold_total: prod.sold,
    })),
  );

  return (
    <Modal
      open={visible}
      title={
        <Title level={3} style={{ margin: 0, color: 'var(--color-milktea-brown)' }}>
          🎉 {t('game.settlement.title', { round: roundNumber })}
        </Title>
      }
      onCancel={onClose}
      onOk={onClose}
      okText={isLastRound ? t('game.settlement.viewResults') : t('game.settlement.continueGame')}
      cancelButtonProps={{ style: { display: 'none' } }}
      width={800}
      centered
    >
      <Divider />

      {/* 总体统计 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          color: 'white',
        }}
      >
        <Space size={48} style={{ width: '100%', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{t('game.settlement.totalSales')}</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>
              {totalSold} {t('game.settlement.cup')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{t('game.settlement.totalRevenue')}</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>
              ¥{totalRevenue.toFixed(2)}
            </div>
          </div>
        </Space>
      </div>

      {/* 玩家排名表格 */}
      <Table
        columns={columns}
        dataSource={sortedPlayers}
        pagination={false}
        rowKey="player_id"
        size="middle"
        style={{ marginBottom: 16 }}
      />

      <Divider />

      {/* 调试数据面板 */}
      <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
        <Title level={5} style={{ margin: 0 }}>{t('game.settlement.debug.title')}</Title>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          <div>
            <Text type="secondary">{t('game.settlement.debug.customerFlow')}</Text>
            <div>
              {t('game.settlement.debug.highTier')}：{customerFlow?.high_tier_customers ?? t('game.settlement.debug.unknown')} / {t('game.settlement.debug.lowTier')}：{customerFlow?.low_tier_customers ?? t('game.settlement.debug.unknown')}
            </div>
            {(unmetHigh !== null || unmetLow !== null) && (
              <div style={{ color: '#fa8c16' }}>
                {t('game.settlement.debug.unmet')}：{t('game.settlement.debug.highTier')} {unmetHigh ?? '-'} / {t('game.settlement.debug.lowTier')} {unmetLow ?? '-'}
              </div>
            )}
          </div>
          <div>
            <Text type="secondary">{t('game.settlement.debug.totalRevenue')}</Text>
            <div>￥{totalRevenue.toFixed(2)}</div>
          </div>
          <div>
            <Text type="secondary">{t('game.settlement.debug.totalSales')}</Text>
            <div>{totalSold} {t('game.settlement.cup')}</div>
          </div>
        </div>
        {productDetails.length > 0 && (
          <details style={{ marginTop: 8 }} open>
            <summary style={{ cursor: 'pointer' }}>{t('game.settlement.debug.productDetail')}</summary>
            <table style={{ width: '100%', marginTop: 8, fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'left' }}>{t('game.settlement.debug.tableHeaders.player')}</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'left' }}>{t('game.settlement.debug.tableHeaders.product')}</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>{t('game.settlement.debug.tableHeaders.price')}</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>{t('game.settlement.debug.tableHeaders.produced')}</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>{t('game.settlement.debug.tableHeaders.highTier')}</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>{t('game.settlement.debug.tableHeaders.lowTier')}</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>{t('game.settlement.debug.tableHeaders.totalSold')}</th>
                </tr>
              </thead>
              <tbody>
                {productDetails.map((d, idx) => (
                  <tr key={`${d.player}-${d.product}-${idx}`}>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4 }}>{d.player}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4 }}>{d.product}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4, textAlign: 'right' }}>￥{d.price}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4, textAlign: 'right' }}>{d.produced}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4, textAlign: 'right' }}>{d.sold_high}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4, textAlign: 'right' }}>{d.sold_low}</td>
                    <td style={{ borderBottom: '1px solid #f5f5f5', padding: 4, textAlign: 'right' }}>{d.sold_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
        {rawSummary && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer' }}>{t('game.settlement.debug.rawData')}</summary>
            <pre style={{ background: '#fff', padding: 8, maxHeight: 240, overflow: 'auto', border: '1px solid #eee' }}>
              {JSON.stringify(rawSummary, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </Modal>
  );
};
