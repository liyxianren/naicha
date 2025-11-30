import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, App, Tag, Modal, Alert } from 'antd';
import { ExperimentOutlined, TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { productApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { ProductRecipe } from '../../types';
import { translateProductName } from '../../utils/productName';

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
    setIsRolling(false);
    setShowDiceModal(true);
  };

  const handleRollDice = async () => {
    if (!currentPlayer || !currentGame || !selectedRecipe) {
      message.warning(t('game.research.messages.researchFailed'));
      return;
    }

    setIsRolling(true);

    // 骰子动画
    let count = 0;
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      count++;

      if (count >= 10) {
        clearInterval(rollInterval);
      }
    }, 100);

    // 等待动画结束
    setTimeout(async () => {
      const finalResult = Math.floor(Math.random() * 6) + 1;
      setDiceResult(finalResult);
      setIsRolling(false);

      // 立即调用后端API扣钱
      setLoading(true);
      try {
        const response = await productApi.researchProduct({
          player_id: currentPlayer.id,
          recipe_id: selectedRecipe.recipe_id,
          round_number: currentGame.current_round,
          dice_result: finalResult,
        });

        if (response.success && response.data) {
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
              onOk: () => {
                resetResearchModal();
                loadRecipes();
              },
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
              onOk: () => {
                resetResearchModal();
                loadRecipes();
              },
            });
          }
        }
      } catch (error: any) {
        message.error(error.error || t('game.research.messages.researchFailed'));
        resetResearchModal();
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const resetResearchModal = () => {
    setShowDiceModal(false);
    setSelectedRecipe(null);
    setDiceResult(null);
    setIsRolling(false);
  };

  const handleCloseDiceModal = () => {
    if (loading || isRolling) return;
    resetResearchModal();
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
    // 修改公式：从 (7 - requiredRoll) 改为 (6 - requiredRoll)
    // 难度3: 50%, 难度4: 33%, 难度5: 17%
    const successRate = Math.round(((6 - requiredRoll) / 6) * 100);

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

  const renderRecipeCard = (recipe: ProductRecipe) => {
    const difficultyInfo = getDifficultyInfo(recipe);
    const isUnlocked = recipe.is_unlocked;
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
        hoverable={!isUnlocked}
        className={`card-glass card-sm text-center ${disabled ? 'opacity-60' : ''}`}
        style={{
          border: `2px solid ${isUnlocked ? 'var(--color-success)' : 'var(--color-border-light)'}`,
          background: isUnlocked ? 'rgba(126, 217, 87, 0.08)' : 'var(--bg-primary)',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-bold flex items-center justify-center gap-2">
            {translateProductName(recipe.name, t)}
            {isUnlocked && <TrophyOutlined style={{ color: 'var(--color-success)' }} />}
          </div>
          <div className="text-sm text-secondary">
            {t('game.research.recipeLabel', { materials: materials.join(' + ') })}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Tag color={difficultyInfo.color}>
              {t('game.research.difficultyLabel', { difficulty: difficultyInfo.level, label: difficultyInfo.text })}
            </Tag>
            <Tag>{t('game.research.fanRate', { rate: recipe.base_fan_rate })}</Tag>
          </div>
          <div className="text-xs text-tertiary mb-2">
            {t('game.research.requiredRoll', { required: difficultyInfo.requiredRoll, rate: difficultyInfo.successRate })}
          </div>
          {isUnlocked ? (
            <Tag color="success">{t('game.research.unlocked')}</Tag>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => handleSelectRecipe(recipe)}
              disabled={disabled}
              style={{
                borderRadius: 'var(--radius-full)',
                background: 'var(--gradient-btn-primary)',
                border: 'none',
              }}
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
      <Card className={`card-cute ${disabled ? 'opacity-60' : ''}`}>
        <h3 className="text-primary mb-4">{t('game.research.title')}</h3>

        <Alert
          message={t('game.research.flowTitle')}
          description={t('game.research.flowSteps')}
          type="info"
          showIcon
          className="mb-4"
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
        title={selectedRecipe ? t('game.research.modalTitle', { name: translateProductName(selectedRecipe.name, t) }) : ''}
        open={showDiceModal}
        onCancel={handleCloseDiceModal}
        footer={
          diceResult === null ? [
            <Button key="cancel" onClick={handleCloseDiceModal} disabled={loading || isRolling}>
              {t('common.cancel')}
            </Button>,
          ] : null
        }
        closable={!isRolling && !loading}
      >
        {selectedRecipe && (
          (() => {
            const info = getDifficultyInfo(selectedRecipe);
            return (
              <>
                <div className="mb-4 text-secondary text-sm">
                  <p className="font-semibold text-primary mb-2">{t('game.research.modalInfoTitle')}</p>
                  <p className="mb-1">{t('game.research.modalDifficulty', { label: info.text })}</p>
                  <p className="mb-1">{t('game.research.modalNeedRoll', { required: info.requiredRoll })}</p>
                  <p className="mb-1">{t('game.research.modalSuccessRate', { rate: info.successRate })}</p>
                  <p className="mb-1">{t('game.research.modalCost')}</p>
                </div>

                <div className="text-center p-6 bg-tertiary rounded-lg mb-4 border">
                  {diceResult === null ? (
                    <>
                      <p className="mb-4 text-sm text-secondary">
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
                          background: 'var(--gradient-btn-primary)',
                          border: 'none',
                        }}
                      >
                        {isRolling ? t('game.research.rolling') : t('game.research.rollButton')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className="font-bold mb-2"
                        style={{
                          fontSize: 64,
                          color: 'var(--color-info)',
                          animation: isRolling ? 'none' : 'bounce 0.5s var(--ease-out)',
                        }}
                      >
                        🎲 {diceResult}
                      </div>
                      <p className="text-success text-sm mb-2">
                        {t('game.research.rolled')}
                      </p>
                    </>
                  )}
                </div>

                {diceResult !== null && (
                  <Alert
                    message={
                      diceResult > info.requiredRoll
                        ? t('game.research.rollSuccess', { roll: diceResult, required: info.requiredRoll })
                        : t('game.research.rollFail', { roll: diceResult, required: info.requiredRoll })
                    }
                    type={diceResult > info.requiredRoll ? 'success' : 'error'}
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
