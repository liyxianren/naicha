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
import type { PlayerProduct, Production, MaterialCosts, MaterialCostDetail } from '../../types';

const { Title, Text } = Typography;

interface ProductAllocation {
  productivity: number;
  price: number;
}

export const ProductionPlan: React.FC = () => {
  const { currentPlayer, currentGame } = useGameStore();
  const { message } = App.useApp();

  // 状态管理
  const [unlockedProducts, setUnlockedProducts] = useState<PlayerProduct[]>([]);
  const [allocations, setAllocations] = useState<Record<number, ProductAllocation>>({});
  const [totalProductivity, setTotalProductivity] = useState<number>(0);
  const [materialCosts, setMaterialCosts] = useState<MaterialCosts | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 计算已分配总生产力
  const allocatedTotal = useMemo(() => {
    return Object.values(allocations).reduce((sum, a) => sum + (a.productivity || 0), 0);
  }, [allocations]);

  // 计算剩余生产力
  const remaining = totalProductivity - allocatedTotal;

  // 加载数据
  useEffect(() => {
    if (currentPlayer && currentGame) {
      loadData();
    }
  }, [currentPlayer?.id, currentGame?.current_round]);

  // 当分配改变时，更新原材料成本预览
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
      // 1. 加载已解锁产品
      const productsRes = await productApi.getUnlockedProducts(currentPlayer.id);
      if (productsRes.success && productsRes.data) {
        setUnlockedProducts(productsRes.data);
      }

      // 2. 加载员工总生产力
      const productivityRes = await employeeApi.getTotalProductivity(currentPlayer.id);
      if (productivityRes.success && productivityRes.data) {
        setTotalProductivity(productivityRes.data.total_productivity);
      }

      // 3. 加载已提交的生产计划（回显）
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
      console.error('加载生产计划数据失败:', error);
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
      console.error('预览原材料成本失败:', error);
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
          第{nextChangeRound}回合可调价
        </Tag>
      );
    }
    return <Tag color="green">可调价</Tag>;
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
      message.warning('请至少分配一个产品的生产力');
      return;
    }

    if (remaining < 0) {
      message.error('生产力分配超限！');
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
          `生产计划已提交！原材料成本：¥${result.data.material_costs.total_cost.toFixed(2)}`
        );
        setIsSubmitted(true);

        // 如果所有玩家都已提交，自动推进回合
        if (result.data.all_players_submitted) {
          message.info('所有玩家已提交，正在推进回合...', 2);

          // 延迟一下让玩家看到提示
          setTimeout(async () => {
            try {
              // 记录当前回合
              const previousRound = currentGame.current_round;

              // 推进回合
              await roundApi.advanceRound(currentGame.id);

              // 获取回合结算数据
              const summaryRes = await roundApi.getRoundSummary(currentGame.id, previousRound);

              // 触发显示结算弹窗的事件
              if (summaryRes.success && summaryRes.data) {
                const playersData = Array.isArray(summaryRes.data)
                  ? summaryRes.data
                  : summaryRes.data.players || [];
                const customerFlow = summaryRes.data.customer_flow || null;

                // 使用自定义事件通知父组件显示结算弹窗，并带上原始数据供调试
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
                // 如果获取结算数据失败，直接刷新页面
                window.location.reload();
              }
            } catch (advanceError: any) {
              console.error('推进回合失败:', advanceError);
              message.error(advanceError.error || '推进回合失败');
            }
          }, 1500);
        }
      }
    } catch (error: any) {
      message.error(error.error || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const getDiscountTag = (detail: MaterialCostDetail) => {
    if (detail.discount_rate && detail.discount_rate < 1) {
      const discountPercent = Math.round((1 - detail.discount_rate) * 100);
      return <Tag color="green">-{discountPercent}%折扣</Tag>;
    }
    return null;
  };

  const columns = [
    {
      title: '产品信息',
      key: 'product',
      width: 200,
      render: (_: any, record: PlayerProduct) => (
        <div>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {record.recipe.name}
            </Text>
          </div>
          <Space size={4} wrap style={{ marginTop: 4 }}>
            <Tag color="blue">圈粉率 {record.recipe.base_fan_rate}%</Tag>
            <Tag>累计销售 {record.total_sold || 0}杯</Tag>
          </Space>
          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
            配方：
            {Object.entries(record.recipe.recipe_json).map(([key, value]) => {
              const names: Record<string, string> = {
                tea: '茶',
                milk: '奶',
                fruit: '果',
                ingredient: '料',
              };
              return `${value}${names[key] || key} `;
            })}
          </div>
        </div>
      ),
    },
    {
      title: '分配生产力',
      key: 'productivity',
      width: 160,
      render: (_: any, record: PlayerProduct) => (
        <InputNumber
          min={0}
          max={totalProductivity}
          value={allocations[record.id]?.productivity || 0}
          onChange={(value) => handleProductivityChange(record.id, value)}
          disabled={isSubmitted}
          addonAfter="杯"
          style={{ width: '100%' }}
          size="large"
        />
      ),
    },
    {
      title: '定价',
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
              ¥{price}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '价格状态',
      key: 'price_status',
      width: 140,
      render: (_: any, record: PlayerProduct) => (
        <div>
          {getPriceLockTag(record)}
          {record.current_price && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              当前价：¥{record.current_price}
            </div>
          )}
        </div>
      ),
    },
  ];

  // 如果没有已解锁产品
  if (unlockedProducts.length === 0) {
    return (
      <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
        <Title level={4} style={{ color: 'var(--color-milktea-brown)' }}>
          ⚙️ 生产计划
        </Title>
        <Alert
          message="暂无已解锁产品"
          description="请先在「产品研发」模块中研发产品，解锁后即可进行生产计划"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // 如果总生产力为0
  if (totalProductivity === 0) {
    return (
      <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
        <Title level={4} style={{ color: 'var(--color-milktea-brown)' }}>
          ⚙️ 生产计划
        </Title>
        <Alert
          message="暂无可用生产力"
          description="请先在「员工管理」模块中招募员工，增加生产力"
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
      <Title level={4} style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>
        ⚙️ 生产计划
      </Title>

      {/* 已提交状态提示 */}
      {isSubmitted && (
        <Alert
          message="已提交本回合生产计划"
          description="生产计划已锁定，等待回合结算"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 生产力总览 */}
      <Alert
        message={
          <Space size={24}>
            <Text>
              <strong>总生产力：</strong>
              <span style={{ fontSize: 18, color: '#1890ff' }}>{totalProductivity}</span>
            </Text>
            <Text>
              <strong>已分配：</strong>
              <span style={{ fontSize: 18, color: allocatedTotal > 0 ? '#52c41a' : '#999' }}>
                {allocatedTotal}
              </span>
            </Text>
            <Text>
              <strong>剩余：</strong>
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

      {/* 产品列表 */}
      <Table
        dataSource={unlockedProducts}
        columns={columns}
        pagination={false}
        rowKey="id"
        size="middle"
        style={{ marginBottom: 16 }}
      />

      {/* 原材料成本预览 */}
      {materialCosts && (
        <Card
          title="原材料成本预览"
          size="small"
          style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
          loading={previewLoading}
        >
          <Row gutter={[16, 8]}>
            {materialCosts.tea && (
              <Col span={6}>
                <div>
                  <Text type="secondary">茶叶</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.tea.quantity}份</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ¥{materialCosts.tea.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.tea)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ¥{materialCosts.tea.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
            {materialCosts.milk && (
              <Col span={6}>
                <div>
                  <Text type="secondary">牛奶</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.milk.quantity}份</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ¥{materialCosts.milk.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.milk)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ¥{materialCosts.milk.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
            {materialCosts.fruit && (
              <Col span={6}>
                <div>
                  <Text type="secondary">水果</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.fruit.quantity}份</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ¥{materialCosts.fruit.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.fruit)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ¥{materialCosts.fruit.total.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </Col>
            )}
            {materialCosts.ingredient && (
              <Col span={6}>
                <div>
                  <Text type="secondary">配料</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{materialCosts.ingredient.quantity}份</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      × ¥{materialCosts.ingredient.unit_price.toFixed(2)}
                    </Text>
                    {getDiscountTag(materialCosts.ingredient)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                      ¥{materialCosts.ingredient.total.toFixed(2)}
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
                总成本：
                <span style={{ fontSize: 24, color: '#ff4d4f', marginLeft: 8 }}>
                  ¥{materialCosts.total_cost.toFixed(2)}
                </span>
              </Text>
            </Col>
            <Col>
              {currentPlayer && materialCosts.total_cost > currentPlayer.cash && (
                <Alert message="余额不足！" type="error" showIcon style={{ padding: '4px 12px' }} />
              )}
              {currentPlayer && materialCosts.total_cost <= currentPlayer.cash && (
                <Text type="success">
                  余额充足（当前余额：¥{currentPlayer.cash.toFixed(2)}）
                </Text>
              )}
            </Col>
          </Row>
        </Card>
      )}

      {/* 提交按钮 */}
      <Button
        type="primary"
        size="large"
        onClick={handleSubmit}
        disabled={isSubmitted || remaining < 0 || allocatedTotal === 0}
        loading={loading}
        block
        style={{ borderRadius: 'var(--radius-full)' }}
      >
        {isSubmitted ? '已提交' : '提交生产计划'}
      </Button>

      {/* 帮助提示 */}
      {!isSubmitted && (
        <Alert
          message="生产计划规则"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>为已解锁产品分配生产力（总和不超过可用生产力）</li>
              <li>设定产品定价（10-40元，5的倍数）</li>
              <li>价格锁定：每3回合可调整一次定价</li>
              <li>系统将自动计算原材料需求和成本（含批量折扣）</li>
              <li>提交后将扣除原材料成本，本回合不可修改</li>
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
