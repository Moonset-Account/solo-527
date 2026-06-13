import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  DatePicker, message, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined
} from '@ant-design/icons';
import { Task, TaskStatus, TaskType, User } from '../types';
import { taskApi, userApi } from '../services/api';
import dayjs from 'dayjs';

const typeConfig: Record<TaskType, { label: string; color: string }> = {
  rectification: { label: '整改任务', color: 'orange' },
  patrol: { label: '巡逻任务', color: 'green' },
  review: { label: '复查任务', color: 'blue' },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待执行', color: 'default' },
  in_progress: { label: '进行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
};

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [form] = Form.useForm();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTasks() as any;
      setTasks(data);
    } catch (error) {
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userApi.getUsers() as any;
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await taskApi.createTask({
        ...values,
        creatorId: currentUser.id,
        startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss'),
        deadline: values.deadline?.format('YYYY-MM-DD HH:mm:ss'),
      }) as any;
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTasks();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    try {
      await taskApi.updateTask(id, { status });
      message.success('状态更新成功');
      loadTasks();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      onOk: async () => {
        try {
          await taskApi.deleteTask(id);
          message.success('删除成功');
          loadTasks();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: TaskType) => (
        <Tag color={typeConfig[type].color}>{typeConfig[type].label}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: User) => (
        <Space>
          <UserOutlined />
          {assignee?.name}
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
          {deadline ? dayjs(deadline).format('YYYY-MM-DD') : '-'}
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
      render: (_: any, record: Task) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'in_progress')}>
              开始执行
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="link" onClick={() => {
              Modal.confirm({
                title: '完成任务',
                content: '请输入任务结果：',
                okText: '确认完成',
                onOk: async () => {
                  await taskApi.updateTask(record.id, { status: 'completed' });
                  message.success('任务已完成');
                  loadTasks();
                },
              });
            }}>
              完成
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
        <h1 className="page-title">任务管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建任务
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="待执行" value={tasks.filter(t => t.status === 'pending').length} valueStyle={{ color: '#faad14' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="进行中" value={tasks.filter(t => t.status === 'in_progress').length} valueStyle={{ color: '#1890ff' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="已完成" value={tasks.filter(t => t.status === 'completed').length} valueStyle={{ color: '#52c41a' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="整改任务" value={tasks.filter(t => t.type === 'rectification').length} valueStyle={{ color: '#fa8c16' }} />
          </div>
        </Col>
      </Row>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="创建任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="任务类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select>
                  <Select.Option value="rectification">整改任务</Select.Option>
                  <Select.Option value="patrol">巡逻任务</Select.Option>
                  <Select.Option value="review">复查任务</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assigneeId" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
                <Select>
                  {users.filter(u => u.role === 'worker' || u.role === 'manager').map(user => (
                    <Select.Option key={user.id} value={user.id}>{user.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="截止时间" rules={[{ required: true, message: '请选择截止时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="checkpoints" label="检查点/路线">
            <Input.TextArea rows={2} placeholder="巡逻路线或检查点说明" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskList;
