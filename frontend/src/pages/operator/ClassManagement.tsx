import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Form, Input, InputNumber, DatePicker, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { classApi, courseApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import OperationPanel from '@/components/OperationPanel';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

const ClassManagement: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
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
      const [result, courseList] = await Promise.all([
        classApi.list({ ...filters, pageNum, pageSize }),
        courseApi.list({ status: 'ACTIVE', pageNum: 1, pageSize: 100 }),
      ]);
      setData(result.records || []);
      setCourses(courseList.records || []);
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
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await classApi.delete(id);
    message.success('删除成功');
    loadData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
    };
    if (editing) {
      await classApi.update(editing.id, payload);
      message.success('更新成功');
    } else {
      await classApi.create(payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    loadData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '班级名称', dataIndex: 'className', width: 200 },
    {
      title: '课程',
      dataIndex: 'courseId',
      width: 160,
      render: (v: number) => courses.find((c) => c.id === v)?.title || `#${v}`,
    },
    {
      title: '招生/容量',
      width: 120,
      render: (_: any, r: any) => `${r.enrolledCount || 0} / ${r.capacity || 0}`,
    },
    { title: '讲师', dataIndex: 'teacherName', width: 100 },
    { title: '助教', dataIndex: 'assistantName', width: 100 },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      width: 120,
      render: (v: string) => v && dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      width: 120,
      render: (v: string) => v && dayjs(v).format('YYYY-MM-DD'),
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
      <Title level={3}>班级配置</Title>

      <SearchFilter
        keywordPlaceholder="搜索班级名称"
        statusOptions={[
          { label: '待开课', value: 'PENDING' },
          { label: '进行中', value: 'RUNNING' },
          { label: '已结束', value: 'ENDED' },
        ]}
        onSearch={handleSearch}
      />

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建班级
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
        title={editing ? '编辑班级' : '新建班级'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="courseId" label="关联课程" rules={[{ required: true }]}>
            <Select options={courses.map((c) => ({ label: c.title, value: c.id }))} />
          </Form.Item>
          <Form.Item name="className" label="班级名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="startDate" label="开始日期">
              <DatePicker />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期">
              <DatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="capacity" label="容量" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="enrolledCount" label="已报名人数">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="teacherName" label="讲师">
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="assistantName" label="助教">
              <Input style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '待开课', value: 'PENDING' },
                { label: '进行中', value: 'RUNNING' },
                { label: '已结束', value: 'ENDED' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <OperationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        bizType="CLASS"
        bizId={selectedItem?.id}
        title={`${selectedItem?.className} (#${selectedItem?.id})`}
      />
    </div>
  );
};

export default ClassManagement;
