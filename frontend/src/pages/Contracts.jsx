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
  Select,
  InputNumber,
  DatePicker,
  Space,
  message,
  Spin,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getContracts,
  createContract,
  getSigningProgress,
  getTenants,
  getProperties,
  getConsultants,
} from '../api';

const REVIEW_STATUS_COLOR = {
  DRAFT: 'default',
  PENDING_REVIEW: 'blue',
  REVIEWING: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  ANOMALOUS: 'red',
};

const REVIEW_STATUS_LABEL = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  REVIEWING: '审核中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  ANOMALOUS: '异常',
};

const SIGN_STATUS_COLOR = {
  PENDING_SIGN: 'default',
  SIGNING: 'blue',
  SIGNED: 'green',
  TERMINATED: 'default',
  ANOMALOUS: 'red',
};

const SIGN_STATUS_LABEL = {
  PENDING_SIGN: '待签署',
  SIGNING: '签署中',
  SIGNED: '已签署',
  TERMINATED: '已终止',
  ANOMALOUS: '异常',
};

const REVIEW_STATUS_OPTIONS = Object.keys(REVIEW_STATUS_LABEL).map((key) => ({
  label: REVIEW_STATUS_LABEL[key],
  value: key,
}));

const SIGN_STATUS_OPTIONS = Object.keys(SIGN_STATUS_LABEL).map((key) => ({
  label: SIGN_STATUS_LABEL[key],
  value: key,
}));

export default function Contracts() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [reviewStatusFilter, setReviewStatusFilter] = useState(undefined);
  const [signStatusFilter, setSignStatusFilter] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [consultants, setConsultants] = useState([]);

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (reviewStatusFilter) params.reviewStatus = reviewStatusFilter;
    if (signStatusFilter) params.signStatus = signStatusFilter;
    getContracts(params)
      .then((res) => setData(res))
      .catch((err) => message.error(err.message || '加载合同列表失败'))
      .finally(() => setLoading(false));
  };

  const fetchProgress = () => {
    setProgressLoading(true);
    getSigningProgress()
      .then((res) => setProgress(res))
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetchProgress();
  }, [reviewStatusFilter, signStatusFilter]);

  const openModal = () => {
    setModalOpen(true);
    getTenants()
      .then((res) => setTenants(res || []))
      .catch(() => {});
    getProperties()
      .then((res) => setProperties(res || []))
      .catch(() => {});
    getConsultants()
      .then((res) => setConsultants(res || []))
      .catch(() => {});
  };

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = { ...values };
        if (values.startDate) payload.startDate = values.startDate.format('YYYY-MM-DD');
        if (values.endDate) payload.endDate = values.endDate.format('YYYY-MM-DD');
        setConfirmLoading(true);
        return createContract(payload);
      })
      .then(() => {
        message.success('新建合同成功');
        setModalOpen(false);
        form.resetFields();
        fetchData();
        fetchProgress();
      })
      .catch((err) => {
        if (err.message) message.error(err.message);
      })
      .finally(() => setConfirmLoading(false));
  };

  const columns = [
    { title: '租客姓名', dataIndex: 'tenantName', key: 'tenantName' },
    { title: '房源标题', dataIndex: 'propertyTitle', key: 'propertyTitle' },
    { title: '月租金(元)', dataIndex: 'monthlyRent', key: 'monthlyRent' },
    { title: '押金(元)', dataIndex: 'depositAmount', key: 'depositAmount' },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (status) => (
        <Tag color={REVIEW_STATUS_COLOR[status]}>{REVIEW_STATUS_LABEL[status] || status}</Tag>
      ),
    },
    {
      title: '签署状态',
      dataIndex: 'signStatus',
      key: 'signStatus',
      render: (status) => (
        <Tag color={SIGN_STATUS_COLOR[status]}>{SIGN_STATUS_LABEL[status] || status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/contracts/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  const progressCards = progress
    ? [
        { title: '草稿', value: progress.draftCount ?? 0 },
        { title: '待审核', value: progress.pendingReviewCount ?? 0 },
        { title: '审核中', value: progress.reviewingCount ?? 0 },
        { title: '已通过', value: progress.approvedCount ?? 0 },
        { title: '待签署', value: progress.pendingSignCount ?? 0 },
        { title: '签署中', value: progress.signingCount ?? 0 },
        { title: '已签署', value: progress.signedCount ?? 0 },
        { title: '已终止', value: progress.terminatedCount ?? 0 },
        { title: '异常', value: progress.anomalousCount ?? 0 },
      ]
    : [];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {progressLoading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          {progressCards.map((item) => (
            <Col key={item.title} xs={12} sm={8} md={6} lg={4}>
              <Card size="small">
                <Statistic title={item.title} value={item.value} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Space>
        <Select
          allowClear
          placeholder="审核状态筛选"
          style={{ width: 160 }}
          value={reviewStatusFilter}
          onChange={(val) => setReviewStatusFilter(val)}
          options={REVIEW_STATUS_OPTIONS}
        />
        <Select
          allowClear
          placeholder="签署状态筛选"
          style={{ width: 160 }}
          value={signStatusFilter}
          onChange={(val) => setSignStatusFilter(val)}
          options={SIGN_STATUS_OPTIONS}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          新建合同
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
        title="新建合同"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tenantId"
            label="租客"
            rules={[{ required: true, message: '请选择租客' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={tenants.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>
          <Form.Item
            name="propertyId"
            label="房源"
            rules={[{ required: true, message: '请选择房源' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={properties.map((p) => ({ label: p.title, value: p.id }))}
            />
          </Form.Item>
          <Form.Item
            name="consultantId"
            label="顾问"
            rules={[{ required: true, message: '请选择顾问' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={consultants.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item
            name="monthlyRent"
            label="月租金(元)"
            rules={[{ required: true, message: '请输入月租金' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="depositAmount"
            label="押金(元)"
            rules={[{ required: true, message: '请输入押金' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="结束日期"
            rules={[{ required: true, message: '请选择结束日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
