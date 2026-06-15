import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Modal,
  message,
  Space,
  Spin,
  Select,
} from 'antd';
import {
  ExclamationCircleOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getBills,
  getOverdueBills,
  payBill,
  markBillOverdue,
  scanOverdue,
} from '../api';

const BILL_TYPE_LABEL = {
  DEPOSIT: '押金',
  RENT: '租金',
  UTILITY: '水电',
  MANAGEMENT_FEE: '物业费',
  PENALTY: '违约金',
};

const BILL_TYPE_OPTIONS = Object.keys(BILL_TYPE_LABEL).map((key) => ({
  label: BILL_TYPE_LABEL[key],
  value: key,
}));

const STATUS_COLOR = {
  PENDING: 'blue',
  PROCESSING: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  ANOMALOUS: 'red',
  CANCELLED: 'default',
};

const STATUS_LABEL = {
  PENDING: '待支付',
  PROCESSING: '处理中',
  PAID: '已支付',
  OVERDUE: '逾期',
  ANOMALOUS: '异常',
  CANCELLED: '已取消',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL).map((key) => ({
  label: STATUS_LABEL[key],
  value: key,
}));

export default function Bills() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [billTypeFilter, setBillTypeFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [scanning, setScanning] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (billTypeFilter) params.billType = billTypeFilter;
    if (statusFilter) params.status = statusFilter;
    getBills(params)
      .then((res) => setData(res))
      .catch((err) => message.error(err.message || '加载账单列表失败'))
      .finally(() => setLoading(false));
  };

  const fetchOverdueCount = () => {
    setOverdueLoading(true);
    getOverdueBills()
      .then((res) => setOverdueCount(res?.length ?? 0))
      .catch(() => {})
      .finally(() => setOverdueLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetchOverdueCount();
  }, [billTypeFilter, statusFilter]);

  const pendingCount = data.filter((b) => b.status === 'PENDING').length;
  const totalCount = data.length;

  const handlePay = (record) => {
    Modal.confirm({
      title: '确认支付',
      icon: <ExclamationCircleOutlined />,
      content: `确认支付账单 ${record.id}？金额：${record.amount} 元`,
      onOk: () =>
        payBill(record.id)
          .then(() => {
            message.success('支付成功');
            fetchData();
            fetchOverdueCount();
          })
          .catch((err) => message.error(err.message || '支付失败')),
    });
  };

  const handleMarkOverdue = (record) => {
    Modal.confirm({
      title: '确认标记逾期',
      icon: <ExclamationCircleOutlined />,
      content: `确认将账单 ${record.id} 标记为逾期？`,
      onOk: () =>
        markBillOverdue(record.id)
          .then(() => {
            message.success('标记逾期成功');
            fetchData();
            fetchOverdueCount();
          })
          .catch((err) => message.error(err.message || '标记逾期失败')),
    });
  };

  const handleScanOverdue = () => {
    setScanning(true);
    scanOverdue()
      .then(() => {
        message.success('逾期扫描完成，已生成待办事项');
        fetchData();
        fetchOverdueCount();
      })
      .catch((err) => message.error(err.message || '逾期扫描失败'))
      .finally(() => setScanning(false));
  };

  const isPastDue = (record) => {
    if (record.status !== 'PENDING') return false;
    return dayjs(record.dueDate).isBefore(dayjs(), 'day');
  };

  const columns = [
    {
      title: '合同信息',
      key: 'contractInfo',
      render: (_, record) => (
        <div>
          <div>{record.tenantName}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.propertyTitle}</div>
        </div>
      ),
    },
    {
      title: '账单类型',
      dataIndex: 'billType',
      key: 'billType',
      render: (type) => <Tag>{BILL_TYPE_LABEL[type] || type}</Tag>,
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '支付日',
      dataIndex: 'paidDate',
      key: 'paidDate',
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status] || status}</Tag>
      ),
    },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      render: (val) => (val > 0 ? val : '-'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {(record.status === 'PENDING' || record.status === 'OVERDUE') && (
            <Button type="link" onClick={() => handlePay(record)}>
              支付
            </Button>
          )}
          {isPastDue(record) && (
            <Button type="link" danger onClick={() => handleMarkOverdue(record)}>
              标记逾期
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8}>
          <Card size="small">
            {overdueLoading ? (
              <Spin />
            ) : (
              <Statistic title="逾期账单" value={overdueCount} valueStyle={{ color: '#cf1322' }} />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="待支付" value={pendingCount} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="账单总数" value={totalCount} />
          </Card>
        </Col>
      </Row>

      <Space>
        <Select
          allowClear
          placeholder="账单类型筛选"
          style={{ width: 160 }}
          value={billTypeFilter}
          onChange={(val) => setBillTypeFilter(val)}
          options={BILL_TYPE_OPTIONS}
        />
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={STATUS_OPTIONS}
        />
        <Button icon={<ScanOutlined />} loading={scanning} onClick={handleScanOverdue}>
          扫描逾期
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />
    </Space>
  );
}
