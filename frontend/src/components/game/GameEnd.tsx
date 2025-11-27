import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Tag, Spin, Space } from 'antd';
import { TrophyOutlined, CrownOutlined } from '@ant-design/icons';
import type { Player, FinanceRecord } from '../../types';
import { financeApi } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';

const { Title, Text } = Typography;

interface GameEndProps {
  players: Player[];
  onBackToLobby?: () => void;
}

interface PlayerFinanceData {
  key: number;
  player_id: number;
  player_name: string;
  total_cash: number;
  round_revenues: Record<number, number>;
  cumulative_profit: number;
}

export const GameEnd: React.FC<GameEndProps> = ({ players, onBackToLobby }) => {
  const { t } = useTranslation();
  const [financeData, setFinanceData] = useState<Record<number, FinanceRecord[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinanceData = async () => {
      const data: Record<number, FinanceRecord[]> = {};

      for (const player of players) {
        try {
          const resp = await financeApi.getAllRecords(player.id);
          if (resp.success && resp.data) {
            data[player.id] = resp.data;
          }
        } catch (error) {
          console.error(`Failed to load finance for player ${player.id}`, error);
        }
      }

      setFinanceData(data);
      setLoading(false);
    };

    if (players.length > 0) {
      loadFinanceData();
    } else {
      setLoading(false);
    }
  }, [players]);

  // 准备表格数据
  const tableData: PlayerFinanceData[] = players.map(player => {
    const records = financeData[player.id] || [];
    const roundRevenues: Record<number, number> = {};

    records.forEach(record => {
      roundRevenues[record.round_number] = record.revenue?.total || 0;
    });

    // 获取最后一个回合的累计利润
    const sortedRecords = [...records].sort((a, b) => b.round_number - a.round_number);
    const latestRecord = sortedRecords[0];

    return {
      key: player.id,
      player_id: player.id,
      player_name: player.nickname || player.name || `Player ${player.id}`,
      total_cash: player.cash,
      round_revenues: roundRevenues,
      cumulative_profit: latestRecord?.profit?.cumulative || 0
    };
  });

  // 按累计利润排序
  tableData.sort((a, b) => b.cumulative_profit - a.cumulative_profit);

  const winner = tableData[0];

  // 生成回合列
  const roundColumns = Array.from({ length: 10 }, (_, i) => ({
    title: t('game.gameEnd.round', { round: i + 1 }),
    dataIndex: ['round_revenues', i + 1],
    key: `round_${i + 1}`,
    width: 90,
    align: 'right' as const,
    render: (val: number) => (
      <Text style={{ color: val > 0 ? '#52c41a' : val < 0 ? '#ff4d4f' : undefined }}>
        ¥{(val || 0).toFixed(0)}
      </Text>
    ),
  }));

  const columns = [
    {
      title: t('game.gameEnd.rank'),
      key: 'rank',
      width: 80,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => {
        const icons = ['🥇', '🥈', '🥉'];
        return (
          <Space>
            <span style={{ fontSize: 20 }}>{icons[index] || '🏅'}</span>
            <Text strong>{index + 1}</Text>
          </Space>
        );
      },
    },
    {
      title: t('game.gameEnd.player'),
      dataIndex: 'player_name',
      key: 'player_name',
      width: 120,
      fixed: 'left' as const,
      render: (name: string, record: PlayerFinanceData, index: number) => (
        <Space>
          {index === 0 && <CrownOutlined style={{ color: '#faad14' }} />}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    ...roundColumns,
    {
      title: t('game.gameEnd.cumulativeProfit'),
      dataIndex: 'cumulative_profit',
      key: 'cumulative_profit',
      width: 120,
      fixed: 'right' as const,
      render: (val: number) => (
        <Text strong style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
          {val >= 0 ? '+' : ''}¥{val.toFixed(0)}
        </Text>
      ),
    },
    {
      title: t('game.gameEnd.finalCash'),
      dataIndex: 'total_cash',
      key: 'total_cash',
      width: 120,
      fixed: 'right' as const,
      render: (val: number) => (
        <Text strong style={{ fontSize: 16 }}>
          ¥{val.toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <Card 
      className="card-cute" 
      style={{ 
        marginTop: '24px',
        background: 'linear-gradient(135deg, #fff9e6 0%, #fff1f0 50%, #f0f5ff 100%)',
      }}
    >
      {/* 标题区域 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ color: 'var(--color-milktea-brown)', margin: 0 }}>
          <TrophyOutlined style={{ color: '#faad14', marginRight: 12 }} />
          {t('game.gameEnd.title')}
        </Title>
        
        {winner && !loading && (
          <div 
            style={{ 
              marginTop: 16, 
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)',
              borderRadius: 12,
              display: 'inline-block',
              border: '2px solid #ffd666',
            }}
          >
            <Text style={{ fontSize: 18 }}>
              🎉 {t('game.gameEnd.congratulations')} 
              <Text strong style={{ color: '#d48806', fontSize: 20, margin: '0 8px' }}>
                {winner.player_name}
              </Text>
              {t('game.gameEnd.winnerSuffix')}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{t('game.gameEnd.finalAssets')}：</Text>
              <Text strong style={{ color: '#52c41a', fontSize: 24 }}>
                ¥{winner.total_cash.toLocaleString()}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" tip={t('game.gameEnd.loading')} />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 1400 }}
          size="middle"
          style={{ marginBottom: 24 }}
          rowClassName={(_, index) => index === 0 ? 'winner-row' : ''}
        />
      )}

      {/* 返回按钮 */}
      {onBackToLobby && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button 
            type="primary" 
            size="large"
            onClick={onBackToLobby} 
            style={{ 
              borderRadius: 'var(--radius-full)',
              paddingLeft: 32,
              paddingRight: 32,
            }}
          >
            {t('game.gameEnd.backToLobby')}
          </Button>
        </div>
      )}

      <style>{`
        .winner-row {
          background: linear-gradient(90deg, #fffbe6 0%, #fff7e6 100%) !important;
        }
        .winner-row:hover > td {
          background: linear-gradient(90deg, #fff1b8 0%, #ffe7ba 100%) !important;
        }
      `}</style>
    </Card>
  );
};
