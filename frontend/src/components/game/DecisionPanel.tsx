import React, { useMemo } from 'react';
import { Badge, Tooltip } from 'antd';
import type { DecisionStepKey, DecisionStepStatus } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export interface DecisionStepMeta {
  key: DecisionStepKey;
  title: string;
  emoji: string;
  description: string;
}

interface DecisionPanelProps {
  steps: DecisionStepMeta[];
  activeStep: DecisionStepKey;
  stepStatuses: Record<DecisionStepKey, DecisionStepStatus>;
  onStepChange: (step: DecisionStepKey) => void;
  isRoundLocked?: boolean;
  children?: React.ReactNode;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  steps,
  activeStep,
  stepStatuses,
  onStepChange,
  isRoundLocked = false,
  children,
}) => {
  const { t } = useTranslation();
  const statusConfig = useMemo<Record<DecisionStepStatus, { label: string; color: string; dotColor: string }>>(() => ({
    locked: { label: t('game.decision.status.locked'), color: '#d9d9d9', dotColor: '#d9d9d9' },
    pending: { label: t('game.decision.status.pending'), color: '#default', dotColor: '#faad14' },
    in_progress: { label: t('game.decision.status.inProgress'), color: '#1890ff', dotColor: '#1890ff' },
    completed: { label: t('game.decision.status.completed'), color: '#52c41a', dotColor: '#52c41a' },
    waiting: { label: t('game.decision.status.waiting'), color: '#722ed1', dotColor: '#722ed1' },
  }), [t]);

  return (
    <div className="card-cute decision-panel">
      {/* 顶部导航栏 */}
      <div className="decision-tabs">
        {steps.map((step) => {
          const status = stepStatuses[step.key] || 'pending';
          const config = statusConfig[status];
          const isActive = activeStep === step.key;
          
          // 锁定逻辑：如果是锁定状态，且不是等待/完成，则禁用
          const isDisabled = status === 'locked' || (isRoundLocked && status !== 'waiting' && status !== 'completed');

          return (
            <Tooltip key={step.key} title={step.description} placement="top">
              <button
                type="button"
                className={`decision-tab ${isActive ? 'active' : ''}`}
                onClick={() => onStepChange(step.key)}
                disabled={isDisabled}
              >
                {/* 状态小红点/绿点 */}
                <Badge 
                  color={config.dotColor} 
                  status={status === 'pending' ? 'processing' : 'default'}
                  style={{ position: 'absolute', top: 8, right: 8 }} 
                />
                
                <div className="decision-tab-emoji">{step.emoji}</div>
                <div className="decision-tab-title">{step.title}</div>
                <div 
                  className="decision-tab-status"
                  style={{ 
                    backgroundColor: isActive ? 'white' : '#f0f0f0',
                    color: isActive ? config.dotColor : '#999'
                  }}
                >
                  {config.label}
                </div>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* 主内容区域 */}
      <div className="decision-panel-content">
        {children}
      </div>
    </div>
  );
};
