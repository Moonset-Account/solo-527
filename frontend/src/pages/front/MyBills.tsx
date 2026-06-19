import { useState, useEffect } from 'react';
import { Table, Tag, Button, Statistic, Row, Col, Card, message } from 'antd';
import { DollarOutlined, ReloadOutlined, CreditCardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractApi } from '../../services/api';
import { billStatusLabels, billStatusColors } from '../../utils/enums';
import type { Bill } from '../../types';
import { BillStatus } from '../../types';

function MyBills() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Bill[]>([]);
  const [stats, setStats] = useState({ unpaid: 0, paid: 0, total: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contractApi.bills({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        const items = res.data.items;
        setList(items);
        setStats({
          unpaid: items.filter((b) => b.status === BillStatus.Unpaid || b.status === BillStatus.Overdue).reduce((s, b) => s + (b.amount - b.paidAmount), 0),
          paid: items.filter((b) => b.status === BillStatus.Paid || b.status === BillStatus.PartialPaid).reduce((s, b) => s + b.paidAmount, 0),
          total: items.reduce((s, b) => s + b.amount, 0),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { title: '账单编号', dataIndex: 'billNo', width: 180 },
    { title: '类型', dataIndex: 'billType', width: 80 },
    { title: '账期', dataIndex: 'period', width: 100 },
    { title: '账单金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}`, width: 120 },
    { title: '已付金额', dataIndex: 'paidAmount', render: (v: number) => `¥${v.toLocaleString()}`, width: 120 },
    { title: '账单日期', dataIndex: 'billingDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD'), width: 120 },
    { title: '到期日期', dataIndex: 'dueDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD'), width: 120 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: BillStatus) => <Tag color={billStatusColors[v]}>{billStatusLabels[v]}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>
          <DollarOutlined /> 我的账单
        </h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="账单总额" value={stats.total} prefix="¥" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已付金额" value={stats.paid} prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="待付金额" value={stats.unpaid} prefix="¥" valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default MyBills;
