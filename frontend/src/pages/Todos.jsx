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
  Form,
  Input,
  Select,
  Space,
  message,
  Spin,
} from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getTodos,
  getTodoStats,
  updateTodo,
  closeTodo,
  scanOverdue,
} from '../api';

const SOURCE_TYPE_COLOR = {
  OVERDUE_RENT: 'red',
  CONTRACT_ANOMALY: 'red',
  VACANCY_ALERT: 'orange',
  REVIEW_REQUIRED: 'blue',
  ESCROW_CLOSURE: 'purple',
  OTHER: 'default',
};

const SOURCE_TYPE_LABEL = {
  OVERDUE_RENT: '租金逾期',
  CONTRACT_ANOMALY: '合同异常',
  VACANCY_ALERT: '空置预警',
  REVIEW_REQUIRED: '审核待办',
  ESCROW_CLOSURE: '托管关闭',
  OTHER: '其他',
};

const PRIORITY_COLOR = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

const PRIORITY_LABEL = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

const STATUS_COLOR = {
  OPEN: 'blue',
  IN_PROGRESS: 'blue',
  PENDING_CONFIRM: 'orange',
  CLOSED: 'default',
};

const STATUS_LABEL = {
  OPEN: '待处理',
  IN_PROGRESS: '处理中',
  PENDING_CONFIRM: '待确认',
  CLOSED: '已关闭',
};

const SOURCE_TYPE_OPTIONS = Object.keys(SOURCE_TYPE_LABEL).map((key) => ({
  label: SOURCE_TYPE_LABEL[key],
  value: key,
}));

const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABEL).map((key) => ({
  label: PRIORITY_LABEL[key],
  value: key,
}));

const STATUS_OPTIONS = Object.keys(STATUS_LABEL).map((key) => ({
  label: STATUS_LABEL[key],
  value: key,
}));

export default function Todos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ openCount: 0, inProgressCount: 0, pendingConfirmCount: 0, totalCount: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [sourceTypeFilter, setSourceTypeFilter] = useState(undefined);
  const [priorityFilter, setPriorityFilter] = useState(undefined);
  const [scanning, setScanning] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closingTodo, setClosingTodo] = useState(null);
  const [closeForm] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (sourceTypeFilter) params.sourceType = sourceTypeFilter;
    if (priorityFilter) params.priority = priorityFilter;
    getTodos(params)
      .then((res) => setData(res))
      .catch((err) => message.error(err.message || '加载待办列表失败'))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    setStatsLoading(true);
    getTodoStats()
      .then((res) => setStats(res))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [statusFilter, sourceTypeFilter, priorityFilter]);

  const handleProcess = (record) => {
    updateTodo(record.id, { status: 'IN_PROGRESS' })
      .then(() => {
        message.success('已开始处理');
        fetchData();
        fetchStats();
      })
      .catch((err) => message.error(err.message || '操作失败'));
  };

  const showCloseModal = (record) => {
    setClosingTodo(record);
    setCloseModalVisible(true);
    closeForm.resetFields();
  };

  const handleClose = () => {
    closeForm
      .validateFields()
      .then((values) => {
        closeTodo(closingTodo.id, { closedReason: values.closedReason })
          .then(() => {
            message.success('已关闭');
            setCloseModalVisible(false);
            setClosingTodo(null);
            fetchData();
            fetchStats();
          })
          .catch((err) => message.error(err.message || '关闭失败'));
      });
  };

  const handleScanOverdue = () => {
    setScanning(true);
    scanOverdue()
      .then(() => {
        message.success('逾期扫描完成');
        fetchData();
        fetchStats();
      })
      .catch((err) => message.error(err.message || '逾期扫描失败'))
      .finally(() => setScanning(false));
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '来源类型',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (val) => <Tag color={SOURCE_TYPE_COLOR[val]}>{SOURCE_TYPE_LABEL[val] || val}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (val) => <Tag color={PRIORITY_COLOR[val]}>{PRIORITY_LABEL[val] || val}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <Tag color={STATUS_COLOR[val]}>{STATUS_LABEL[val] || val}</Tag>,
    },
    {
      title: '负责人',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (val) => val || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (val) => val || '-',
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '关闭原因',
      dataIndex: 'closedReason',
      key: 'closedReason',
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'OPEN' && (
            <Button type="link" onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          {record.status !== 'CLOSED' && (
            <Button type="link" onClick={() => showCloseModal(record)}>
              关闭
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            {statsLoading ? (
              <Spin />
            ) : (
              <Statistic title="待处理" value={stats.openCount} valueStyle={{ color: '#1677ff' }} />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            {statsLoading ? (
              <Spin />
            ) : (
              <Statistic title="处理中" value={stats.inProgressCount} valueStyle={{ color: '#1677ff' }} />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            {statsLoading ? (
              <Spin />
            ) : (
              <Statistic title="待确认" value={stats.pendingConfirmCount} valueStyle={{ color: '#fa8c16' }} />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            {statsLoading ? (
              <Spin />
            ) : (
              <Statistic title="总数" value={stats.totalCount} />
            )}
          </Card>
        </Col>
      </Row>

      <Space>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={STATUS_OPTIONS}
        />
        <Select
          allowClear
          placeholder="来源类型筛选"
          style={{ width: 160 }}
          value={sourceTypeFilter}
          onChange={(val) => setSourceTypeFilter(val)}
          options={SOURCE_TYPE_OPTIONS}
        />
        <Select
          allowClear
          placeholder="优先级筛选"
          style={{ width: 160 }}
          value={priorityFilter}
          onChange={(val) => setPriorityFilter(val)}
          options={PRIORITY_OPTIONS}
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

      <Modal
        title="关闭待办"
        open={closeModalVisible}
        onOk={handleClose}
        onCancel={() => {
          setCloseModalVisible(false);
          setClosingTodo(null);
        }}
        okText="确认关闭"
        cancelText="取消"
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item
            name="closedReason"
            label="关闭原因"
            rules={[{ required: true, message: '请输入关闭原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入关闭原因" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
