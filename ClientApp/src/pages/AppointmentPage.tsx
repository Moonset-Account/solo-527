import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Modal,
  Tag,
  Space,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  appointmentApi,
  serviceItemApi,
  counselorApi,
  userApi,
} from '../services/api';
import type {
  AppointmentDto,
  ServiceItemDto,
  CounselorDto,
  UserDto,
  AppointmentStatus,
} from '../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusMap: Record<AppointmentStatus, { text: string; color: string }> = {
  0: { text: '待确认', color: 'orange' },
  1: { text: '已确认', color: 'blue' },
  2: { text: '已到店', color: 'green' },
  3: { text: '已爽约', color: 'red' },
  4: { text: '已取消', color: 'default' },
  5: { text: '已完成', color: 'purple' },
};

function AppointmentPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [services, setServices] = useState<ServiceItemDto[]>([]);
  const [counselors, setCounselors] = useState<CounselorDto[]>([]);
  const [clients, setClients] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [form] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    checkedIn: 0,
    pending: 0,
  });

  useEffect(() => {
    loadServices();
    loadCounselors();
    loadClients();
    loadAppointments();
  }, []);

  const loadServices = async () => {
    try {
      const res = await serviceItemApi.getActive();
      if (res.success) {
        setServices(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载服务项目失败');
    }
  };

  const loadCounselors = async () => {
    try {
      const res = await counselorApi.getAll();
      if (res.success) {
        setCounselors(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载咨询师失败');
    }
  };

  const loadClients = async () => {
    try {
      const res = await userApi.getByRole(0);
      if (res.success) {
        setClients(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载来访者失败');
    }
  };

  const loadAppointments = async (params?: any) => {
    setLoading(true);
    try {
      const res = await appointmentApi.getList({
        pageIndex: 1,
        pageSize: 50,
        ...params,
      });
      if (res.success) {
        const list = res.data?.items || [];
        setAppointments(list);
        const today = list.filter((a: AppointmentDto) =>
          dayjs(a.appointmentDate).isSame(dayjs(), 'day')
        );
        setStats({
          total: res.data?.totalCount || 0,
          today: today.length,
          checkedIn: today.filter((a: AppointmentDto) => a.status === 2 || a.status === 5).length,
          pending: list.filter((a: AppointmentDto) => a.status === 1).length,
        });
      }
    } catch (e: any) {
      message.error(e.message || '加载预约列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const params: any = {};
    if (values.status !== undefined) params.status = values.status;
    if (values.serviceItemId) params.serviceItemId = values.serviceItemId;
    if (values.dateRange?.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.keyword) params.keyword = values.keyword;
    loadAppointments(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    loadAppointments();
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        clientId: values.clientId,
        counselorId: values.counselorId,
        serviceItemId: values.serviceItemId,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm:ss'),
        reason: values.reason,
      };

      const res = await appointmentApi.create(data);
      if (res.success) {
        message.success(res.message || '预约成功');
        setModalVisible(false);
        loadAppointments();
      } else {
        message.error(res.message || '预约失败');
      }
    } catch (e: any) {
      message.error(e.message || '预约失败，请检查填写信息');
    }
  };

  const handleCancelClick = (record: AppointmentDto) => {
    setSelectedAppointment(record);
    cancelForm.resetFields();
    setCancelModalVisible(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      const values = cancelForm.getFieldsValue();
      const res = await appointmentApi.cancel(selectedAppointment.id, values.reason);
      if (res.success) {
        message.success(res.message || '取消成功');
        setCancelModalVisible(false);
        setSelectedAppointment(null);
        loadAppointments();
      } else {
        message.error(res.message || '取消失败');
      }
    } catch (e: any) {
      message.error(e.message || '取消失败');
    }
  };

  const columns: ColumnsType<AppointmentDto> = [
    {
      title: '预约号',
      dataIndex: 'appointmentNo',
      key: 'appointmentNo',
      width: 160,
    },
    {
      title: '来访者',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'clientPhone',
      key: 'clientPhone',
      width: 120,
    },
    {
      title: '服务项目',
      dataIndex: 'serviceItemName',
      key: 'serviceItemName',
      width: 140,
    },
    {
      title: '咨询师',
      dataIndex: 'counselorName',
      key: 'counselorName',
      width: 100,
    },
    {
      title: '预约日期',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      width: 110,
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '时间',
      key: 'time',
      width: 120,
      render: (_, r) => `${r.startTime?.slice(0, 5)} - ${r.endTime?.slice(0, 5)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AppointmentStatus) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 1 && (
            <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleCancelClick(record)}>
              取消
            </Button>
          )}
          <Button type="link" size="small">详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <h2 className="page-title">预约管理</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总预约数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日预约" value={stats.today} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日到店" value={stats.checkedIn} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待确认" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部状态"
              style={{ width: 140 }}
              allowClear
              options={[
                { value: 1, label: '已确认' },
                { value: 2, label: '已到店' },
                { value: 3, label: '已爽约' },
                { value: 4, label: '已取消' },
                { value: 5, label: '已完成' },
              ]}
            />
          </Form.Item>
          <Form.Item name="serviceItemId" label="服务项目">
            <Select
              placeholder="全部项目"
              style={{ width: 160 }}
              allowClear
              options={services.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="预约列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建预约
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={appointments}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="新建预约"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确认预约"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientId"
                label="来访者"
                rules={[{ required: true, message: '请选择来访者' }]}
              >
                <Select
                  placeholder="请选择来访者"
                  showSearch
                  optionFilterProp="label"
                  options={clients.map((c) => ({
                    value: c.id,
                    label: `${c.fullName} (${c.phone})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serviceItemId"
                label="服务项目"
                rules={[{ required: true, message: '请选择服务项目' }]}
              >
                <Select
                  placeholder="请选择服务项目"
                  options={services.map((s) => ({
                    value: s.id,
                    label: `${s.name} - ¥${s.price}/${s.durationMinutes}分钟`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="counselorId"
                label="咨询师"
                rules={[{ required: true, message: '请选择咨询师' }]}
              >
                <Select
                  placeholder="请选择咨询师"
                  options={counselors.map((c) => ({
                    value: c.id,
                    label: `${c.fullName} - ${c.title}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="appointmentDate"
                label="预约日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              >
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="reason"
            label="咨询原因"
            rules={[{ required: true, message: '请填写咨询原因' }]}
          >
            <TextArea rows={4} placeholder="请简要描述咨询原因，帮助咨询师提前了解" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取消预约"
        open={cancelModalVisible}
        onOk={handleCancelAppointment}
        onCancel={() => setCancelModalVisible(false)}
        okText="确认取消"
        okButtonProps={{ danger: true }}
        cancelText="返回"
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          您确定要取消预约号 <strong>{selectedAppointment?.appointmentNo}</strong> 的预约吗？
        </p>
        <Form form={cancelForm}>
          <Form.Item name="reason" label="取消原因">
            <TextArea rows={3} placeholder="请填写取消原因（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AppointmentPage;
