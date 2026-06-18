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
  Tag,
  message,
  Spin,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import {
  HealthRecord,
  HealthRecordType,
  ApiResponse,
  Pet,
  User,
  PaginatedResponse,
} from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface HealthRecordFormData {
  petId: string;
  veterinarianId?: string;
  recordDate: Dayjs;
  type: HealthRecordType;
  title: string;
  description?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  weight?: number;
  temperature?: number;
  nextVisitDate?: Dayjs;
  notes?: string;
}

const typeMap: Record<HealthRecordType, { text: string; color: string }> = {
  [HealthRecordType.VACCINATION]: { text: '疫苗接种', color: 'blue' },
  [HealthRecordType.DEWORMING]: { text: '驱虫', color: 'cyan' },
  [HealthRecordType.CHECKUP]: { text: '体检', color: 'green' },
  [HealthRecordType.TREATMENT]: { text: '治疗', color: 'orange' },
  [HealthRecordType.SURGERY]: { text: '手术', color: 'red' },
  [HealthRecordType.WEIGHT]: { text: '体重记录', color: 'purple' },
  [HealthRecordType.OTHER]: { text: '其他', color: 'default' },
};

const HealthRecordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthRecord[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [form] = Form.useForm<HealthRecordFormData>();

  const [filters, setFilters] = useState({
    dateRange: null as [Dayjs, Dayjs] | null,
    type: undefined as HealthRecordType | undefined,
    petId: undefined as string | undefined,
    veterinarianId: undefined as string | undefined,
  });

  useEffect(() => {
    fetchData();
    fetchPetsAndVets();
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
      if (filters.type) params.type = filters.type;
      if (filters.petId) params.petId = filters.petId;
      if (filters.veterinarianId) params.veterinarianId = filters.veterinarianId;

      const res = await request.get<any, ApiResponse<PaginatedResponse<HealthRecord>>>('/health-records', { params });
      setData(res.data?.list || []);
      setPagination((prev) => ({ ...prev, total: res.data?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetsAndVets = async () => {
    try {
      const [petsRes, usersRes] = await Promise.all([
        request.get<any, ApiResponse<Pet[]>>('/pets'),
        request.get<any, ApiResponse<User[]>>('/users'),
      ]);
      setPets(petsRes.data || []);
      setVeterinarians(usersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch pets and veterinarians:', error);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({ dateRange: null, type: undefined, petId: undefined, veterinarianId: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      petId: record.petId,
      veterinarianId: record.veterinarianId,
      recordDate: dayjs(record.recordDate),
      type: record.type,
      title: record.title,
      description: record.description,
      symptoms: record.symptoms,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      medication: record.medication,
      weight: record.weight,
      temperature: record.temperature,
      nextVisitDate: record.nextVisitDate ? dayjs(record.nextVisitDate) : undefined,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/health-records/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete health record:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Record<string, any> = {
        ...values,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
      };
      if (values.nextVisitDate) {
        payload.nextVisitDate = values.nextVisitDate.format('YYYY-MM-DD');
      }

      if (editingRecord) {
        await request.put(`/health-records/${editingRecord.id}`, payload);
        message.success('编辑成功');
      } else {
        await request.post('/health-records', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit health record:', error);
    }
  };

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name || '-';
  const getVetName = (vetId?: string) => veterinarians.find((u) => u.id === vetId)?.username || '-';

  const columns: ColumnsType<HealthRecord> = [
    {
      title: '记录日期',
      dataIndex: 'recordDate',
      key: 'recordDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.recordDate).unix() - dayjs(b.recordDate).unix(),
    },
    {
      title: '宠物名',
      key: 'petName',
      width: 100,
      render: (_: any, record: HealthRecord) => record.pet?.name || getPetName(record.petId),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: HealthRecordType) => {
        const info = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true,
    },
    {
      title: '兽医',
      key: 'veterinarianName',
      width: 100,
      render: (_: any, record: HealthRecord) => record.veterinarian?.username || getVetName(record.veterinarianId),
    },
    {
      title: '体重(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'center',
      render: (val?: number) => (val !== undefined && val !== null ? val.toFixed(2) : '-'),
    },
    {
      title: '体温(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      align: 'center',
      render: (val?: number) => (val !== undefined && val !== null ? val.toFixed(1) : '-'),
    },
    {
      title: '诊断',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: HealthRecord) => (
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
          <Col span={4}>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
              options={Object.entries(typeMap).map(([key, val]) => ({ label: val.text, value: key }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择宠物"
              allowClear
              style={{ width: '100%' }}
              value={filters.petId}
              onChange={(value) => setFilters((prev) => ({ ...prev, petId: value }))}
              options={pets.map((pet) => ({ label: pet.name, value: pet.id }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择兽医"
              allowClear
              style={{ width: '100%' }}
              value={filters.veterinarianId}
              onChange={(value) => setFilters((prev) => ({ ...prev, veterinarianId: value }))}
              options={veterinarians.map((u) => ({ label: u.username, value: u.id }))}
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
          scroll={{ x: 1100 }}
        />
      </Space>

      <Modal
        title={editingRecord ? '编辑健康记录' : '新建健康记录'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
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
              <Form.Item name="veterinarianId" label="兽医">
                <Select
                  placeholder="请选择兽医"
                  allowClear
                  options={veterinarians.map((u) => ({ label: u.username, value: u.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="recordDate"
                label="记录日期"
                rules={[{ required: true, message: '请选择记录日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="记录类型"
                rules={[{ required: true, message: '请选择记录类型' }]}
              >
                <Select
                  placeholder="请选择记录类型"
                  options={Object.entries(typeMap).map(([key, val]) => ({ label: val.text, value: key }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入记录标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="weight" label="体重(kg)">
                <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} placeholder="请输入体重" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="temperature" label="体温(°C)">
                <InputNumber min={30} max={45} step={0.1} style={{ width: '100%' }} placeholder="请输入体温" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入描述信息" />
          </Form.Item>
          <Form.Item name="symptoms" label="症状">
            <TextArea rows={2} placeholder="请输入症状描述" />
          </Form.Item>
          <Form.Item name="diagnosis" label="诊断">
            <TextArea rows={2} placeholder="请输入诊断结果" />
          </Form.Item>
          <Form.Item name="treatment" label="治疗方案">
            <TextArea rows={2} placeholder="请输入治疗方案" />
          </Form.Item>
          <Form.Item name="medication" label="用药">
            <TextArea rows={2} placeholder="请输入用药信息" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nextVisitDate" label="下次复诊日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default HealthRecordsPage;
