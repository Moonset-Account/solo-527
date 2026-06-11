import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Form, Input, InputNumber, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { courseApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

const CourseManagement: React.FC = () => {
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
      const result = await courseApi.list({ ...filters, pageNum, pageSize });
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
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await courseApi.delete(id);
    message.success('删除成功');
    loadData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await courseApi.update(editing.id, values);
      message.success('更新成功');
    } else {
      await courseApi.create(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '副标题', dataIndex: 'subtitle' },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{v}</span>,
    },
    { title: '课时', dataIndex: 'totalHours', width: 80 },
    { title: '节数', dataIndex: 'totalLessons', width: 80 },
    { title: '分类', dataIndex: 'category', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.text || v}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 200,
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
      <Title level={3}>课程管理</Title>

      <SearchFilter
        keywordPlaceholder="搜索课程标题或描述"
        statusOptions={[
          { label: '草稿', value: 'DRAFT' },
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'INACTIVE' },
        ]}
        onSearch={handleSearch}
      />

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建课程
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
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editing ? '编辑课程' : '新建课程'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="副标题">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面图URL">
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="price" label="价格" rules={[{ required: true }]}>
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="originalPrice" label="原价">
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="totalHours" label="课时">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="totalLessons" label="节数">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="category" label="分类">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '草稿', value: 'DRAFT' },
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
        bizType="COURSE"
        bizId={selectedItem?.id}
        title={`${selectedItem?.title} (#${selectedItem?.id})`}
      />
    </div>
  );
};

export default CourseManagement;
