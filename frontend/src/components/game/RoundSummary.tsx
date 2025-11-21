import React from 'react';
import { Modal, List, Typography, Tag } from 'antd';
import type { Player } from '../../types';

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
  const ranking = [...players].sort((a, b) => b.cash - a.cash);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onNextRound}
      okText="开始下一回合"
      cancelText="查看结算"
      title={`📊 第${roundNumber}回合结算`}
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
