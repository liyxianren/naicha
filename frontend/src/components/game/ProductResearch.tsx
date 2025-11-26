import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, App, Tag, Modal, Alert } from 'antd';
import { ExperimentOutlined, TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { productApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { ProductRecipe } from '../../types';

interface ProductResearchProps {
  disabled?: boolean;
}

export const ProductResearch: React.FC<ProductResearchProps> = ({ disabled = false }) => {
  const { currentPlayer, currentGame } = useGameStore();
  const { message, modal } = App.useApp();
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ProductRecipe | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

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
      console.error('Failed to load recipes:', error);
    }
  };

  const handleSelectRecipe = (recipe: ProductRecipe) => {
    if (recipe.is_unlocked) {
      message.info(t('game.research.messages.alreadyUnlocked'));
      return;
    }

    setSelectedRecipe(recipe);
    setDiceResult(null);
    setShowDiceModal(true);
  };

  const handleRollDice = () => {
    setIsRolling(true);

    let count = 0;
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      count++;

      if (count >= 10) {
        clearInterval(rollInterval);
        const finalResult = Math.floor(Math.random() * 6) + 1;
        setDiceResult(finalResult);
        setIsRolling(false);
      }
    }, 100);
  };

  const handleResearch = async () => {
    if (!currentPlayer || !currentGame || !selectedRecipe || diceResult === null) {
      message.warning(t('game.research.messages.rollFirst'));
      return;
    }

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
            title: t('game.research.successTitle'),
            content: (
              <div>
                <p>{t('game.research.successContent', { name: product_name })}</p>
                <p>{t('game.research.rollResult', { roll, required: required_roll })}</p>
                <p>{t('game.research.successNext')}</p>
              </div>
            ),
          });
        } else {
          modal.warning({
            title: t('game.research.failTitle'),
            content: (
              <div>
                <p>{t('game.research.failContent', { name: product_name })}</p>
                <p>{t('game.research.rollResult', { roll, required: required_roll })}</p>
                <p>{t('game.research.failCost')}</p>
              </div>
            ),
          });
        }

        loadRecipes();
        setSelectedRecipe(null);
      }
    } catch (error: any) {
      message.error(error.error || t('game.research.messages.researchFailed'));
      setShowDiceModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLevel = (recipe: ProductRecipe): number => {
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

  const getDifficultyInfo = (recipe: ProductRecipe) => {
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

  const translateProductName = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('水果茶') || lower.includes('fruit tea')) {
      return t('game.products.names.fruitTea');
    }
    if (lower.includes('水果奶昔') || lower.includes('fruit milkshake')) {
      return t('game.products.names.fruitMilkshake');
    }
    if (lower.includes('珍珠奶茶') || lower.includes('pearl milk tea')) {
      return t('game.products.names.pearlMilkTea');
    }
    if (lower.includes('椰奶') || lower.includes('coconut')) {
      return t('game.products.names.coconutMilkTea');
    }
    if (lower.includes('柠檬茶') || lower.includes('lemon tea')) {
      return t('game.products.names.lemonTea');
    }
    if (lower.includes('果汁') || lower.includes('juice')) {
      return t('game.products.names.juice');
    }
    if (lower.includes('奶茶') || lower.includes('milk tea')) {
      return t('game.products.names.milkTea');
    }
    return name;
  };

  const renderRecipeCard = (recipe: ProductRecipe) => {
    const difficultyInfo = getDifficultyInfo(recipe);
    const materials = Object.entries(recipe.recipe_json).map(([key, value]) => {
      const nameMap: Record<string, string> = {
        tea: t('game.research.materials.tea'),
        milk: t('game.research.materials.milk'),
        fruit: t('game.research.materials.fruit'),
        ingredient: t('game.research.materials.ingredient'),
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
            {translateProductName(recipe.name)}
            {recipe.is_unlocked && <TrophyOutlined style={{ marginLeft: 8, color: '#52c41a' }} />}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
            {t('game.research.recipeLabel', { materials: materials.join(' + ') })}
          </div>
          <div style={{ marginBottom: 8 }}>
            <Tag color={difficultyInfo.color}>
              {t('game.research.difficultyLabel', { difficulty: difficultyInfo.level, label: difficultyInfo.text })}
            </Tag>
            <Tag>{t('game.research.fanRate', { rate: recipe.base_fan_rate })}</Tag>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: 12 }}>
            {t('game.research.requiredRoll', { required: difficultyInfo.requiredRoll, rate: difficultyInfo.successRate })}
          </div>
          {recipe.is_unlocked ? (
            <Tag color="success">{t('game.research.unlocked')}</Tag>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => handleSelectRecipe(recipe)}
              disabled={disabled}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {t('game.research.researchButton')}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <Card className="card-cute" style={{ opacity: disabled ? 0.6 : 1 }}>
        <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>{t('game.research.title')}</h3>

        <Alert
          message={t('game.research.flowTitle')}
          description={t('game.research.flowSteps')}
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
        title={selectedRecipe ? t('game.research.modalTitle', { name: translateProductName(selectedRecipe.name) }) : ''}
        open={showDiceModal}
        onCancel={() => setShowDiceModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDiceModal(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleResearch}
            disabled={diceResult === null}
          >
            {t('game.research.modalConfirm')}
          </Button>,
        ]}
      >
        {selectedRecipe && (
          (() => {
            const info = getDifficultyInfo(selectedRecipe);
            return (
          <>
            <div style={{ marginBottom: 16 }}>
              <p><strong>{t('game.research.modalInfoTitle')}</strong></p>
              <p>{t('game.research.modalDifficulty', { label: info.text })}</p>
              <p>{t('game.research.modalNeedRoll', { required: info.requiredRoll })}</p>
              <p>{t('game.research.modalSuccessRate', { rate: info.successRate })}</p>
              <p>{t('game.research.modalCost')}</p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '24px',
              background: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: 16
            }}>
              {diceResult === null ? (
                <>
                  <p style={{ marginBottom: 16, fontSize: '14px', color: '#666' }}>
                    {t('game.research.rollPrompt')}
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={handleRollDice}
                    disabled={isRolling}
                    style={{
                      height: 56,
                      fontSize: 18,
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                    }}
                  >
                    {isRolling ? t('game.research.rolling') : t('game.research.rollButton')}
                  </Button>
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 64,
                    fontWeight: 'bold',
                    color: '#1890ff',
                    marginBottom: 8,
                    animation: isRolling ? 'none' : 'bounce 0.5s ease'
                  }}>
                    🎲 {diceResult}
                  </div>
                  <p style={{ fontSize: 14, color: '#52c41a', marginBottom: 8 }}>
                    {t('game.research.rolled')}
                  </p>
                </>
              )}
            </div>

            {diceResult !== null && (
              <Alert
                message={
                  diceResult >= info.requiredRoll
                    ? t('game.research.rollSuccess', { roll: diceResult, required: info.requiredRoll })
                    : t('game.research.rollFail', { roll: diceResult, required: info.requiredRoll })
                }
                type={diceResult >= info.requiredRoll ? 'success' : 'error'}
                showIcon
              />
            )}
          </>
            );
          })()
        )}
      </Modal>
    </>
  );
};
