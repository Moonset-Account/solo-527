import { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Select, Space, Modal, Form, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getProperties, createProperty } from '../api';

const STATUS_COLOR = {
  VACANT: 'default',
  RESERVED: 'orange',
  OCCUPIED: 'green',
  UNDER_MAINTENANCE: 'warning',
  PROCESSING: 'blue',
  ANOMALOUS: 'red',
};

const STATUS_LABEL = {
  VACANT: '空置',
  RESERVED: '已预定',
  OCCUPIED: '已入住',
  UNDER_MAINTENANCE: '维护中',
  PROCESSING: '办理中',
  ANOMALOUS: '异常',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL).map((key) => ({
  label: STATUS_LABEL[key],
  value: key,
}));

export default function Properties() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (keyword.trim()) params.keyword = keyword.trim();
    getProperties(params)
      .then((res) => setData(res))
      .catch((err) => message.error(err.message || '加载房源失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, keyword]);

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        setConfirmLoading(true);
        return createProperty(values);
      })
      .then(() => {
        message.success('新增房源成功');
        setModalOpen(false);
        form.resetFields();
        fetchData();
      })
      .catch((err) => {
        if (err.message) message.error(err.message);
      })
      .finally(() => setConfirmLoading(false));
  };

  const columns = [
    { title: '房源标题', dataIndex: 'title', key: 'title' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '户型', dataIndex: 'layout', key: 'layout' },
    { title: '面积(㎡)', dataIndex: 'area', key: 'area' },
    { title: '月租金(元)', dataIndex: 'monthlyRent', key: 'monthlyRent' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status] || status}</Tag>,
    },
    { title: '空置天数', dataIndex: 'vacancyDays', key: 'vacancyDays' },
    { title: '房东', dataIndex: 'landlordName', key: 'landlordName' },
    { title: '托管经理', dataIndex: 'escrowManagerName', key: 'escrowManagerName' },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/properties/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={STATUS_OPTIONS}
        />
        <Input.Search
          placeholder="关键词搜索"
          allowClear
          style={{ width: 240 }}
          onSearch={(val) => setKeyword(val)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新增房源
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
        title="新增房源"
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
          <Form.Item name="title" label="房源标题" rules={[{ required: true, message: '请输入房源标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="layout" label="户型" rules={[{ required: true, message: '请输入户型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="area" label="面积(㎡)" rules={[{ required: true, message: '请输入面积' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="monthlyRent" label="月租金(元)" rules={[{ required: true, message: '请输入月租金' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="landlordName" label="房东姓名" rules={[{ required: true, message: '请输入房东姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="escrowManagerName" label="托管经理" rules={[{ required: true, message: '请输入托管经理' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
