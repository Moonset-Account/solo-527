import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  DatePicker,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import { TrainingRecord, ApiResponse, Pet, User, PaginatedResponse } from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface TrainingRecordFormData {
  petId: string;
  trainerId: string;
  trainingDate: Dayjs;
  trainingType: string;
  duration: number;
  content: string;
  progress: string;
  notes: string;
}

const TrainingRecordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);
  const [form] = Form.useForm<TrainingRecordFormData>();

  const [filters, setFilters] = useState({
    dateRange: null as [Dayjs, Dayjs] | null,
    petId: undefined as string | undefined,
    trainerId: undefined as string | undefined,
  });

  useEffect(() => {
    fetchData();
    fetchPetsAndTrainers();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      if (filters.petId) params.petId = filters.petId;
      if (filters.trainerId) params.trainerId = filters.trainerId;

      const res = await request.get<any, ApiResponse<PaginatedResponse<TrainingRecord>>>('/training-records', { params });
      setData(res.data?.list || []);
      setPagination((prev) => ({ ...prev, total: res.data?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch training records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetsAndTrainers = async () => {
    try {
      const [petsRes, usersRes] = await Promise.all([
        request.get<any, ApiResponse<Pet[]>>('/pets'),
        request.get<any, ApiResponse<User[]>>('/users'),
      ]);
      setPets(petsRes.data || []);
      setTrainers(usersRes.data?.filter((u) => u.role === 'manager' || u.role === 'admin') || []);
    } catch (error) {
      console.error('Failed to fetch pets and trainers:', error);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({ dateRange: null, petId: undefined, trainerId: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: TrainingRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      petId: record.petId,
      trainerId: record.trainerId,
      trainingDate: dayjs(record.trainingDate),
      trainingType: record.trainingType,
      duration: record.duration,
      content: record.content,
      progress: record.progress,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/training-records/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete training record:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        trainingDate: values.trainingDate.format('YYYY-MM-DD'),
      };

      if (editingRecord) {
        await request.put(`/training-records/${editingRecord.id}`, payload);
        message.success('编辑成功');
      } else {
        await request.post('/training-records', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit training record:', error);
    }
  };

  const columns: ColumnsType<TrainingRecord> = [
    {
      title: '训练日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.trainingDate).unix() - dayjs(b.trainingDate).unix(),
    },
    {
      title: '宠物名',
      dataIndex: ['pet', 'name'],
      key: 'petName',
      width: 100,
      render: (_: any, record: TrainingRecord) => record.pet?.name || pets.find((p) => p.id === record.petId)?.name || '-',
    },
    {
      title: '训练师',
      dataIndex: ['trainer', 'username'],
      key: 'trainerName',
      width: 100,
      render: (_: any, record: TrainingRecord) =>
        record.trainer?.username || trainers.find((u) => u.id === record.trainerId)?.username || '-',
    },
    {
      title: '训练类型',
      dataIndex: 'trainingType',
      key: 'trainingType',
      width: 120,
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center',
    },
    {
      title: '训练内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: TrainingRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除这条记录吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange as any}
              onChange={(dates) => setFilters((prev) => ({ ...prev, dateRange: dates as [Dayjs, Dayjs] | null }))}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择宠物"
              allowClear
              style={{ width: '100%' }}
              value={filters.petId}
              onChange={(value) => setFilters((prev) => ({ ...prev, petId: value }))}
              options={pets.map((pet) => ({ label: pet.name, value: pet.id }))}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择训练师"
              allowClear
              style={{ width: '100%' }}
              value={filters.trainerId}
              onChange={(value) => setFilters((prev) => ({ ...prev, trainerId: value }))}
              options={trainers.map((u) => ({ label: u.username, value: u.id }))}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建记录
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          scroll={{ x: 1000 }}
        />
      </Space>

      <Modal
        title={editingRecord ? '编辑训练记录' : '新建训练记录'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="petId"
                label="宠物"
                rules={[{ required: true, message: '请选择宠物' }]}
              >
                <Select placeholder="请选择宠物" options={pets.map((pet) => ({ label: pet.name, value: pet.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trainerId"
                label="训练师"
                rules={[{ required: true, message: '请选择训练师' }]}
              >
                <Select
                  placeholder="请选择训练师"
                  options={trainers.map((u) => ({ label: u.username, value: u.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trainingDate"
                label="训练日期"
                rules={[{ required: true, message: '请选择训练日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trainingType"
                label="训练类型"
                rules={[{ required: true, message: '请输入训练类型' }]}
              >
                <Input placeholder="例如：基础服从、行为纠正、敏捷训练等" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="时长(分钟)"
                rules={[{ required: true, message: '请输入训练时长' }]}
              >
                <InputNumber min={1} max={480} style={{ width: '100%' }} placeholder="请输入训练时长" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="progress"
                label="训练进度"
                rules={[{ required: true, message: '请输入训练进度' }]}
              >
                <Input placeholder="例如：已完成30%、进行中等" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="训练内容">
            <TextArea rows={3} placeholder="请输入训练内容详情" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default TrainingRecordsPage;
