import React from 'react';
import { Card, Typography, Avatar, Space } from 'antd';
import { CrownOutlined, UserOutlined } from '@ant-design/icons';
import type { Player } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

const { Text } = Typography;

interface PlayerListProps {
  players: Player[];
  currentPlayerId: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  const { t } = useTranslation();
  const sortedPlayers = [...players].sort((a, b) => a.turn_order - b.turn_order);

  return (
    <Card
      title={<span style={{ color: 'var(--color-milktea-brown)' }}>{t('game.playerList.title')}</span>}
      className="card-cute"
      style={{ height: '100%' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: player.id === currentPlayerId
                ? 'linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 100%)'
                : '#F5F5F5',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Avatar
                size={48}
                style={{
                  background: 'var(--gradient-milk-tea)',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
                icon={index === 0 ? <CrownOutlined /> : <UserOutlined />}
              >
                {index === 0 ? '' : index + 1}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {player.name}
                  </Text>
                  {player.id === currentPlayerId && (
                    <span style={{
                      background: '#1890ff',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}>
                      {t('game.playerList.selfTag')}
                    </span>
                  )}
                  {index === 0 && (
                    <span style={{
                      background: 'var(--gradient-money)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}>
                      {t('game.playerList.hostTag')}
                    </span>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('game.playerList.turnOrder', { order: player.turn_order + 1 })}
                </Text>
              </div>
            </div>

            {/* 资金显示 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: '1px solid rgba(0,0,0,0.06)'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>{t('game.playerList.cash')}</Text>
              <Text strong className="money-text" style={{ fontSize: '16px' }}>
                ￥{player.cash.toLocaleString()}
              </Text>
            </div>
          </div>
        ))}
      </Space>
    </Card>
  );
};
