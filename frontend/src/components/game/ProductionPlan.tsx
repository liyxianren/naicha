import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Table,
  InputNumber,
  Select,
  Button,
  Alert,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  App,
} from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useGameStore } from '../../stores/gameStore';
import { productApi, productionApi, employeeApi, roundApi } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import type { PlayerProduct, Production, MaterialCosts, MaterialCostDetail } from '../../types';
import { translateProductName } from '../../utils/productName';

const { Title, Text } = Typography;

interface ProductAllocation {
  productivity: number;
  price: number;
}

export const ProductionPlan: React.FC = () => {
  const { currentPlayer, currentGame } = useGameStore();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const [unlockedProducts, setUnlockedProducts] = useState<PlayerProduct[]>([]);
  const [allocations, setAllocations] = useState<Record<number, ProductAllocation>>({});
  const [totalProductivity, setTotalProductivity] = useState<number>(0);
  const [materialCosts, setMaterialCosts] = useState<MaterialCosts | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const getDifficultyLevel = (recipe: PlayerProduct['recipe']): number => {
    const name = (recipe.name || '').toLowerCase();
    if (name.includes('水果茶') || name.includes('fruit tea')) {
      return 5;
    }
    if (
      name.includes('水果奶昔') ||
      name.includes('fruit milkshake') ||
      name.includes('珍珠奶茶') ||
      name.includes('pearl milk tea')
    ) {
      return 4;
    }
    return 3;
  };

  const getDifficultyInfo = (recipe: PlayerProduct['recipe']) => {
    const level = getDifficultyLevel(recipe);
    const requiredRoll = level;
    const successRate = Math.round(((7 - requiredRoll) / 6) * 100);

    const difficultyMap: Record<number, { text: string; color: string }> = {
      3: { text: t('game.research.difficulty.easy'), color: 'green' },
      4: { text: t('game.research.difficulty.medium'), color: 'orange' },
      5: { text: t('game.research.difficulty.hard'), color: 'red' },
    };

    return {
      ...difficultyMap[level] || { text: t('game.research.difficulty.unknown'), color: 'default' },
      level,
      requiredRoll,
      successRate,
    };
  };

  const allocatedTotal = useMemo(() => {
    return Object.values(allocations).reduce((sum, a) => sum + (a.productivity || 0), 0);
  }, [allocations]);

  const remaining = totalProductivity - allocatedTotal;

  useEffect(() => {
    if (currentPlayer && currentGame) {
      loadData();
    }
  }, [currentPlayer?.id, currentGame?.current_round]);

  useEffect(() => {
    if (Object.keys(allocations).length > 0 && allocatedTotal > 0) {
      updateMaterialPreview();
    } else {
      setMaterialCosts(null);
    }
  }, [allocations, allocatedTotal]);

  const loadData = async () => {
    if (!currentPlayer || !currentGame) return;

    try {
      const productsRes = await productApi.getUnlockedProducts(currentPlayer.id);
      if (productsRes.success && productsRes.data) {
        setUnlockedProducts(productsRes.data);
      }

      const productivityRes = await employeeApi.getTotalProductivity(currentPlayer.id);
      if (productivityRes.success && productivityRes.data) {
        setTotalProductivity(productivityRes.data.total_productivity);
      }

      const planRes = await productionApi.getProductionPlan(
        currentPlayer.id,
        currentGame.current_round
      );
      if (planRes.success && planRes.data && planRes.data.length > 0) {
        const existingAllocations: Record<number, ProductAllocation> = {};
        planRes.data.forEach((p: any) => {
          existingAllocations[p.product_id] = {
            productivity: p.allocated_productivity,
            price: p.price,
          };
        });
        setAllocations(existingAllocations);
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error('Failed to load production plan:', error);
    }
  };

  const updateMaterialPreview = async () => {
    if (!allocations || allocatedTotal === 0) return;

    const productions: Production[] = Object.entries(allocations)
      .filter(([_, v]) => v.productivity > 0)
      .map(([productId, v]) => ({
        product_id: parseInt(productId),
        productivity: v.productivity,
        price: v.price,
      }));

    if (productions.length === 0) return;

    setPreviewLoading(true);
    try {
      const res = await productionApi.previewMaterialCost({ productions });
      if (res.success && res.data) {
        setMaterialCosts(res.data.material_costs);
      }
    } catch (error: any) {
      console.error('Failed to preview material cost:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleProductivityChange = (productId: number, value: number | null) => {
    const product = unlockedProducts.find((p) => p.id === productId);
    if (!product) return;

    setAllocations({
      ...allocations,
      [productId]: {
        productivity: value || 0,
        price: allocations[productId]?.price || product.current_price || 15,
      },
    });
  };

  const handlePriceChange = (productId: number, price: number) => {
    setAllocations({
      ...allocations,
      [productId]: {
        ...allocations[productId],
        productivity: allocations[productId]?.productivity || 0,
        price,
      },
    });
  };

  const isPriceLocked = (product: PlayerProduct): boolean => {
    if (!product.last_price_change_round || !currentGame) return false;
    const roundsSinceChange = currentGame.current_round - product.last_price_change_round;
    return roundsSinceChange < 3;
  };

  const getPriceLockTag = (product: PlayerProduct) => {
    if (!currentGame) return null;

    if (isPriceLocked(product)) {
      const nextChangeRound = (product.last_price_change_round || 0) + 3;
      return (
        <Tag color="orange" icon={<WarningOutlined />}>
          {t('game.production.priceStatus.locked', { round: nextChangeRound })}
        </Tag>
      );
    }
    return <Tag color="green">{t('game.production.priceStatus.adjustable')}</Tag>;
  };

  const handleSubmit = async () => {
    if (!currentPlayer || !currentGame) return;

    const productions: Production[] = Object.entries(allocations)
      .filter(([_, v]) => v.productivity > 0)
      .map(([productId, v]) => ({
        product_id: parseInt(productId),
        productivity: v.productivity,
        price: v.price,
      }));

    if (productions.length === 0) {
      message.warning(t('game.production.messages.assignOne'));
      return;
    }

    if (remaining < 0) {
      message.error(t('game.production.messages.overAllocate'));
      return;
    }

    setLoading(true);
    try {
      const result = await productionApi.submitPlan({
        player_id: currentPlayer.id,
        round_number: currentGame.current_round,
        productions,
      });

      if (result.success && result.data) {
        message.success(
          t('game.production.messages.submitSuccess', { cost: result.data.material_costs.total_cost.toFixed(2) })
        );
        setIsSubmitted(true);

        if (result.data.all_players_submitted) {
          message.info(t('game.production.messages.allSubmitted'), 2);

          setTimeout(async () => {
            try {
              const previousRound = currentGame.current_round;
              await roundApi.advanceRound(currentGame.id);
              const summaryRes = await roundApi.getRoundSummary(currentGame.id, previousRound);

              if (summaryRes.success && summaryRes.data) {
                const playersData = Array.isArray(summaryRes.data)
                  ? summaryRes.data
                  : summaryRes.data.players || [];
                const customerFlow = summaryRes.data.customer_flow || null;

                const event = new CustomEvent('showRoundSettlement', {
                  detail: {
                    roundNumber: previousRound,
                    summaryData: playersData,
                    customerFlow,
                    rawSummary: summaryRes.data,
                  },
                });
                window.dispatchEvent(event);
              } else {
                window.location.reload();
              }
            } catch (advanceError: any) {
              console.error('Advance round failed:', advanceError);
              message.error(advanceError.error || t('game.production.messages.advanceFailed'));
            }
          }, 1500);
        }
      }
    } catch (error: any) {
      message.error(error.error || t('game.production.messages.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getDiscountTag = (detail: MaterialCostDetail) => {
    if (detail.discount_rate && detail.discount_rate < 1) {
      const discountPercent = Math.round((1 - detail.discount_rate) * 100);
      return <Tag color="green">-{discountPercent}%</Tag>;
    }
    return null;
  };

  const columns = [
    {
      title: t('game.production.table.product'),
      key: 'product',
      width: 200,
      render: (_: any, record: PlayerProduct) => {
        const diffInfo = getDifficultyInfo(record.recipe);
        return (
          <div>
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {translateProductName(record.recipe.name, t)}
              </Text>
            </div>
            <Space size={4} wrap style={{ marginTop: 4 }}>
              <Tag color={diffInfo.color}>
                {t('game.research.difficultyLabel', { difficulty: diffInfo.level, label: diffInfo.text })}
              </Tag>
              <Tag color="blue">{t('game.production.tags.fanRate', { rate: record.recipe.base_fan_rate })}</Tag>
              <Tag>{t('game.production.tags.totalSold', { sold: record.total_sold || 0 })}</Tag>
            </Space>
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              {t('game.production.table.recipe')}:{' '}
              {Object.entries(record.recipe.recipe_json).map(([key, value]) => {
                const names: Record<string, string> = {
                  tea: t('game.research.materials.tea'),
                  milk: t('game.research.materials.milk'),
                  fruit: t('game.research.materials.fruit'),
                  ingredient: t('game.research.materials.ingredient'),
                };
                return `${value}${names[key] || key} `;
              })}
            </div>
          </div>
        );
      },
    },
    {
      title: t('game.production.table.productivity'),
      key: 'productivity',
      width: 160,
      render: (_: any, record: PlayerProduct) => (
        <InputNumber
          min={0}
          max={totalProductivity}
          value={allocations[record.id]?.productivity || 0}
          onChange={(value) => handleProductivityChange(record.id, value)}
          disabled={isSubmitted}
          addonAfter={t('game.production.units.cup')}
          style={{ width: '100%' }}
          size="large"
        />
      ),
    },
    {
      title: t('game.production.table.price'),
      key: 'price',
      width: 140,
      render: (_: any, record: PlayerProduct) => (
        <Select
          value={allocations[record.id]?.price || record.current_price || 15}
          onChange={(price) => handlePriceChange(record.id, price)}
          disabled={isSubmitted || isPriceLocked(record)}
          style={{ width: '100%' }}
          size="large"
        >
          {[10, 15, 20, 25, 30, 35, 40].map((price) => (
            <Select.Option key={price} value={price}>
              ￥{price}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('game.production.table.priceStatus'),
      key: 'price_status',
      width: 140,
      render: (_: any, record: PlayerProduct) => (
        <div>
          {getPriceLockTag(record)}
          {record.current_price && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              {t('game.production.priceStatus.current', { price: record.current_price })}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (unlockedProducts.length === 0) {
    return (
      <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
        <Title level={4} style={{ color: 'var(--color-milktea-brown)' }}>
          {t('game.production.title')}
        </Title>
        <Alert
          message={t('game.production.empty.title')}
          description={t('game.production.empty.desc')}
          type="info"
          showIcon
        />
      </Card>
    );
  }

  if (totalProductivity === 0) {
    return (
      <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
        <Title level={4} style={{ color: 'var(--color-milktea-brown)' }}>
          {t('game.production.title')}
        </Title>
        <Alert
          message={t('game.production.noProductivity.title')}
          description={t('game.production.noProductivity.desc')}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  const rules = [
    t('game.production.rules.assign'),
    t('game.production.rules.price'),
    t('game.production.rules.lock'),
    t('game.production.rules.materials'),
    t('game.production.rules.submit'),
  ];

  return (
    <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
      <Title level={4} style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>
        {t('game.production.title')}
      </Title>

      {isSubmitted && (
        <Alert
          message={t('game.production.submitted.title')}
          description={t('game.production.submitted.desc')}
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        message={
          <Space size={24}>
            <Text>
              <strong>{t('game.production.stats.total')}</strong>
              <span style={{ fontSize: 18, color: '#1890ff' }}>{totalProductivity}</span>
            </Text>
            <Text>
              <strong>{t('game.production.stats.allocated')}</strong>
              <span style={{ fontSize: 18, color: allocatedTotal > 0 ? '#52c41a' : '#999' }}>
                {allocatedTotal}
              </span>
            </Text>
            <Text>
              <strong>{t('game.production.stats.remaining')}</strong>
              <span
                style={{
                  fontSize: 18,
                  color: remaining < 0 ? '#ff4d4f' : remaining === 0 ? '#52c41a' : '#1890ff',
                }}
              >
                {remaining}
              </span>
            </Text>
          </Space>
        }
        type={remaining < 0 ? 'error' : remaining === 0 && allocatedTotal > 0 ? 'success' : 'info'}
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={unlockedProducts}
        columns={columns}
        pagination={false}
        rowKey="id"
        size="middle"
        style={{ marginBottom: 16 }}
      />

      {materialCosts && (
        <Card
          title={t('game.production.preview.title')}
          size="small"
          style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
          loading={previewLoading}
        >
          <Row gutter={[16, 8]}>
            {materialCosts.tea && (
              <Col span={6}>
                <div>
                  <Text type="secondary">{t('game.production.materials.tea')}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.tea.quantity}{t('game.production.materials.unit')}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ￥{materialCosts.tea.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.tea)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ￥{materialCosts.tea.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
            {materialCosts.milk && (
              <Col span={6}>
                <div>
                  <Text type="secondary">{t('game.production.materials.milk')}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.milk.quantity}{t('game.production.materials.unit')}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ￥{materialCosts.milk.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.milk)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ￥{materialCosts.milk.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
            {materialCosts.fruit && (
              <Col span={6}>
                <div>
                  <Text type="secondary">{t('game.production.materials.fruit')}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.fruit.quantity}{t('game.production.materials.unit')}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ￥{materialCosts.fruit.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.fruit)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ￥{materialCosts.fruit.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
            {materialCosts.ingredient && (
              <Col span={6}>
                <div>
                  <Text type="secondary">{t('game.production.materials.ingredient')}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.ingredient.quantity}{t('game.production.materials.unit')}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ￥{materialCosts.ingredient.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.ingredient)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ￥{materialCosts.ingredient.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          <Row align="middle" justify="space-between">
            <Col>
              <Text strong style={{ fontSize: 18 }}>
                {t('game.production.preview.total')}：
                <span style={{ fontSize: 24, color: '#ff4d4f', marginLeft: 8 }}>
                  ￥{materialCosts.total_cost.toFixed(2)}
                </span>
              </Text>
            </Col>
            <Col>
              {currentPlayer && materialCosts.total_cost > currentPlayer.cash && (
                <Alert message={t('game.production.preview.insufficient')} type="error" showIcon style={{ padding: '4px 12px' }} />
              )}
              {currentPlayer && materialCosts.total_cost <= currentPlayer.cash && (
                <Text type="success">
                  {t('game.production.preview.sufficient', { cash: currentPlayer.cash.toFixed(2) })}
                </Text>
              )}
            </Col>
          </Row>
        </Card>
      )}

      <Button
        type="primary"
        size="large"
        onClick={handleSubmit}
        disabled={isSubmitted || remaining < 0 || allocatedTotal === 0}
        loading={loading}
        block
        style={{ borderRadius: 'var(--radius-full)' }}
      >
        {isSubmitted ? t('game.production.buttons.submitted') : t('game.production.buttons.submit')}
      </Button>

      {!isSubmitted && (
        <Alert
          message={t('game.production.rules.title')}
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};
