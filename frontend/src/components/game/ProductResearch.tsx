import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, App, Tag, Modal, InputNumber, Alert } from 'antd';
import { ExperimentOutlined, TrophyOutlined } from '@ant-design/icons';
import { productApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import type { ProductRecipe } from '../../types';

interface ProductResearchProps {
  disabled?: boolean;
}

export const ProductResearch: React.FC<ProductResearchProps> = ({ disabled = false }) => {
  const { currentPlayer, currentGame } = useGameStore();
  const { message, modal } = App.useApp();
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ProductRecipe | null>(null);
  const [diceResult, setDiceResult] = useState<number>(1);

  useEffect(() => {
    if (currentPlayer) {
      loadRecipes();
    }
  }, [currentPlayer?.id]);

  const loadRecipes = async () => {
    if (!currentPlayer) return;

    try {
      const response = await productApi.getAllRecipes(currentPlayer.id);
      if (response.success && response.data) {
        setRecipes(response.data);
      }
    } catch (error: any) {
      console.error('加载配方列表失败:', error);
    }
  };

  const handleSelectRecipe = (recipe: ProductRecipe) => {
    if (recipe.is_unlocked) {
      message.info('该配方已解锁');
      return;
    }

    setSelectedRecipe(recipe);
    setDiceResult(1);
    setShowDiceModal(true);
  };

  const handleResearch = async () => {
    if (!currentPlayer || !currentGame || !selectedRecipe) return;

    setLoading(true);
    try {
      const response = await productApi.researchProduct({
        player_id: currentPlayer.id,
        recipe_id: selectedRecipe.recipe_id,
        round_number: currentGame.current_round,
        dice_result: diceResult,
      });

      if (response.success && response.data) {
        setShowDiceModal(false);

        const { research_success, product_name, required_roll, dice_result: roll } = response.data;

        if (research_success) {
          modal.success({
            title: '研发成功！',
            content: `恭喜！${product_name} 研发成功！\n掷骰结果：${roll}（需要 ≥${required_roll}）\n已解锁该配方，可进入生产决策进行生产`,
          });
        } else {
          modal.warning({
            title: '研发失败',
            content: `很遗憾，${product_name} 研发失败\n掷骰结果：${roll}（需要 ≥${required_roll}）\n已扣除研发费用600元`,
          });
        }

        loadRecipes();
        setSelectedRecipe(null);
      }
    } catch (error: any) {
      message.error(error.error || '研发失败');
      setShowDiceModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyInfo = (difficulty: number) => {
    // 根据难度值计算所需骰子点数
    // 难度1: 需≥3 (67%成功率)
    // 难度2: 需≥4 (50%成功率)
    // 难度3: 需≥4 (50%成功率)
    const requiredRoll = difficulty === 1 ? 3 : 4;
    const successRate = Math.round(((7 - requiredRoll) / 6) * 100);

    const difficultyMap: Record<number, { text: string; color: string }> = {
      1: { text: '简单', color: 'green' },
      2: { text: '中等', color: 'orange' },
      3: { text: '困难', color: 'red' },
    };

    return {
      ...difficultyMap[difficulty] || { text: '未知', color: 'default' },
      requiredRoll,
      successRate,
    };
  };

  const renderRecipeCard = (recipe: ProductRecipe) => {
    const difficultyInfo = getDifficultyInfo(recipe.difficulty);
    const materials = Object.entries(recipe.recipe_json).map(([key, value]) => {
      const nameMap: Record<string, string> = {
        tea: '茶',
        milk: '奶',
        fruit: '果',
        ingredient: '料',
      };
      return `${nameMap[key] || key}×${value}`;
    });

    return (
      <Card
        key={recipe.recipe_id}
        hoverable={!recipe.is_unlocked}
        style={{
          borderColor: recipe.is_unlocked ? '#52c41a' : '#d9d9d9',
          borderWidth: 2,
          background: recipe.is_unlocked ? '#f6ffed' : 'white',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 8 }}>
            {recipe.name}
            {recipe.is_unlocked && <TrophyOutlined style={{ marginLeft: 8, color: '#52c41a' }} />}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
            配方：{materials.join(' + ')}
          </div>
          <div style={{ marginBottom: 8 }}>
            <Tag color={difficultyInfo.color}>
              难度{recipe.difficulty} - {difficultyInfo.text}
            </Tag>
            <Tag>圈粉率 {recipe.base_fan_rate}%</Tag>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: 12 }}>
            需掷骰 ≥{difficultyInfo.requiredRoll} ({difficultyInfo.successRate}% 成功率)
          </div>
          {recipe.is_unlocked ? (
            <Tag color="success">已解锁</Tag>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => handleSelectRecipe(recipe)}
              disabled={disabled}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              研发（¥600）
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <Card className="card-cute" style={{ opacity: disabled ? 0.6 : 1 }}>
        <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>🧪 产品研发</h3>

        <Alert
          message="研发流程"
          description="1. 选择要研发的配方 → 2. 支付600元研发费 → 3. 线下掷骰子 → 4. 输入骰子结果 → 5. 查看研发是否成功"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          {recipes.map((recipe) => (
            <Col span={8} key={recipe.recipe_id}>
              {renderRecipeCard(recipe)}
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={`研发 ${selectedRecipe?.name}`}
        open={showDiceModal}
        onCancel={() => setShowDiceModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDiceModal(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleResearch}>
            确认研发
          </Button>,
        ]}
      >
        {selectedRecipe && (
          <>
            <div style={{ marginBottom: 16 }}>
              <p><strong>配方信息：</strong></p>
              <p>难度：{getDifficultyInfo(selectedRecipe.difficulty).text}</p>
              <p>需要掷骰 ≥{getDifficultyInfo(selectedRecipe.difficulty).requiredRoll}</p>
              <p>成功率：{getDifficultyInfo(selectedRecipe.difficulty).successRate}%</p>
              <p>研发费用：¥600</p>
            </div>

            <Alert
              message="请在线下掷一个6面骰子，然后在下方输入结果"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <p style={{ marginBottom: 8 }}>请输入骰子结果（1-6）：</p>
              <InputNumber
                min={1}
                max={6}
                value={diceResult}
                onChange={(value) => setDiceResult(value || 1)}
                style={{ width: 120 }}
                size="large"
              />
            </div>
          </>
        )}
      </Modal>
    </>
  );
};
