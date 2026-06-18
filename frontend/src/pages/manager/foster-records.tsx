import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  DatePicker,
  Input,
  Select,
  Tag,
  message,
  Spin,
  Row,
  Col,
  Popconfirm,
  Card,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import {
  FosterRecord,
  FosterStatus,
  Pet,
  User,
  PageResult,
} from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface FosterRecordFormData {
  petId: string;
  volunteerId: string;
  startDate: Dayjs;
  endDate?: Dayjs;
  status: FosterStatus;
  volunteerHome?: string;
  dailyChecklist?: string;
  emergencyContact?: string;
  notes?: string;
}

const statusMap: Record<FosterStatus, { text: string; color: string }> = {
  [FosterStatus.PENDING]: { text: '待审核', color: 'default' },
  [FosterStatus.ACTIVE]: { text: '进行中', color: 'processing' },
  [FosterStatus.COMPLETED]: { text: '已完成', color: 'success' },
  [FosterStatus.EXTENDED]: { text: '已延期', color: 'warning' },
  [FosterStatus.CANCELLED]: { text: '已取消', color: 'default' },
};

const FosterRecordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FosterRecord[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FosterRecord | null>(null);
  const [form] = Form.useForm<FosterRecordFormData>();

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    volunteerTop5: [] as { volunteerName: string; count: number }[],
  });

  const [filters, setFilters] = useState({
    dateRange: null as [Dayjs, Dayjs] | null,
    status: undefined as FosterStatus | undefined,
    volunteerId: undefined as string | undefined,
  });

  useEffect(() => {
    fetchData();
    fetchPetsAndVolunteers();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    calculateStats();
  }, [data, volunteers]);

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
      if (filters.status) params.status = filters.status;
      if (filters.volunteerId) params.volunteerId = filters.volunteerId;

      const result: PageResult<FosterRecord> = await request.get('/foster-records', { params });
      setData(result.data || []);
      setPagination((prev) => ({ ...prev, total: result.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch foster records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetsAndVolunteers = async () => {
    try {
      const [petsResult, usersResult] = await Promise.all([
        request.get<PageResult<Pet>>('/pets'),
        request.get<PageResult<User>>('/users'),
      ]);
      setPets(petsResult.data || []);
      setVolunteers(usersResult.data || []);
    } catch (error) {
      console.error('Failed to fetch pets and volunteers:', error);
    }
  };

  const calculateStats = () => {
    const total = data.length;
    const active = data.filter((item) => item.status === FosterStatus.ACTIVE).length;
    const completed = data.filter((item) => item.status === FosterStatus.COMPLETED).length;

    const volunteerCount: Record<string, number> = {};
    data.forEach((item) => {
      const name = volunteers.find((v) => v.id === item.volunteerId)?.username || '未知志愿者';
      volunteerCount[name] = (volunteerCount[name] || 0) + 1;
    });

    const volunteerTop5 = Object.entries(volunteerCount)
      .map(([volunteerName, count]) => ({ volunteerName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({ total, active, completed, volunteerTop5 });
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({ dateRange: null, status: undefined, volunteerId: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: FosterRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      petId: record.petId,
      volunteerId: record.volunteerId,
      startDate: dayjs(record.startDate),
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
      status: record.status,
      volunteerHome: record.volunteerHome,
      dailyChecklist: record.dailyChecklist,
      emergencyContact: record.emergencyContact,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/foster-records/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete foster record:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Record<string, any> = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
      };
      if (values.endDate) {
        payload.endDate = values.endDate.format('YYYY-MM-DD');
      }

      if (editingRecord) {
        await request.put(`/foster-records/${editingRecord.id}`, payload);
        message.success('编辑成功');
      } else {
        await request.post('/foster-records', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit foster record:', error);
    }
  };

  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name || '-';
  const getVolunteerName = (volunteerId: string) => volunteers.find((u) => u.id === volunteerId)?.username || '-';

  const columns: ColumnsType<FosterRecord> = [
    {
      title: '宠物名',
      key: 'petName',
      width: 100,
      render: (_: any, record: FosterRecord) => record.pet?.name || getPetName(record.petId),
    },
    {
      title: '志愿者',
      key: 'volunteerName',
      width: 100,
      render: (_: any, record: FosterRecord) => record.volunteer?.username || getVolunteerName(record.volunteerId),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: FosterStatus) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '寄养家庭',
      dataIndex: 'volunteerHome',
      key: 'volunteerHome',
      ellipsis: true,
    },
    {
      title: '紧急联系人',
      dataIndex: 'emergencyContact',
      key: 'emergencyContact',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: FosterRecord) => (
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
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="寄养总数"
                value={stats.total}
                prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="进行中"
                value={stats.active}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card title="志愿者寄养Top5">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {stats.volunteerTop5.length > 0 ? (
                  stats.volunteerTop5.map((item, index) => (
                    <Space key={index} style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <TrophyOutlined style={{ color: index < 3 ? '#faad14' : '#8c8c8c' }} />
                        <span>{item.volunteerName}</span>
                      </Space>
                      <Tag color="blue">{item.count}次</Tag>
                    </Space>
                  ))
                ) : (
                  <span style={{ color: '#8c8c8c' }}>暂无数据</span>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange as any}
              onChange={(dates) =>
                setFilters((prev) => ({ ...prev, dateRange: dates as [Dayjs, Dayjs] | null }))
              }
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              options={Object.entries(statusMap).map(([key, val]) => ({ label: val.text, value: key }))}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择志愿者"
              allowClear
              style={{ width: '100%' }}
              value={filters.volunteerId}
              onChange={(value) => setFilters((prev) => ({ ...prev, volunteerId: value }))}
              options={volunteers.map((u) => ({ label: u.username, value: u.id }))}
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
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          scroll={{ x: 1000 }}
        />
      </Space>

      <Modal
        title={editingRecord ? '编辑寄养记录' : '新建寄养记录'}
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
              <Form.Item
                name="volunteerId"
                label="志愿者"
                rules={[{ required: true, message: '请选择志愿者' }]}
              >
                <Select
                  placeholder="请选择志愿者"
                  options={volunteers.map((u) => ({ label: u.username, value: u.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                initialValue={FosterStatus.ACTIVE}
              >
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(statusMap).map(([key, val]) => ({ label: val.text, value: key }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="emergencyContact" label="紧急联系人">
                <Input placeholder="请输入紧急联系人及电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="volunteerHome" label="寄养家庭地址">
            <Input placeholder="请输入寄养家庭地址" />
          </Form.Item>
          <Form.Item name="dailyChecklist" label="日常检查清单">
            <TextArea rows={3} placeholder="请输入日常检查清单" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default FosterRecordsPage;
