import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  DatePicker, message, Row, Col, Statistic, Alert, Tabs
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  WarningOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { Todo, TodoStatus, TodoType, User } from '../types';
import { todoApi, userApi } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const typeConfig: Record<TodoType, { label: string; color: string; icon: any }> = {
  voting_exception: { label: '投票资格异常', color: 'red', icon: <WarningOutlined /> },
  review: { label: '复查提醒', color: 'orange', icon: <CheckCircleOutlined /> },
  follow_up: { label: '跟进任务', color: 'blue', icon: <ClockCircleOutlined /> },
  urgent: { label: '紧急事项', color: 'red', icon: <ExclamationCircleOutlined /> },
};

const statusConfig: Record<TodoStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
};

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadTodos();
    loadUsers();
  }, [activeTab]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const data = await todoApi.getTodos(params) as any;
      setTodos(data);
    } catch (error) {
      message.error('加载待办列表失败');
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
      await todoApi.createTodo({
        ...values,
        creatorId: currentUser.id,
        deadline: values.deadline?.format('YYYY-MM-DD HH:mm:ss'),
      }) as any;
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTodos();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleUpdateStatus = async (id: string, status: TodoStatus) => {
    try {
      await todoApi.updateTodo(id, { status });
      message.success('状态更新成功');
      loadTodos();
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
          await todoApi.deleteTodo(id);
          message.success('删除成功');
          loadTodos();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Todo) => (
        <div>
          <Space>
            {typeConfig[record.type].icon}
            <strong>{text}</strong>
          </Space>
          {record.affectsHelpProgress && (
            <Tag color="red" style={{ marginTop: 4 }}>
              影响帮扶进度
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: TodoType) => (
        <Tag color={typeConfig[type].color}>{typeConfig[type].label}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TodoStatus) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => {
        const colors = ['', 'blue', 'orange', 'red'];
        const labels = ['', '低', '中', '高'];
        return <Tag color={colors[priority] as any}>{labels[priority]}优先级</Tag>;
      },
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
          {deadline ? dayjs(deadline).format('YYYY-MM-DD HH:mm') : '-'}
        </Space>
      ),
    },
    {
      title: '影响',
      dataIndex: 'affectsHelpProgress',
      key: 'affectsHelpProgress',
      render: (affects: boolean, record: Todo) => (
        affects ? (
          <div>
            <Tag color="red">是</Tag>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {record.helpProgressImpact}
            </div>
          </div>
        ) : <Tag>否</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Todo) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'processing')}>
              开始处理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'completed')}>
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

  const votingExceptions = todos.filter(t => t.type === 'voting_exception' && t.status !== 'completed');
  const affectsHelpProgress = todos.filter(t => t.affectsHelpProgress && t.status !== 'completed');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">待办事项</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建待办
        </Button>
      </div>

      {votingExceptions.length > 0 && (
        <Alert
          message={`有 ${votingExceptions.length} 个投票资格异常待处理`}
          description="投票资格异常将影响帮扶进度报表，请及时处理"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {affectsHelpProgress.length > 0 && (
        <Alert
          message={`有 ${affectsHelpProgress.length} 个事项影响帮扶进度`}
          description="请尽快处理以保证帮扶进度统计准确"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="待处理" value={todos.filter(t => t.status === 'pending').length} valueStyle={{ color: '#faad14' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="处理中" value={todos.filter(t => t.status === 'processing').length} valueStyle={{ color: '#1890ff' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="投票异常" value={votingExceptions.length} valueStyle={{ color: '#ff4d4f' }} />
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <Statistic title="影响帮扶" value={affectsHelpProgress.length} valueStyle={{ color: '#ff4d4f' }} />
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="全部" key="all" />
        <TabPane tab="投票资格异常" key="voting_exception" />
        <TabPane tab="复查提醒" key="review" />
        <TabPane tab="跟进任务" key="follow_up" />
        <TabPane tab="紧急事项" key="urgent" />
      </Tabs>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={todos}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => record.affectsHelpProgress ? 'todo-exception' : ''}
        />
      </div>

      <Modal
        title="新建待办"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入待办标题" />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={3} placeholder="请输入待办详情" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select>
                  <Select.Option value="voting_exception">投票资格异常</Select.Option>
                  <Select.Option value="review">复查提醒</Select.Option>
                  <Select.Option value="follow_up">跟进任务</Select.Option>
                  <Select.Option value="urgent">紧急事项</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue={1}>
                <Select>
                  <Select.Option value={1}>低</Select.Option>
                  <Select.Option value={2}>中</Select.Option>
                  <Select.Option value={3}>高</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigneeId" label="负责人" rules={[{ required: true, message: '请选择负责人' }]}>
                <Select>
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
          <Form.Item name="affectsHelpProgress" label="是否影响帮扶进度" initialValue={false}>
            <Select>
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="helpProgressImpact" label="帮扶进度影响说明">
            <Input.TextArea rows={2} placeholder="说明对帮扶进度的具体影响" />
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

export default TodoList;
