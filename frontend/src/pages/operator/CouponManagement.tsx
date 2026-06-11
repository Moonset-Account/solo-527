import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Form, Input, InputNumber, DatePicker, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { couponApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CouponManagement: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SearchFilterValues>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await couponApi.list({ ...filters, pageNum, pageSize });
      setData(result.records || []);
      setTotal(result.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, pageNum, pageSize]);

  const handleSearch = (values: SearchFilterValues) => {
    setFilters(values);
    setPageNum(1);
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      timeRange:
        record.startTime && record.endTime
          ? [dayjs(record.startTime), dayjs(record.endTime)]
          : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await couponApi.delete(id);
    message.success('删除成功');
    loadData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startTime: values.timeRange?.[0]?.toISOString(),
      endTime: values.timeRange?.[1]?.toISOString(),
    };
    delete payload.timeRange;
    if (editing) {
      await couponApi.update(editing.id, payload);
      message.success('更新成功');
    } else {
      await couponApi.create(payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '优惠券名称', dataIndex: 'name', width: 160 },
    { title: '优惠码', dataIndex: 'code', width: 120 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'FIXED' ? 'red' : 'green'}>
          {v === 'FIXED' ? '固定金额' : '折扣比例'}
        </Tag>
      ),
    },
    {
      title: '优惠值',
      dataIndex: 'discountValue',
      width: 120,
      render: (v: number, r: any) =>
        r.type === 'FIXED' ? `¥${v}` : `${v}%`,
    },
    {
      title: '使用门槛',
      dataIndex: 'minAmount',
      width: 120,
      render: (v: number) => (v && v > 0 ? `满¥${v}` : '无门槛'),
    },
    {
      title: '已用/总量',
      width: 120,
      render: (_: any, r: any) => `${r.usedCount || 0} / ${r.totalCount || 0}`,
    },
    {
      title: '有效期',
      width: 280,
      render: (_: any, r: any) =>
        r.startTime && r.endTime
          ? `${dayjs(r.startTime).format('YYYY-MM-DD')} ~ ${dayjs(r.endTime).format('YYYY-MM-DD')}`
          : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.text || v}</Tag>
      ),
    },
    {
      title: '操作',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => {
            setSelectedItem(record);
            setPanelOpen(true);
          }}>
            操作面板
          </Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>优惠管理</Title>

      <SearchFilter
        keywordPlaceholder="搜索优惠券名称或优惠码"
        statusOptions={[
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'INACTIVE' },
        ]}
        onSearch={handleSearch}
      />

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建优惠券
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPageNum(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editing ? '编辑优惠券' : '新建优惠券'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }}>
            <Form.Item name="name" label="优惠券名称" rules={[{ required: true }]}>
              <Input style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="code" label="优惠码" rules={[{ required: true }]}>
              <Input style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="type" label="优惠类型" rules={[{ required: true }]}>
              <Select
                style={{ width: 200 }}
                options={[
                  { label: '固定金额', value: 'FIXED' },
                  { label: '折扣比例', value: 'PERCENT' },
                ]}
              />
            </Form.Item>
            <Form.Item name="discountValue" label="优惠值" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="minAmount" label="使用门槛">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="totalCount" label="发放总量" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="timeRange" label="有效期">
              <RangePicker showTime />
            </Form.Item>
          </Space>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '启用', value: 'ACTIVE' },
                { label: '禁用', value: 'INACTIVE' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <OperationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        bizType="COUPON"
        bizId={selectedItem?.id}
        title={`${selectedItem?.name} (#${selectedItem?.id})`}
      />
    </div>
  );
};

export default CouponManagement;
