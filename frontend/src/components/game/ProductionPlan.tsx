import React from 'react';
import { Card, Typography, Progress, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface ProductionPlanProps {
  totalProductivity?: number;
  usedProductivity?: number;
}

export const ProductionPlan: React.FC<ProductionPlanProps> = ({
  totalProductivity = 0,
  usedProductivity = 0,
}) => {
  const percent = totalProductivity === 0 ? 0 : Math.min(100, Math.round((usedProductivity / totalProductivity) * 100));

  return (
    <Card className="card-cute" styles={{ body: { padding: '16px 24px' } }}>
      <Title level={4} style={{ color: 'var(--color-milktea-brown)' }}>
        ⚙️ 生产计划
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
        生产功能 API 数据迭代不支持，生产计划分析缺失，功能需要在后期迭代中完善
      </Paragraph>

      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">总生产效率可用</Text>
          <Title level={3} style={{ margin: 0 }}> {totalProductivity}</Title>
        </div>
        <div>
          <Text type="secondary">已分配生产效率可用</Text>
          <Title level={4} style={{ margin: 0 }}>{usedProductivity}</Title>
        </div>
        <Progress percent={percent} strokeColor="#FFB6C1" showInfo />
      </Space>
    </Card>
  );
};
