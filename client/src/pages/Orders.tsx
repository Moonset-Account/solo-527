import { Button, Card, Col, Input, Row, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined, WarningOutlined } from '@ant-design/icons';
import type { Order, OrderStatus } from '../types';

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  Created: { color: 'default', text: '已创建' },
  Fulfilling: { color: 'processing', text: '履约中' },
  Fulfilled: { color: 'success', text: '已完成' },
  Overdue: { color: 'error', text: '已逾期' },
};

const mockData: Order[] = [];

const Orders: React.FC = () => {
  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '关联批次',
      dataIndex: ['batch', 'batchNumber'],
      key: 'batchNumber',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '总金额(¥)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
    },
    {
      title: '交货日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        const s = statusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>详情</a>
          <a>发货</a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="订单总数"
              value={0}
              prefix={<ShoppingOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="履约中"
              value={0}
              prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="已逾期"
              value={0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Card
        title="订单履约管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            新建订单
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索订单号"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
          />
          <Button type="primary">搜索</Button>
        </Space>
        <Table<Order>
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowSelection={{}}
        />
      </Card>
    </div>
  );
};

export default Orders;
