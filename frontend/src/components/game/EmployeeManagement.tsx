import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, Space, App, Statistic, Row, Col, InputNumber, Modal } from 'antd';
import { UserAddOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { employeeApi } from '../../api';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { Employee } from '../../types';

interface EmployeeManagementProps {
  disabled?: boolean;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ disabled = false }) => {
  const { currentPlayer, currentGame, setCurrentPlayer } = useGameStore();
  const { message } = App.useApp();
  const { t } = useTranslation();
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
      message.error(t('game.employees.messages.missingContext'));
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
        message.success(t('game.employees.messages.hireSuccess', { name: values.name }));
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
        const limit = match ? `（${match[1]}人）` : '';
        message.warning(t('game.employees.messages.limitReached', { limit }));
      } else if (raw.toLowerCase().includes('insufficient cash')) {
        message.error(t('game.employees.messages.insufficientCash'));
      } else {
        message.error(raw || t('game.employees.messages.hireFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFireEmployee = (employee: Employee) => {
    Modal.confirm({
      title: t('game.employees.modal.fireTitle'),
      content: t('game.employees.modal.fireContent', { name: employee.name }),
      okText: t('game.employees.modal.ok'),
      cancelText: t('game.employees.modal.cancel'),
      onOk: async () => {
        try {
          const response = await employeeApi.fireEmployee(employee.id);
          if (response.success) {
            message.success(t('game.employees.messages.fireSuccess', { name: employee.name }));
            loadEmployees();
            loadTotalProductivity();
          }
        } catch (error: any) {
          message.error(error.error || t('game.employees.messages.fireFailed'));
        }
      },
    });
  };

  const columns = [
    {
      title: t('game.employees.table.name'),
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: t('game.employees.table.salary'),
      dataIndex: 'salary',
      key: 'salary',
      width: 100,
      render: (salary: number) => `￥${salary}`,
    },
    {
      title: t('game.employees.table.productivity'),
      dataIndex: 'productivity',
      key: 'productivity',
      width: 80,
    },
    {
      title: t('game.employees.table.hiredRound'),
      dataIndex: 'hired_round',
      key: 'hired_round',
      width: 100,
    },
    {
      title: t('game.employees.table.action'),
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
          {t('game.employees.table.fire')}
        </Button>
      ),
    },
  ];

  return (
    <Card className="card-cute" style={{ opacity: disabled ? 0.6 : 1 }}>
      <h3 style={{ color: 'var(--color-milktea-brown)', marginBottom: 16 }}>{t('game.employees.title')}</h3>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic
            title={t('game.employees.stats.total')}
            value={employees.length}
            prefix={<TeamOutlined />}
            suffix={t('game.employees.stats.unit')}
          />
        </Col>
        <Col span={8}>
          <Statistic title={t('game.employees.stats.productivity')} value={totalProductivity} />
        </Col>
        <Col span={8}>
          <Statistic title={t('game.employees.stats.salary')} value={totalSalary} prefix="￥" suffix={t('game.employees.stats.salarySuffix')} />
        </Col>
      </Row>

      <Card size="small" className="card-cute" style={{ marginBottom: 16, background: '#FFF9F0' }}>
        <h4 style={{ marginBottom: 16 }}>{t('game.employees.hireTitle')}</h4>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: 16 }}>
          {t('game.employees.hireTip')}
        </p>
        <Form layout="inline" form={form} onFinish={handleHireEmployee}>
          <Form.Item
            name="name"
            rules={[{ required: true, message: t('game.employees.validation.nameRequired') }]}
            style={{ marginBottom: 8 }}
          >
            <Input placeholder={t('game.employees.fields.namePlaceholder')} style={{ width: 120, borderRadius: 'var(--radius-sm)' }} />
          </Form.Item>
          <Form.Item
            name="salary"
            rules={[{ required: true, message: t('game.employees.validation.salaryRequired') }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              placeholder={t('game.employees.fields.salaryPlaceholder')}
              prefix="￥"
              min={0}
              style={{ width: 120, borderRadius: 'var(--radius-sm)' }}
            />
          </Form.Item>
          <Form.Item
            name="productivity"
            rules={[{ required: true, message: t('game.employees.validation.productivityRequired') }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber placeholder={t('game.employees.fields.productivityPlaceholder')} min={1} style={{ width: 100, borderRadius: 'var(--radius-sm)' }} />
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
              {t('game.employees.hireButton')}
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
        locale={{ emptyText: t('game.employees.table.empty') }}
      />
    </Card>
  );
};
