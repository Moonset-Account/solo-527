import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Spin, message } from 'antd';
import { HomeOutlined, FileTextOutlined, DollarOutlined, AlertOutlined, CheckSquareOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDashboard } from '../api';

const STATUS_COLOR = {
  vacant: 'default',
  occupied: 'green',
  processing: 'blue',
  anomalous: 'red',
  reserved: 'orange',
  pendingReview: 'default',
  reviewing: 'blue',
  signing: 'blue',
  signed: 'green',
  overdue: 'red',
  pending: 'default',
  open: 'default',
  inProgress: 'blue',
  overdueRent: 'red',
};

const STATUS_LABEL = {
  vacant: '空置',
  occupied: '已入住',
  processing: '办理中',
  anomalous: '异常',
  reserved: '已预留',
  pendingReview: '待审核',
  reviewing: '审核中',
  signing: '签署中',
  signed: '已签署',
  overdue: '逾期',
  pending: '待处理',
  open: '待处理',
  inProgress: '进行中',
  overdueRent: '逾期收租',
};

const VIEWING_STATUS_LABEL = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到场',
};

const VIEWING_STATUS_COLOR = {
  PENDING: 'blue',
  CONFIRMED: 'green',
  COMPLETED: 'green',
  CANCELLED: 'default',
  NO_SHOW: 'orange',
};

const REVIEW_STATUS_LABEL = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  REVIEWING: '审核中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  ANOMALOUS: '异常',
};

const REVIEW_STATUS_COLOR = {
  DRAFT: 'default',
  PENDING_REVIEW: 'blue',
  REVIEWING: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  ANOMALOUS: 'red',
};

const viewingColumns = [
  {
    title: '房源',
    key: 'property',
    render: (_, record) => record.property?.title || '-',
  },
  {
    title: '租客',
    key: 'tenant',
    render: (_, record) => record.tenant?.name || '-',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={VIEWING_STATUS_COLOR[status]}>{VIEWING_STATUS_LABEL[status] || status}</Tag>
    ),
  },
  {
    title: '预约时间',
    dataIndex: 'scheduledAt',
    key: 'scheduledAt',
    render: (val) => (val ? dayjs(val).format('MM-DD HH:mm') : '-'),
  },
];

const contractColumns = [
  {
    title: '房源',
    key: 'property',
    render: (_, record) => record.property?.title || '-',
  },
  {
    title: '租客',
    key: 'tenant',
    render: (_, record) => record.tenant?.name || '-',
  },
  {
    title: '审核状态',
    dataIndex: 'reviewStatus',
    key: 'reviewStatus',
    render: (status) => (
      <Tag color={REVIEW_STATUS_COLOR[status]}>{REVIEW_STATUS_LABEL[status] || status}</Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (val) => (val ? dayjs(val).format('MM-DD HH:mm') : '-'),
  },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res))
      .catch((err) => message.error(err.message || '加载仪表盘失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  const { property, contract, bill, todo, recentViewings, recentContracts } = data;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title={<Space><HomeOutlined />房源统计</Space>}>
        <Row gutter={16}>
          <Col span={4}><Statistic title="总房源" value={property.total} /></Col>
          <Col span={4}><Statistic title="空置" value={property.vacant} valueStyle={{ color: STATUS_COLOR.vacant === 'default' ? undefined : STATUS_COLOR.vacant }} /></Col>
          <Col span={4}><Statistic title="已入住" value={property.occupied} valueStyle={{ color: 'green' }} /></Col>
          <Col span={4}><Statistic title="办理中" value={property.processing} valueStyle={{ color: 'blue' }} /></Col>
          <Col span={4}><Statistic title="异常" value={property.anomalous} valueStyle={{ color: 'red' }} /></Col>
          <Col span={4}><Statistic title="空置率" value={property.vacancyRate} suffix="%" /></Col>
        </Row>
      </Card>

      <Card title={<Space><FileTextOutlined />合同统计</Space>}>
        <Row gutter={16}>
          <Col span={4}><Statistic title="总合同" value={contract.total} /></Col>
          <Col span={4}><Statistic title="待审核" value={contract.pendingReview} /></Col>
          <Col span={4}><Statistic title="审核中" value={contract.reviewing} valueStyle={{ color: 'blue' }} /></Col>
          <Col span={4}><Statistic title="签署中" value={contract.signing} valueStyle={{ color: 'blue' }} /></Col>
          <Col span={4}><Statistic title="已签署" value={contract.signed} valueStyle={{ color: 'green' }} /></Col>
          <Col span={4}><Statistic title="异常" value={contract.anomalous} valueStyle={{ color: 'red' }} /></Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={<Space><DollarOutlined />账单统计</Space>}>
            <Row gutter={16}>
              <Col span={12}><Statistic title="逾期" value={bill.overdue} valueStyle={{ color: 'red' }} prefix={<AlertOutlined />} /></Col>
              <Col span={12}><Statistic title="待处理" value={bill.pending} /></Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<Space><CheckSquareOutlined />待办统计</Space>}>
            <Row gutter={16}>
              <Col span={8}><Statistic title="待处理" value={todo.open} /></Col>
              <Col span={8}><Statistic title="进行中" value={todo.inProgress} valueStyle={{ color: 'blue' }} /></Col>
              <Col span={8}><Statistic title="逾期收租" value={todo.overdueRent} valueStyle={{ color: 'red' }} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近看房记录">
            <Table
              dataSource={recentViewings}
              columns={viewingColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近合同记录">
            <Table
              dataSource={recentContracts}
              columns={contractColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
