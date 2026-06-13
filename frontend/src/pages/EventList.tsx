import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  DatePicker, InputNumber, message, Row, Col, Statistic, Tabs
} from 'antd';
import {
  PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  EnvironmentOutlined, UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { Event, EventType, EventStatus, User } from '../types';
import { eventApi, userApi } from '../services/api';
import EventFilter from '../components/EventFilter';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;

const typeConfig: Record<EventType, { label: string; color: string }> = {
  rectification: { label: '整改复查', color: 'orange' },
  vote: { label: '议题投票', color: 'blue' },
  patrol: { label: '巡逻任务', color: 'green' },
};

const statusConfig: Record<EventStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  reviewing: { label: '复查中', color: 'warning' },
  voting: { label: '投票中', color: 'blue' },
  completed: { label: '已完成', color: 'success' },
  closed: { label: '已关闭', color: 'default' },
};

const EventList: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [form] = Form.useForm();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [locationLoading, setLocationLoading] = useState(false);

  const activeTab = type || 'rectification';

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [activeTab, filters]);

  const loadUsers = async () => {
    try {
      const data = await userApi.getUsers() as any;
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await eventApi.getEventStats() as any;
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = { type: activeTab, ...filters };
      const data = await eventApi.getEvents(params) as any;
      setEvents(data);
    } catch (error) {
      message.error('加载事件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleCreate = async (values: any) => {
    try {
      const payload = {
        ...values,
        type: activeTab,
        reporterId: currentUser.id,
        deadline: values.deadline?.format('YYYY-MM-DD HH:mm:ss'),
        latitude: values.latitude !== undefined && values.latitude !== '' ? Number(values.latitude) : undefined,
        longitude: values.longitude !== undefined && values.longitude !== '' ? Number(values.longitude) : undefined,
        priority: values.priority !== undefined ? Number(values.priority) : 0,
      };
      await eventApi.createEvent(payload) as any;
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadEvents();
      loadStats();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      onOk: async () => {
        try {
          await eventApi.deleteEvent(id, currentUser.id);
          message.success('删除成功');
          loadEvents();
          loadStats();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      message.error('您的浏览器不支持定位功能');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setFieldsValue({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        });
        message.success('定位成功');
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = '定位失败，请手动输入';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '定位权限被拒绝，请在浏览器设置中允许定位';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMsg = '定位超时，请重试';
            break;
        }
        message.error(errorMsg);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleUpdateStatus = async (id: string, status: EventStatus) => {
    try {
      await eventApi.updateEvent(id, { status, operatorId: currentUser.id }) as any;
      message.success('状态更新成功');
      loadEvents();
      loadStats();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const columns = [
    {
      title: '事件标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Event) => (
        <a onClick={() => navigate(`/event/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: EventType) => (
        <Tag color={typeConfig[type].color}>{typeConfig[type].label}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: EventStatus) => (
        <Tag color={statusConfig[status].color} className="status-tag">
          {statusConfig[status].label}
        </Tag>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (text: string, record: Event) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          {text || record.gridArea || '未设置'}
        </Space>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: User) => (
        <Space>
          <UserOutlined />
          {assignee?.name || '未分配'}
        </Space>
      ),
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => (
        <Space>
          <ClockCircleOutlined />
          {deadline ? dayjs(deadline).format('YYYY-MM-DD') : '未设置'}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Event) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/event/${record.id}`)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'processing')}>
              开始处理
            </Button>
          )}
          {record.status === 'processing' && activeTab === 'rectification' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'reviewing')}>
              提交复查
            </Button>
          )}
          {record.status === 'reviewing' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'completed')}>
              复查通过
            </Button>
          )}
          {record.status === 'completed' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'closed')}>
              关闭
            </Button>
          )}
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">事件管理 - {typeConfig[activeTab as EventType]?.label || '全部'}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          上报{typeConfig[activeTab as EventType]?.label}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="待处理" value={stats.pending || 0} valueStyle={{ color: '#faad14' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="处理中" value={stats.processing || 0} valueStyle={{ color: '#1890ff' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="已完成" value={stats.completed || 0} valueStyle={{ color: '#52c41a' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="已关闭" value={stats.closed || 0} valueStyle={{ color: '#8c8c8c' }} />
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={(key) => navigate(`/events/${key}`)}>
        <TabPane tab="整改复查" key="rectification" />
        <TabPane tab="议题投票" key="vote" />
        <TabPane tab="巡逻任务" key="patrol" />
      </Tabs>

      <EventFilter onFilter={handleFilter} />

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      <Modal
        title={`上报${typeConfig[activeTab as EventType]?.label}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="事件标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入事件标题" />
          </Form.Item>
          <Form.Item name="description" label="事件描述" rules={[{ required: true, message: '请输入描述' }]}>
            <TextArea rows={4} placeholder="请详细描述事件情况" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigneeId" label="负责人">
                <Select placeholder="选择负责人">
                  {users.filter(u => u.role === 'worker' || u.role === 'manager').map(user => (
                    <Select.Option key={user.id} value={user.id}>{user.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="截止时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gridArea" label="网格区域">
                <Select placeholder="选择网格区域">
                  <Select.Option value="grid1">第一网格</Select.Option>
                  <Select.Option value="grid2">第二网格</Select.Option>
                  <Select.Option value="grid3">第三网格</Select.Option>
                  <Select.Option value="grid4">第四网格</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <InputNumber min={0} max={5} defaultValue={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度">
                <Input placeholder="例如: 31.2304" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="longitude" label="经度">
                <Input placeholder="例如: 121.4737" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginBottom: 16, marginTop: -8 }}>
            <Button
              icon={<EnvironmentOutlined />}
              loading={locationLoading}
              onClick={handleGetCurrentLocation}
              type="dashed"
              block
            >
              {locationLoading ? '定位中...' : '获取当前位置'}
            </Button>
          </div>
          <Form.Item name="location" label="具体位置">
            <Input placeholder="请输入具体位置描述" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventList;
