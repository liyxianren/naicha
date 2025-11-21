import React from 'react';
import { Card, Typography, Tag } from 'antd';
import type { Game, Player } from '../../types';

const { Title, Text } = Typography;

interface GameHeaderProps {
  game: Game;
  player: Player;
  currentRound: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ game, player, currentRound }) => {
  return (
    <Card
      className="card-cute"
      style={{ marginBottom: '16px' }}
      styles={{ body: { padding: '16px 24px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 左侧：游戏名称和回合数 */}
        <div>
          <Title level={3} style={{ margin: 0, color: 'var(--color-milktea-brown)' }}>
            🧋 {game.name}
          </Title>
          <div style={{ marginTop: '4px' }}>
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
              第 {currentRound} / 10 回合
            </Tag>
            <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '8px' }}>
              {player.name}
            </Tag>
          </div>
        </div>

        {/* 右侧：玩家资金 */}
        <div style={{ textAlign: 'right' }}>
          <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
            你的资金
          </Text>
          <div
            className="money-text"
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginTop: '4px'
            }}
          >
            💰 ¥{player.cash.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
};
