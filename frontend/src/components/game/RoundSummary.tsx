import React from 'react';
import { Modal, List, Typography, Tag } from 'antd';
import type { Player } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

const { Text } = Typography;

interface RoundSummaryProps {
  visible: boolean;
  roundNumber: number;
  players: Player[];
  onClose: () => void;
  onNextRound: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  visible,
  roundNumber,
  players,
  onClose,
  onNextRound,
}) => {
  const { t } = useTranslation();
  const ranking = [...players].sort((a, b) => b.cash - a.cash);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onNextRound}
      okText={t('game.roundSummary.nextRound')}
      cancelText={t('game.roundSummary.viewSettlement')}
      title={`📊 ${t('game.roundSummary.title', { round: roundNumber })}`}
      destroyOnHidden
    >
      <List
        dataSource={ranking}
        renderItem={(player, index) => (
          <List.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag color={index === 0 ? 'gold' : index === 1 ? 'blue' : 'purple'}>
                  #{index + 1}
                </Tag>
                <Text strong>{player.name}</Text>
              </div>
              <Text className="money-text">¥{player.cash.toLocaleString()}</Text>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
};
