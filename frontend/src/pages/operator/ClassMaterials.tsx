import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Modal, Form, Input, InputNumber, Select, Upload, message, Popconfirm } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { materialApi, classApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import dayjs from 'dayjs';

const { Title } = Typography;

const ClassMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadClasses = async () => {
    const result = await classApi.list({ pageNum: 1, pageSize: 100 });
    setClasses(result.records || []);
  };

  const loadMaterials = async (classId: number) => {
    setLoading(true);
    try {
      const result = await materialApi.list(classId);
      setMaterials(result || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleSearch = (values: SearchFilterValues) => {
    loadClasses();
  };

  const handleClassChange = (classId: number) => {
    setSelectedClass(classId);
    loadMaterials(classId);
  };

  const handleAdd = () => {
    if (!selectedClass) {
      message.warning('请先选择班级');
      return;
    }
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await materialApi.create({ ...values, classId: selectedClass });
    message.success('上传成功');
    setModalOpen(false);
    if (selectedClass) loadMaterials(selectedClass);
  };

  const handleDelete = async (id: number) => {
    await materialApi.delete(id);
    message.success('删除成功');
    if (selectedClass) loadMaterials(selectedClass);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '资料标题', dataIndex: 'title', width: 200 },
    { title: '文件名', dataIndex: 'fileName', width: 200 },
    {
      title: '大小',
      dataIndex: 'fileSize',
      width: 100,
      render: (v: number) => (v ? `${(v / 1024).toFixed(2)} KB` : '-'),
    },
    { title: '类型', dataIndex: 'fileType', width: 120 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    { title: '描述', dataIndex: 'description' },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" type="link" href={record.fileUrl} target="_blank">
            下载
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
      <Title level={3}>营期资料</Title>

      <SearchFilter
        keywordPlaceholder="搜索班级"
        showStatus={false}
        onSearch={handleSearch}
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择班级"
          style={{ width: 300 }}
          value={selectedClass}
          onChange={handleClassChange}
          options={classes.map((c) => ({ label: c.className, value: c.id }))}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          上传资料
        </Button>
      </Space>

      <Table
        loading={loading}
        columns={columns}
        dataSource={materials}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="上传营期资料"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="资料标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fileName" label="文件名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fileUrl" label="文件链接" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fileType" label="文件类型">
            <Input placeholder="如: pdf, docx, video" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassMaterials;
