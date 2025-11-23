import React from 'react';
import { Modal, Table, Typography, Divider, Tag, Space } from 'antd';
import { TrophyOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { RoundSummary } from '../../types';

const { Title, Text } = Typography;

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
  if (!summaryData || summaryData.length === 0) {
    return null;
  }

  // 按照利润排序
  const sortedPlayers = [...summaryData].sort((a, b) => b.round_profit - a.round_profit);

  const columns = [
    {
      title: '排名',
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
      title: '玩家',
      dataIndex: 'player_name',
      key: 'player_name',
      render: (name: string) => <Text strong style={{ fontSize: 16 }}>{name}</Text>,
    },
    {
      title: (
        <Space>
          <ShoppingOutlined />
          <span>销售杯数</span>
        </Space>
      ),
      dataIndex: 'total_sold',
      key: 'total_sold',
      render: (sold: number) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
          {sold} 杯
        </Tag>
      ),
    },
    {
      title: (
        <Space>
          <DollarOutlined />
          <span>营业额</span>
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
          <span>回合利润</span>
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
      product: prod.product_name,
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
          🎉 第 {roundNumber} 回合结算
        </Title>
      }
      onCancel={onClose}
      onOk={onClose}
      okText="继续游戏"
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
            <div style={{ fontSize: 14, opacity: 0.9 }}>本回合总销量</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>
              {totalSold} 杯
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, opacity: 0.9 }}>本回合总营业额</div>
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
        <Title level={5} style={{ margin: 0 }}>调试数据</Title>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          <div>
            <Text type="secondary">客流</Text>
            <div>
              高消费：{customerFlow?.high_tier_customers ?? '未知'} / 低消费：{customerFlow?.low_tier_customers ?? '未知'}
            </div>
            {(unmetHigh !== null || unmetLow !== null) && (
              <div style={{ color: '#fa8c16' }}>
                未满足：高 {unmetHigh ?? '-'} / 低 {unmetLow ?? '-'}
              </div>
            )}
          </div>
          <div>
            <Text type="secondary">总营收</Text>
            <div>￥{totalRevenue.toFixed(2)}</div>
          </div>
          <div>
            <Text type="secondary">总销量</Text>
            <div>{totalSold} 杯</div>
          </div>
        </div>
        {productDetails.length > 0 && (
          <details style={{ marginTop: 8 }} open>
            <summary style={{ cursor: 'pointer' }}>产品明细（高/低客）</summary>
            <table style={{ width: '100%', marginTop: 8, fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'left' }}>玩家</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'left' }}>产品</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>价格</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>产量</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>高客</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>低客</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: 4, textAlign: 'right' }}>总售</th>
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
            <summary style={{ cursor: 'pointer' }}>原始结算数据</summary>
            <pre style={{ background: '#fff', padding: 8, maxHeight: 240, overflow: 'auto', border: '1px solid #eee' }}>
              {JSON.stringify(rawSummary, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </Modal>
  );
};
