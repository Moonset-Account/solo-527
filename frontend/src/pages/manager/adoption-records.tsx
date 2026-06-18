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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import {
  AdoptionRecord,
  AdoptionStatus,
  ApiResponse,
  Pet,
  User,
  PaginatedResponse,
} from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface AdoptionRecordFormData {
  petId: string;
  adopterId: string;
  applicationDate: Dayjs;
  adoptionDate?: Dayjs;
  adopterAddress?: string;
  adopterExperience?: string;
  homeEnvironment?: string;
  notes?: string;
}

const statusMap: Record<AdoptionStatus, { text: string; color: string }> = {
  [AdoptionStatus.PENDING]: { text: '待审批', color: 'warning' },
  [AdoptionStatus.APPROVED]: { text: '已通过', color: 'processing' },
  [AdoptionStatus.REJECTED]: { text: '已拒绝', color: 'error' },
  [AdoptionStatus.COMPLETED]: { text: '已完成', color: 'success' },
  [AdoptionStatus.RETURNED]: { text: '已退回', color: 'default' },
  [AdoptionStatus.CANCELLED]: { text: '已取消', color: 'default' },
};

const AdoptionRecordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdoptionRecord[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdoptionRecord | null>(null);
  const [rejectingRecord, setRejectingRecord] = useState<AdoptionRecord | null>(null);
  const [form] = Form.useForm<AdoptionRecordFormData>();
  const [rejectForm] = Form.useForm<{ rejectionReason: string }>();

  const [filters, setFilters] = useState({
    dateRange: null as [Dayjs, Dayjs] | null,
    status: undefined as AdoptionStatus | undefined,
    approverId: undefined as string | undefined,
  });

  useEffect(() => {
    fetchData();
    fetchPetsAndUsers();
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
      if (filters.status) params.status = filters.status;
      if (filters.approverId) params.approverId = filters.approverId;

      const res = await request.get<any, ApiResponse<PaginatedResponse<AdoptionRecord>>>('/adoption-records', { params });
      setData(res.data?.list || []);
      setPagination((prev) => ({ ...prev, total: res.data?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch adoption records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetsAndUsers = async () => {
    try {
      const [petsRes, usersRes] = await Promise.all([
        request.get<any, ApiResponse<Pet[]>>('/pets'),
        request.get<any, ApiResponse<User[]>>('/users'),
      ]);
      setPets(petsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch pets and users:', error);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({ dateRange: null, status: undefined, approverId: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: AdoptionRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      petId: record.petId,
      adopterId: record.adopterId,
      applicationDate: dayjs(record.applicationDate),
      adoptionDate: record.adoptionDate ? dayjs(record.adoptionDate) : undefined,
      adopterAddress: record.adopterAddress,
      adopterExperience: record.adopterExperience,
      homeEnvironment: record.homeEnvironment,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/adoption-records/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete adoption record:', error);
    }
  };

  const handleApprove = async (record: AdoptionRecord) => {
    try {
      await request.post(`/adoption-records/${record.id}/approve`);
      message.success('审批通过');
      fetchData();
    } catch (error) {
      console.error('Failed to approve adoption record:', error);
    }
  };

  const handleReject = (record: AdoptionRecord) => {
    setRejectingRecord(record);
    rejectForm.resetFields();
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (rejectingRecord) {
        await request.post(`/adoption-records/${rejectingRecord.id}/reject`, values);
        message.success('已拒绝');
        setIsRejectModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reject adoption record:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: Record<string, any> = {
        ...values,
        applicationDate: values.applicationDate.format('YYYY-MM-DD'),
      };
      if (values.adoptionDate) {
        payload.adoptionDate = values.adoptionDate.format('YYYY-MM-DD');
      }

      if (editingRecord) {
        await request.put(`/adoption-records/${editingRecord.id}`, payload);
        message.success('编辑成功');
      } else {
        await request.post('/adoption-records', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit adoption record:', error);
    }
  };

  const getUserName = (userId?: string) => users.find((u) => u.id === userId)?.username || '-';
  const getPetName = (petId: string) => pets.find((p) => p.id === petId)?.name || '-';

  const columns: ColumnsType<AdoptionRecord> = [
    {
      title: '申请日期',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.applicationDate).unix() - dayjs(b.applicationDate).unix(),
    },
    {
      title: '宠物名',
      key: 'petName',
      width: 100,
      render: (_: any, record: AdoptionRecord) => record.pet?.name || getPetName(record.petId),
    },
    {
      title: '领养人',
      key: 'adopterName',
      width: 100,
      render: (_: any, record: AdoptionRecord) => record.adopter?.username || getUserName(record.adopterId),
    },
    {
      title: '审批人',
      key: 'approverName',
      width: 100,
      render: (_: any, record: AdoptionRecord) => record.approver?.username || getUserName(record.approverId),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AdoptionStatus) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '领养日期',
      dataIndex: 'adoptionDate',
      key: 'adoptionDate',
      width: 120,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: AdoptionRecord) => (
        <Space size="small">
          {record.status === AdoptionStatus.PENDING && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
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

  const managerUsers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

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
              placeholder="选择审批人"
              allowClear
              style={{ width: '100%' }}
              value={filters.approverId}
              onChange={(value) => setFilters((prev) => ({ ...prev, approverId: value }))}
              options={managerUsers.map((u) => ({ label: u.username, value: u.id }))}
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
        title={editingRecord ? '编辑领养资料' : '新建领养资料'}
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
                name="adopterId"
                label="领养人"
                rules={[{ required: true, message: '请选择领养人' }]}
              >
                <Select
                  placeholder="请选择领养人"
                  showSearch
                  optionFilterProp="label"
                  options={users.map((u) => ({ label: u.username, value: u.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="applicationDate"
                label="申请日期"
                rules={[{ required: true, message: '请选择申请日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="adoptionDate" label="领养日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="adopterAddress" label="领养人地址">
            <Input placeholder="请输入领养人地址" />
          </Form.Item>
          <Form.Item name="adopterExperience" label="养宠经验">
            <TextArea rows={2} placeholder="请描述养宠经验" />
          </Form.Item>
          <Form.Item name="homeEnvironment" label="家庭环境">
            <TextArea rows={2} placeholder="请描述家庭环境" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝领养申请"
        open={isRejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => setIsRejectModalOpen(false)}
        okButtonProps={{ danger: true }}
        okText="确认拒绝"
        width={500}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="rejectionReason"
            label="拒绝原因"
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default AdoptionRecordsPage;
