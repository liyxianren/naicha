import React from 'react';
import { Card, Typography, List, Button, Tag } from 'antd';
import type { Player } from '../../types';

const { Title, Paragraph, Text } = Typography;

interface GameEndProps {
  players: Player[];
  onBackToLobby?: () => void;
}

export const GameEnd: React.FC<GameEndProps> = ({ players, onBackToLobby }) => {
  const ranking = [...players].sort((a, b) => b.cash - a.cash);
  const winner = ranking[0];

  return (
    <Card className="card-cute" style={{ marginTop: '24px' }}>
      <Title level={3} style={{ color: 'var(--color-milktea-brown)', textAlign: 'center' }}>
        🏆 游戏结束排名
      </Title>
      <Paragraph style={{ textAlign: 'center' }}>
        恭喜获胜者 <Text strong>{winner?.name ?? '??'}</Text> 统领商界！剩余资产 <Text className="money-text">
          ¥{winner?.cash.toLocaleString()}
        </Text>
      </Paragraph>

      <List
        dataSource={ranking}
        renderItem={(player, index) => (
          <List.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag color={index === 0 ? 'gold' : 'purple'}>#{index + 1}</Tag>
                <Text strong>{player.name}</Text>
              </div>
              <Text className="money-text">¥{player.cash.toLocaleString()}</Text>
            </div>
          </List.Item>
        )}
      />

      {onBackToLobby && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="primary" onClick={onBackToLobby} style={{ borderRadius: 'var(--radius-full)' }}>
            返回大厅
          </Button>
        </div>
      )}
    </Card>
  );
};
