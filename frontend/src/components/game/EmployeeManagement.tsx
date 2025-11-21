import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, Space, App, Statistic, Row, Col, InputNumber, Modal } from 'antd';
import { UserAddOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { employeeApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import type { Employee } from '../../types';

interface EmployeeManagementProps {
  disabled?: boolean;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ disabled = false }) => {
  const { currentPlayer, currentGame, setCurrentPlayer } = useGameStore();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalProductivity, setTotalProductivity] = useState(0);
  const [totalSalary, setTotalSalary] = useState(0);

  useEffect(() => {
    if (currentPlayer) {
      loadEmployees();
      loadTotalProductivity();
    }
  }, [currentPlayer?.id]);

  const loadEmployees = async () => {
    if (!currentPlayer) return;

    try {
      const response = await employeeApi.getShopEmployees(currentPlayer.id, false);
      if (response.success && response.data) {
        setEmployees(response.data);
        calculateTotals(response.data);
      }
    } catch (error: any) {
      console.error('加载员工列表失败:', error);
    }
  };

  const loadTotalProductivity = async () => {
    if (!currentPlayer) return;

    try {
      const response = await employeeApi.getTotalProductivity(currentPlayer.id);
      if (response.success && response.data) {
        setTotalProductivity(response.data.total_productivity);
      }
    } catch (error: any) {
      console.error('加载总生产力失败:', error);
    }
  };

  const calculateTotals = (empList: Employee[]) => {
    const totalProd = empList.reduce((sum, emp) => sum + emp.productivity, 0);
    const totalSal = empList.reduce((sum, emp) => sum + emp.salary, 0);
    setTotalProductivity(totalProd);
    setTotalSalary(totalSal);
  };

  const handleHireEmployee = async (values: any) => {
    if (!currentPlayer || !currentGame) {
      message.error('玩家或游戏信息丢失');
      return;
    }

    setLoading(true);
    try {
      const response = await employeeApi.hireEmployee({
        player_id: currentPlayer.id,
        name: values.name,
        salary: values.salary,
        productivity: values.productivity,
        round_number: currentGame.current_round,
      });

      if (response.success) {
        message.success(`成功招聘员工 ${values.name}！`);
        if (response.data?.remaining_cash !== undefined && currentPlayer) {
          setCurrentPlayer({ ...currentPlayer, cash: response.data.remaining_cash });
        }
        form.resetFields();
        loadEmployees();
        loadTotalProductivity();
      }
    } catch (error: any) {
      const raw: string = error?.error || '';
      if (raw.includes('maximum employees')) {
        const match = raw.match(/max(?:imum)? employees\s*\((\d+)/i);
        const limit = match ? match[1] : '';
        message.warning(`门店员工已达上限${limit ? `（${limit}人）` : ''}，请升级装修后再雇佣。`);
      } else if (raw.toLowerCase().includes('insufficient cash')) {
        message.error('余额不足，无法支付本回合工资');
      } else {
        message.error(raw || '招聘失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFireEmployee = (employee: Employee) => {
    Modal.confirm({
      title: '确认解雇',
      content: `确定要解雇员工 ${employee.name} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await employeeApi.fireEmployee(employee.id);
          if (response.success) {
            message.success(`已解雇员工 ${employee.name}`);
            loadEmployees();
            loadTotalProductivity();
          }
        } catch (error: any) {
          message.error(error.error || '解雇失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '工资',
      dataIndex: 'salary',
      key: 'salary',
      width: 100,
      render: (salary: number) => `¥${salary}`,
    },
    {
      title: '生产力',
      dataIndex: 'productivity',
      key: 'productivity',
      width: 80,
    },
    {
      title: '雇佣回合',
      dataIndex: 'hired_round',
      key: 'hired_round',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Employee) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleFireEmployee(record)}
          disabled={disabled}
        >
          解雇
        </Button>
      ),
    },
  ];

  return (
    <Card className="card-cute" style={{ opacity: disabled ? 0.6 : 1 }}>
      <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>👥 员工管理</h3>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic
            title="员工总数"
            value={employees.length}
            prefix={<TeamOutlined />}
            suffix="人"
          />
        </Col>
        <Col span={8}>
          <Statistic title="总生产力" value={totalProductivity} />
        </Col>
        <Col span={8}>
          <Statistic title="总工资" value={totalSalary} prefix="¥" suffix="/回合" />
        </Col>
      </Row>

      <Card size="small" className="card-cute" style={{ marginBottom: 16, background: '#FFF9F0' }}>
        <h4 style={{ marginBottom: 16 }}>招聘新员工</h4>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: 16 }}>
          提示：请在线下抽取员工卡，然后在此输入员工的姓名、工资和生产力
        </p>
        <Form layout="inline" form={form} onFinish={handleHireEmployee}>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder="员工姓名" style={{ width: 120, borderRadius: 'var(--radius-sm)' }} />
          </Form.Item>
          <Form.Item
            name="salary"
            rules={[{ required: true, message: '请输入工资' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              placeholder="工资"
              prefix="¥"
              min={0}
              style={{ width: 120, borderRadius: 'var(--radius-sm)' }}
            />
          </Form.Item>
          <Form.Item
            name="productivity"
            rules={[{ required: true, message: '请输入生产力' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber placeholder="生产力" min={1} style={{ width: 100, borderRadius: 'var(--radius-sm)' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UserAddOutlined />}
              loading={loading}
              disabled={disabled}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              招聘
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无员工' }}
      />
    </Card>
  );
};
