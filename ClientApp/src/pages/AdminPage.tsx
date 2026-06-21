import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  Tag,
  Space,
  message,
  Switch,
  DatePicker,
  TimePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BellOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  serviceItemApi,
  userApi,
  waitlistApi,
  storeClosureApi,
  counselorApi,
} from '../services/api';
import type {
  ServiceItemDto,
  UserDto,
  WaitlistItemDto,
  StoreClosureDto,
  PrivacyLevel,
  ServiceStatus,
  UserRole,
} from '../types';

const { TabPane } = Tabs;
const { TextArea } = Input;

function AdminPage() {
  const [activeKey, setActiveKey] = useState('services');

  return (
    <div className="page-container">
      <h2 className="page-title">后台管理</h2>
      <Tabs activeKey={activeKey} onChange={setActiveKey}>
        <TabPane tab="服务项目" key="services">
          <ServiceItemsTab />
        </TabPane>
        <TabPane tab="用户管理" key="users">
          <UsersTab />
        </TabPane>
        <TabPane tab="候补队列" key="waitlist">
          <WaitlistTab />
        </TabPane>
        <TabPane tab="临时关店" key="closures">
          <StoreClosuresTab />
        </TabPane>
      </Tabs>
    </div>
  );
}

function ServiceItemsTab() {
  const [services, setServices] = useState<ServiceItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItemDto | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await serviceItemApi.getAll();
      if (res.success) {
        setServices(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: ServiceItemDto) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      price: item.price,
      durationMinutes: item.durationMinutes,
      status: item.status,
      privacyLevel: item.privacyLevel,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        const res = await serviceItemApi.update(editingItem.id, values);
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          loadServices();
        }
      } else {
        const res = await serviceItemApi.create(values);
        if (res.success) {
          message.success('创建成功');
          setModalVisible(false);
          loadServices();
        }
      }
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该服务项目吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await serviceItemApi.delete(id);
          if (res.success) {
            message.success('删除成功');
            loadServices();
          }
        } catch (e: any) {
          message.error(e.message || '删除失败');
        }
      },
    });
  };

  const statusMap: Record<ServiceStatus, { text: string; color: string }> = {
    0: { text: '启用', color: 'green' },
    1: { text: '停用', color: 'orange' },
    2: { text: '已下架', color: 'default' },
  };

  const privacyMap: Record<PrivacyLevel, string> = {
    0: '公开',
    1: '内部',
    2: '保密',
    3: '受限',
  };

  const columns: ColumnsType<ServiceItemDto> = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (v) => `¥${v}`,
    },
    {
      title: '时长',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      width: 100,
      render: (v) => `${v}分钟`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: ServiceStatus) => (
        <Tag color={statusMap[s].color}>{statusMap[s].text}</Tag>
      ),
    },
    {
      title: '隐私级别',
      dataIndex: 'privacyLevel',
      key: 'privacyLevel',
      width: 100,
      render: (p: PrivacyLevel) => privacyMap[p],
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增服务
        </Button>
      }
    >
      <Table columns={columns} dataSource={services} rowKey="id" loading={loading} />

      <Modal
        title={editingItem ? '编辑服务项目' : '新增服务项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>
          <Form.Item name="description" label="服务描述">
            <TextArea rows={3} placeholder="请输入服务描述" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="price"
              label="价格（元）"
              rules={[{ required: true, message: '请输入价格' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item
              name="durationMinutes"
              label="时长（分钟）"
              rules={[{ required: true, message: '请输入时长' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={15} step={15} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: 0, label: '启用' },
                  { value: 1, label: '停用' },
                  { value: 2, label: '已下架' },
                ]}
              />
            </Form.Item>
            <Form.Item name="privacyLevel" label="隐私级别" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: 0, label: '公开' },
                  { value: 1, label: '内部' },
                  { value: 2, label: '保密' },
                  { value: 3, label: '受限' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAll();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await userApi.create(values);
      if (res.success) {
        message.success('创建成功');
        setModalVisible(false);
        loadUsers();
      }
    } catch (e: any) {
      message.error(e.message || '创建失败');
    }
  };

  const roleMap: Record<UserRole, string> = {
    0: '来访者',
    1: '咨询师',
    2: '前台',
    3: '经理',
    4: '管理员',
  };

  const columns: ColumnsType<UserDto> = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '姓名', dataIndex: 'fullName', key: 'fullName', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (r: UserRole) => roleMap[r],
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v) => (v ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <Card
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户
        </Button>
      }
    >
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} />

      <Modal
        title="新增用户"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="登录用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
              style={{ flex: 1 }}
            >
              <Input.Password placeholder="登录密码" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="fullName"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="真实姓名" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ required: true, message: '请输入手机号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="联系电话" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="email" label="邮箱" style={{ flex: 1 }}>
              <Input placeholder="电子邮箱（选填）" />
            </Form.Item>
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { value: 0, label: '来访者' },
                  { value: 1, label: '咨询师' },
                  { value: 2, label: '前台' },
                  { value: 3, label: '经理' },
                  { value: 4, label: '管理员' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="privacyLevel"
            label="隐私权限级别"
            rules={[{ required: true, message: '请选择隐私级别' }]}
          >
            <Select
              options={[
                { value: 0, label: '公开 - 只能查看公开信息' },
                { value: 1, label: '内部 - 可查看内部数据' },
                { value: 2, label: '保密 - 可查看保密数据' },
                { value: 3, label: '受限 - 最高权限，可查看所有数据' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

function WaitlistTab() {
  const [items, setItems] = useState<WaitlistItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());

  useEffect(() => {
    loadWaitlist();
  }, [date]);

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const res = await waitlistApi.getByDate(date.format('YYYY-MM-DD'));
      if (res.success) {
        setItems(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (id: number) => {
    try {
      const res = await waitlistApi.markNotified(id);
      if (res.success) {
        message.success('已发送通知');
        loadWaitlist();
      }
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleDeactivate = async (id: number) => {
    Modal.confirm({
      title: '确认失效',
      content: '确定要将该候补记录设置为失效吗？',
      onOk: async () => {
        try {
          const res = await waitlistApi.deactivate(id);
          if (res.success) {
            message.success('已失效');
            loadWaitlist();
          }
        } catch (e: any) {
          message.error(e.message || '操作失败');
        }
      },
    });
  };

  const columns: ColumnsType<WaitlistItemDto> = [
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { title: '来访者', dataIndex: 'clientName', key: 'clientName', width: 100 },
    { title: '电话', dataIndex: 'clientPhone', key: 'clientPhone', width: 120 },
    { title: '服务项目', dataIndex: 'serviceItemName', key: 'serviceItemName', width: 140 },
    { title: '优先咨询师', dataIndex: 'preferredCounselorName', key: 'preferredCounselorName', width: 100 },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, r) => (
        r.isActive ? <Tag color="blue">候补中</Tag> : <Tag color="default">已失效</Tag>
      ),
    },
    {
      title: '是否通知',
      dataIndex: 'notified',
      key: 'notified',
      width: 100,
      render: (v) => (v ? <Tag color="green">已通知</Tag> : <Tag color="orange">未通知</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.isActive && !record.notified && (
            <Button type="link" size="small" icon={<BellOutlined />} onClick={() => handleNotify(record.id)}>
              通知
            </Button>
          )}
          {record.isActive && (
            <Button type="link" size="small" danger onClick={() => handleDeactivate(record.id)}>
              失效
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      extra={
        <DatePicker
          value={date}
          onChange={(d) => d && setDate(d)}
          style={{ width: 180 }}
        />
      }
    >
      <Table columns={columns} dataSource={items} rowKey="id" loading={loading} />
    </Card>
  );
}

function StoreClosuresTab() {
  const [closures, setClosures] = useState<StoreClosureDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadClosures();
  }, []);

  const loadClosures = async () => {
    setLoading(true);
    try {
      const res = await storeClosureApi.getList(
        dayjs().format('YYYY-MM-DD'),
        dayjs().add(30, 'day').format('YYYY-MM-DD')
      );
      if (res.success) {
        setClosures(res.data || []);
      }
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ isFullDay: true });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        closureDate: values.closureDate.format('YYYY-MM-DD'),
        startTime: values.isFullDay ? '00:00:00' : values.startTime?.format('HH:mm:ss'),
        endTime: values.isFullDay ? '23:59:59' : values.endTime?.format('HH:mm:ss'),
      };
      const res = await storeClosureApi.create(data);
      if (res.success) {
        message.success('创建成功');
        setModalVisible(false);
        loadClosures();
      }
    } catch (e: any) {
      message.error(e.message || '创建失败');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该关店记录吗？',
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await storeClosureApi.delete(id);
          if (res.success) {
            message.success('删除成功');
            loadClosures();
          }
        } catch (e: any) {
          message.error(e.message || '删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<StoreClosureDto> = [
    {
      title: '关店日期',
      dataIndex: 'closureDate',
      key: 'closureDate',
      width: 120,
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '时间',
      key: 'time',
      width: 150,
      render: (_, r) =>
        r.isFullDay ? '全天' : `${r.startTime?.slice(0, 5)} - ${r.endTime?.slice(0, 5)}`,
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <Card
      extra={
        <Button type="primary" icon={<ShopOutlined />} onClick={handleAdd}>
          添加关店
        </Button>
      }
    >
      <Table columns={columns} dataSource={closures} rowKey="id" loading={loading} />

      <Modal
        title="添加临时关店"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="closureDate"
            label="关店日期"
            rules={[{ required: true, message: '请选择关店日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="isFullDay" label="全天关店" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isFullDay !== cur.isFullDay}>
            {({ getFieldValue }) =>
              !getFieldValue('isFullDay') && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item
                    name="startTime"
                    label="开始时间"
                    rules={[{ required: true, message: '请选择开始时间' }]}
                    style={{ flex: 1 }}
                  >
                    <TimePicker style={{ width: '100%' }} format="HH:mm" />
                  </Form.Item>
                  <Form.Item
                    name="endTime"
                    label="结束时间"
                    rules={[{ required: true, message: '请选择结束时间' }]}
                    style={{ flex: 1 }}
                  >
                    <TimePicker style={{ width: '100%' }} format="HH:mm" />
                  </Form.Item>
                </div>
              )
            }
          </Form.Item>
          <Form.Item
            name="reason"
            label="关店原因"
            rules={[{ required: true, message: '请填写关店原因' }]}
          >
            <TextArea rows={3} placeholder="请填写关店原因，这对通知来访者很重要" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default AdminPage;
