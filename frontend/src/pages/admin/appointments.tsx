import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusLabels,
  AppointmentStatusColors,
  Service,
  Pet,
  User,
  UserRole,
  PageResult,
} from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface QueryParams {
  page?: number;
  pageSize?: number;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  staffId?: string;
}

const AppointmentsPage = () => {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [queryParams, setQueryParams] = useState<QueryParams>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [staffs, setStaffs] = useState<User[]>([]);

  const fetchData = async (params?: QueryParams) => {
    setLoading(true);
    try {
      const mergedParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...queryParams,
        ...params,
      };
      const res = await request.get<any, PageResult<Appointment>>('/appointments', {
        params: mergedParams,
      });
      const result = res as unknown as PageResult<Appointment>;
      setData(result.data || []);
      setPagination({
        current: result.page || 1,
        pageSize: result.pageSize || 10,
        total: result.total || 0,
      });
    } catch (error) {
      console.error('获取预约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [servicesRes, petsRes, usersRes] = await Promise.all([
        request.get<any, Service[]>('/services/active/list'),
        request.get<any, Pet[]>('/pets'),
        request.get<any, User[]>('/users'),
      ]);
      setServices((servicesRes as unknown as { data?: Service[] }).data || (servicesRes as unknown as Service[]) || []);
      setPets((petsRes as unknown as { data?: Pet[] }).data || (petsRes as unknown as Pet[]) || []);
      const usersData = (usersRes as unknown as { data?: User[] }).data || (usersRes as unknown as User[]) || [];
      setCustomers(usersData.filter((u) => u.role === UserRole.CUSTOMER));
      setStaffs(usersData.filter((u) => u.role === UserRole.STAFF || u.role === UserRole.ADMIN || u.role === UserRole.MANAGER));
    } catch (error) {
      console.error('获取选项数据失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ page: 1, ...queryParams });
  };

  const handleReset = () => {
    setQueryParams({});
    setPagination({ current: 1, pageSize: 10, total: 0 });
    fetchData({ page: 1 });
  };

  const handleStatusChange = async (record: Appointment, status: AppointmentStatus) => {
    try {
      await request.put(`/appointments/${record.id}/status`, { status });
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString(),
      };
      await request.post('/appointments', payload);
      message.success('创建预约成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('创建预约失败:', error);
    }
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: '预约时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (_, record) => (
        <span>
          {dayjs(record.startTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(record.endTime).format('HH:mm')}
        </span>
      ),
      sorter: (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
    },
    {
      title: '宠物名',
      dataIndex: ['pet', 'name'],
      key: 'petName',
      render: (_, record) => record.pet?.name || '-',
    },
    {
      title: '顾客',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      render: (_, record) => record.customer?.name || record.customer?.username || '-',
    },
    {
      title: '服务',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
      render: (_, record) => record.service?.name || '-',
    },
    {
      title: '负责人(洗护师)',
      dataIndex: ['staff', 'name'],
      key: 'staffName',
      render: (_, record) => record.staff?.name || '-',
    },
    {
      title: '价格',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value) => `¥${value}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AppointmentStatus) => (
        <Tag color={AppointmentStatusColors[status]}>
          {AppointmentStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          {record.status === AppointmentStatus.PENDING && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record, AppointmentStatus.CONFIRMED)}>
              确认
            </Button>
          )}
          {record.status === AppointmentStatus.CONFIRMED && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record, AppointmentStatus.IN_PROGRESS)}>
              开始服务
            </Button>
          )}
          {(record.status === AppointmentStatus.IN_PROGRESS) && (
            <Button type="link" size="small" onClick={() => handleStatusChange(record, AppointmentStatus.COMPLETED)}>
              完成
            </Button>
          )}
          {(record.status === AppointmentStatus.PENDING || record.status === AppointmentStatus.CONFIRMED) && (
            <Popconfirm title="确定取消该预约？" onConfirm={() => handleStatusChange(record, AppointmentStatus.CANCELLED)}>
              <Button type="link" size="small" danger>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <RangePicker
          showTime
          placeholder={['开始日期', '结束日期']}
          onChange={(dates: [Dayjs | null, Dayjs | null] | null) =>
            setQueryParams((prev) => ({
              ...prev,
              startDate: dates?.[0]?.toISOString(),
              endDate: dates?.[1]?.toISOString(),
            }))
          }
        />
        <Select
          placeholder="选择状态"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, status: value }))}
        >
          {Object.values(AppointmentStatus).map((status) => (
            <Option key={status} value={status}>
              {AppointmentStatusLabels[status]}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="选择负责人"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setQueryParams((prev) => ({ ...prev, staffId: value }))}
        >
          {staffs.map((staff) => (
            <Option key={staff.id} value={staff.id}>
              {staff.name}
            </Option>
          ))}
        </Select>
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建预约
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
            fetchData({ page, pageSize });
          },
        }}
      />

      <Modal
        title="新建预约"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="petId"
            label="选择宠物"
            rules={[{ required: true, message: '请选择宠物' }]}
          >
            <Select placeholder="请选择宠物">
              {pets.map((pet) => (
                <Option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="customerId"
            label="选择顾客"
            rules={[{ required: true, message: '请选择顾客' }]}
          >
            <Select placeholder="请选择顾客">
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="serviceId"
            label="选择服务"
            rules={[{ required: true, message: '请选择服务' }]}
          >
            <Select placeholder="请选择服务">
              {services.map((service) => (
                <Option key={service.id} value={service.id}>
                  {service.name} - ¥{service.price}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="staffId"
            label="选择洗护师"
          >
            <Select placeholder="请选择洗护师" allowClear>
              {staffs.map((staff) => (
                <Option key={staff.id} value={staff.id}>
                  {staff.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startTime"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="totalPrice"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
