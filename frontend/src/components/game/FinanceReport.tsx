import React, { useState, useEffect } from 'react';
import { Button, Drawer, Tabs, Table, Typography, Spin, Empty, Tag, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { financeApi } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import type { FinanceRecord } from '../../types';

const { Title, Text } = Typography;

interface FinanceReportProps {
  playerId: number;
  currentCash: number;
  currentRound: number;
}

export const FinanceReport: React.FC<FinanceReportProps> = ({
  playerId,
  currentCash,
  currentRound,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [activeRound, setActiveRound] = useState<string>('1');

  const loadRecords = async () => {
    if (!playerId) return;
    
    setLoading(true);
    try {
      const response = await financeApi.getAllRecords(playerId);
      if (response.success && response.data) {
        setRecords(response.data);
        // 默认选中最新回合
        if (response.data.length > 0) {
          const latestRound = Math.max(...response.data.map(r => r.round_number));
          setActiveRound(String(latestRound));
        }
      }
    } catch (error) {
      console.error('Failed to load finance records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible, playerId]);

  const formatMoney = (amount: number, isExpense: boolean = false) => {
    const sign = isExpense ? '-' : '+';
    const color = isExpense ? '#ff4d4f' : '#52c41a';
    return (
      <Text style={{ color, fontWeight: 'bold' }}>
        {isExpense ? sign : (amount > 0 ? sign : '')}¥{Math.abs(amount).toFixed(2)}
      </Text>
    );
  };

  const getExpenseItems = (record: FinanceRecord) => {
    const items = [
      { key: 'revenue', label: t('game.report.items.revenue'), value: record.revenue.total, isExpense: false },
      { key: 'material', label: t('game.report.items.material'), value: record.expenses.material, isExpense: true },
      { key: 'salary', label: t('game.report.items.salary'), value: record.expenses.salary, isExpense: true },
      { key: 'rent', label: t('game.report.items.rent'), value: record.expenses.rent, isExpense: true },
      { key: 'decoration', label: t('game.report.items.decoration'), value: record.expenses.decoration, isExpense: true },
      { key: 'marketResearch', label: t('game.report.items.marketResearch'), value: record.expenses.market_research, isExpense: true },
      { key: 'advertisement', label: t('game.report.items.advertisement'), value: record.expenses.advertisement, isExpense: true },
      { key: 'productResearch', label: t('game.report.items.productResearch'), value: record.expenses.product_research, isExpense: true },
    ];
    
    // 只显示有值的项目
    return items.filter(item => item.value !== 0);
  };

  const columns = [
    {
      title: t('game.report.itemColumn'),
      dataIndex: 'label',
      key: 'label',
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: t('game.report.amountColumn'),
      dataIndex: 'value',
      key: 'value',
      align: 'right' as const,
      render: (_: any, record: { value: number; isExpense: boolean }) => 
        formatMoney(record.value, record.isExpense),
    },
  ];

  const tabItems = records.map(record => ({
    key: String(record.round_number),
    label: t('game.report.round', { n: record.round_number }),
    children: (
      <div>
        <Table
          dataSource={getExpenseItems(record)}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="key"
          style={{ marginBottom: 16 }}
        />
        
        {/* 回合利润汇总 */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
          borderRadius: 8,
          padding: 16,
          marginTop: 16,
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{t('game.report.items.roundProfit')}</Text>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: record.profit.round >= 0 ? '#52c41a' : '#ff4d4f',
              }}>
                {record.profit.round >= 0 ? '+' : ''}¥{record.profit.round.toFixed(2)}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{t('game.report.items.cumulativeProfit')}</Text>
              <Text style={{
                fontSize: 14,
                color: record.profit.cumulative >= 0 ? '#52c41a' : '#ff4d4f',
              }}>
                {record.profit.cumulative >= 0 ? '+' : ''}¥{record.profit.cumulative.toFixed(2)}
              </Text>
            </div>
          </Space>
        </div>
      </div>
    ),
  }));

  return (
    <>
      {/* 浮动按钮 */}
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          left: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          height: 48,
          borderRadius: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
        }}
      >
        {t('game.report.title')}
      </Button>

      {/* 抽屉面板 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ fontSize: 20, color: '#667eea' }} />
            <span>{t('game.report.title')}</span>
          </div>
        }
        placement="left"
        width={400}
        onClose={() => setVisible(false)}
        open={visible}
      >
        <Spin spinning={loading}>
          {/* 当前资金汇总 */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            color: 'white',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {t('game.report.currentCash')}
            </Text>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 4 }}>
              ¥{currentCash.toLocaleString()}
            </div>
            <Tag color="rgba(255,255,255,0.2)" style={{ marginTop: 8, color: 'white' }}>
              {t('game.header.roundProgress', { current: currentRound, total: 10 })}
            </Tag>
          </div>

          {/* 回合选择和详情 */}
          {records.length > 0 ? (
            <Tabs
              activeKey={activeRound}
              onChange={setActiveRound}
              items={tabItems}
              size="small"
            />
          ) : (
            <Empty
              description={t('game.report.noData')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Spin>
      </Drawer>
    </>
  );
};

