import React, { useState, useEffect, useCallback } from 'react';
import { Button, Drawer, Tabs, Table, Typography, Spin, Empty, Tag, Space, Card, Row, Col, Statistic, Divider, Tooltip } from 'antd';
import { FileTextOutlined, ShopOutlined, TeamOutlined, ExperimentOutlined, SoundOutlined, BulbOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { financeApi } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { getProductDisplayName } from '../../utils/productName';
import type { FinanceRecord, DetailedFinanceReport, ProductDetail, MaterialPurchaseDetail } from '../../types';

const { Title, Text } = Typography;

interface FinanceReportProps {
  playerId: number;
  currentCash: number;
  currentRound: number;
}

// Material type display names
const MATERIAL_NAMES: Record<string, { zh: string; en: string; emoji: string }> = {
  tea: { zh: '茶叶', en: 'Tea', emoji: '🍵' },
  milk: { zh: '牛奶', en: 'Milk', emoji: '🥛' },
  fruit: { zh: '水果', en: 'Fruit', emoji: '🍓' },
  ingredient: { zh: '配料', en: 'Topping', emoji: '🧋' },
};

export const FinanceReport: React.FC<FinanceReportProps> = ({
  playerId,
  currentCash,
  currentRound,
}) => {
  const { t, language } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [detailedData, setDetailedData] = useState<Record<number, DetailedFinanceReport>>({});
  const [activeRound, setActiveRound] = useState<string>('1');
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const loadDetailedReport = useCallback(async (roundNumber: number) => {
    if (!playerId || detailedData[roundNumber]) return;
    
    setLoadingDetail(true);
    try {
      const response = await financeApi.getDetailedRoundReport(playerId, roundNumber);
      if (response.success && response.data) {
        setDetailedData(prev => ({
          ...prev,
          [roundNumber]: response.data!
        }));
      }
    } catch (error) {
      console.error('Failed to load detailed report:', error);
    } finally {
      setLoadingDetail(false);
    }
  }, [playerId, detailedData]);

  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible, playerId]);

  useEffect(() => {
    if (visible && activeRound) {
      loadDetailedReport(parseInt(activeRound));
    }
  }, [visible, activeRound, loadDetailedReport]);

  const formatMoney = (amount: number, showSign: boolean = false) => {
    const sign = showSign ? (amount >= 0 ? '+' : '') : '';
    const color = amount >= 0 ? '#52c41a' : '#ff4d4f';
    return (
      <Text style={{ color, fontWeight: 'bold' }}>
        {sign}¥{amount.toFixed(2)}
      </Text>
    );
  };

  const getMaterialName = (type: string) => {
    const material = MATERIAL_NAMES[type];
    if (!material) return type;
    return `${material.emoji} ${language === 'zh-CN' ? material.zh : material.en}`;
  };

  // Product sales columns
  const productColumns = [
    {
      title: t('game.report.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name: string) => (
        <Text strong>{getProductDisplayName(name, language)}</Text>
      ),
    },
    {
      title: t('game.report.price'),
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      render: (price: number) => `¥${price}`,
    },
    {
      title: t('game.report.produced'),
      dataIndex: 'produced_quantity',
      key: 'produced_quantity',
      align: 'center' as const,
    },
    {
      title: t('game.report.sold'),
      dataIndex: 'sold_quantity',
      key: 'sold_quantity',
      align: 'center' as const,
      render: (sold: number, record: ProductDetail) => (
        <Tooltip title={
          <div>
            <div>👑 {t('game.report.highTier')}: {record.sold_to_high_tier}</div>
            <div>💰 {t('game.report.lowTier')}: {record.sold_to_low_tier}</div>
          </div>
        }>
          <Space>
            <span>{sold}</span>
            {record.sold_to_high_tier > 0 && (
              <Tag color="gold" style={{ margin: 0 }}>👑{record.sold_to_high_tier}</Tag>
            )}
            {record.sold_to_low_tier > 0 && (
              <Tag color="blue" style={{ margin: 0 }}>💰{record.sold_to_low_tier}</Tag>
            )}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: t('game.report.revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (rev: number) => formatMoney(rev),
    },
    {
      title: t('game.report.cost'),
      dataIndex: 'material_cost',
      key: 'material_cost',
      align: 'right' as const,
      render: (cost: number) => <Text type="danger">-¥{cost.toFixed(2)}</Text>,
    },
    {
      title: t('game.report.profit'),
      dataIndex: 'profit',
      key: 'profit',
      align: 'right' as const,
      render: (profit: number) => formatMoney(profit, true),
    },
  ];

  // Material purchase columns
  const materialColumns = [
    {
      title: t('game.report.material'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getMaterialName(type),
    },
    {
      title: t('game.report.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
    },
    {
      title: t('game.report.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right' as const,
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: t('game.report.discount'),
      dataIndex: 'discount_rate',
      key: 'discount_rate',
      align: 'center' as const,
      render: (rate: number) => {
        const discountPercent = Math.round((1 - rate) * 100);
        if (discountPercent > 0) {
          return <Tag color="green">-{discountPercent}%</Tag>;
        }
        return <Tag>-</Tag>;
      },
    },
    {
      title: t('game.report.total'),
      dataIndex: 'total_cost',
      key: 'total_cost',
      align: 'right' as const,
      render: (total: number) => <Text type="danger">-¥{total.toFixed(2)}</Text>,
    },
  ];

  const renderDetailedContent = (record: FinanceRecord) => {
    const roundNum = record.round_number;
    const detailed = detailedData[roundNum];

    if (loadingDetail && !detailed) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip={t('common.loading')} />
        </div>
      );
    }

    // If no detailed data available, show basic view
    const products = detailed?.revenue.products || [];
    const materials = detailed?.expenses.materials.purchased || {};
    const materialList = Object.entries(materials).map(([type, data]) => ({
      type,
      ...(data as MaterialPurchaseDetail)
    }));

    return (
      <div>
        {/* Summary Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #52c41a20 0%, #52c41a10 100%)', border: 'none' }}>
              <Statistic
                title={<Text type="secondary">{t('game.report.totalRevenue')}</Text>}
                value={record.revenue.total}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#52c41a', fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #ff4d4f20 0%, #ff4d4f10 100%)', border: 'none' }}>
              <Statistic
                title={<Text type="secondary">{t('game.report.totalExpense')}</Text>}
                value={record.expenses.total}
                precision={2}
                prefix="-¥"
                valueStyle={{ color: '#ff4d4f', fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ 
              background: record.profit.round >= 0 
                ? 'linear-gradient(135deg, #1890ff20 0%, #1890ff10 100%)' 
                : 'linear-gradient(135deg, #ff4d4f20 0%, #ff4d4f10 100%)', 
              border: 'none' 
            }}>
              <Statistic
                title={<Text type="secondary">{t('game.report.items.roundProfit')}</Text>}
                value={record.profit.round}
                precision={2}
                prefix={record.profit.round >= 0 ? <RiseOutlined /> : <FallOutlined />}
                suffix="¥"
                valueStyle={{ color: record.profit.round >= 0 ? '#1890ff' : '#ff4d4f', fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ 
              background: record.profit.cumulative >= 0 
                ? 'linear-gradient(135deg, #722ed120 0%, #722ed110 100%)' 
                : 'linear-gradient(135deg, #ff4d4f20 0%, #ff4d4f10 100%)', 
              border: 'none' 
            }}>
              <Statistic
                title={<Text type="secondary">{t('game.report.items.cumulativeProfit')}</Text>}
                value={record.profit.cumulative}
                precision={2}
                prefix="¥"
                valueStyle={{ color: record.profit.cumulative >= 0 ? '#722ed1' : '#ff4d4f', fontSize: 18 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Product Sales Section */}
        {products.length > 0 && (
          <Card 
            size="small" 
            title={<Space><ShopOutlined /> {t('game.report.productSales')}</Space>}
            style={{ marginBottom: 12 }}
          >
            <Table
              dataSource={products}
              columns={productColumns}
              pagination={false}
              size="small"
              rowKey="product_id"
            />
          </Card>
        )}

        {/* Materials Section */}
        {materialList.length > 0 && (
          <Card 
            size="small" 
            title={<Space><ExperimentOutlined /> {t('game.report.materialPurchases')}</Space>}
            style={{ marginBottom: 12 }}
          >
            <Table
              dataSource={materialList}
              columns={materialColumns}
              pagination={false}
              size="small"
              rowKey="type"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>{t('game.report.total')}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text type="danger" strong>-¥{record.expenses.material.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        )}

        {/* Fixed & Temporary Costs Section */}
        <Row gutter={12}>
          <Col span={12}>
            <Card 
              size="small" 
              title={<Space><TeamOutlined /> {t('game.report.fixedCosts')}</Space>}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>{t('game.report.items.rent')}</Text>
                <Text type="danger">-¥{record.expenses.rent.toFixed(2)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{t('game.report.items.salary')}</Text>
                <Text type="danger">-¥{record.expenses.salary.toFixed(2)}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{t('game.report.subtotal')}</Text>
                <Text type="danger" strong>-¥{(record.expenses.rent + record.expenses.salary).toFixed(2)}</Text>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              size="small" 
              title={<Space><BulbOutlined /> {t('game.report.temporaryCosts')}</Space>}
            >
              {record.expenses.decoration > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{t('game.report.items.decoration')}</Text>
                  <Text type="danger">-¥{record.expenses.decoration.toFixed(2)}</Text>
                </div>
              )}
              {record.expenses.market_research > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{t('game.report.items.marketResearch')}</Text>
                  <Text type="danger">-¥{record.expenses.market_research.toFixed(2)}</Text>
                </div>
              )}
              {record.expenses.advertisement > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{t('game.report.items.advertisement')}</Text>
                  <Text type="danger">-¥{record.expenses.advertisement.toFixed(2)}</Text>
                </div>
              )}
              {record.expenses.product_research > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{t('game.report.items.productResearch')}</Text>
                  <Text type="danger">-¥{record.expenses.product_research.toFixed(2)}</Text>
                </div>
              )}
              {(record.expenses.decoration === 0 && record.expenses.market_research === 0 && 
                record.expenses.advertisement === 0 && record.expenses.product_research === 0) && (
                <Text type="secondary">{t('game.report.noTemporaryCosts')}</Text>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const tabItems = records.map(record => ({
    key: String(record.round_number),
    label: t('game.report.round', { n: record.round_number }),
    children: renderDetailedContent(record),
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

      {/* 抽屉面板 - 加宽以展示更多内容 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ fontSize: 20, color: '#667eea' }} />
            <span>{t('game.report.title')}</span>
          </div>
        }
        placement="left"
        width={680}
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
