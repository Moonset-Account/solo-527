import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  DatePicker,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getViewings,
  createViewing,
  updateViewing,
  getTenants,
  getProperties,
  getConsultants,
} from '../api';

const STATUS_COLOR = {
  PENDING: 'blue',
  CONFIRMED: 'green',
  COMPLETED: 'green',
  CANCELLED: 'default',
  NO_SHOW: 'orange',
};

const STATUS_LABEL = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到场',
};

export default function Viewings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [searchText, setSearchText] = useState('');
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [consultants, setConsultants] = useState([]);

  const fetchData = (params = {}) => {
    setLoading(true);
    getViewings(params)
      .then((res) => setData(Array.isArray(res) ? res : res.items || res.data || []))
      .catch((err) => message.error(err.message || '加载看房列表失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSelectOptions = () => {
    getTenants()
      .then((res) => setTenants(Array.isArray(res) ? res : res.items || res.data || []))
      .catch(() => {});
    getProperties()
      .then((res) => setProperties(Array.isArray(res) ? res : res.items || res.data || []))
      .catch(() => {});
    getConsultants()
      .then((res) => setConsultants(Array.isArray(res) ? res : res.items || res.data || []))
      .catch(() => {});
  };

  const handleOpenModal = () => {
    fetchSelectOptions();
    setModalOpen(true);
  };

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = {
          ...values,
          scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
        };
        setConfirmLoading(true);
        return createViewing(payload);
      })
      .then(() => {
        message.success('预约看房成功');
        setModalOpen(false);
        form.resetFields();
        fetchData();
      })
      .catch((err) => {
        if (err.message) message.error(err.message);
      })
      .finally(() => setConfirmLoading(false));
  };

  const handleStatusUpdate = (id, status) => {
    updateViewing(id, { status })
      .then(() => {
        message.success('状态更新成功');
        fetchData();
      })
      .catch((err) => message.error(err.message || '状态更新失败'));
  };

  const handleFilter = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (searchText) params.search = searchText;
    fetchData(params);
  };

  const columns = [
    { title: '租客姓名', dataIndex: 'tenantName', key: 'tenantName' },
    { title: '房源标题', dataIndex: 'propertyTitle', key: 'propertyTitle' },
    { title: '顾问姓名', dataIndex: 'consultantName', key: 'consultantName' },
    {
      title: '预约时间',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status] || status}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <Button type="link" size="small" onClick={() => handleStatusUpdate(record.id, 'CONFIRMED')}>
              确认
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'CONFIRMED') && (
            <>
              <Button type="link" size="small" onClick={() => handleStatusUpdate(record.id, 'COMPLETED')}>
                完成
              </Button>
              <Button type="link" size="small" danger onClick={() => handleStatusUpdate(record.id, 'CANCELLED')}>
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <Input.Search
          placeholder="搜索"
          style={{ width: 200 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleFilter}
        />
        <Button type="primary" onClick={handleFilter}>
          筛选
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          预约看房
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
        title="预约看房"
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
          <Form.Item name="tenantId" label="租客" rules={[{ required: true, message: '请选择租客' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={tenants.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="请选择租客"
            />
          </Form.Item>
          <Form.Item name="propertyId" label="房源" rules={[{ required: true, message: '请选择房源' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={properties.map((p) => ({ value: p.id, label: p.title }))}
              placeholder="请选择房源"
            />
          </Form.Item>
          <Form.Item name="consultantId" label="顾问">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={consultants.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="请选择顾问（可选）"
            />
          </Form.Item>
          <Form.Item name="scheduledAt" label="预约时间" rules={[{ required: true, message: '请选择预约时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
