import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Space,
  Button,
  Select,
  Empty,
  Typography,
  Badge,
  Divider,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Timeline,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ArrowUpOutlined,
  TeamOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { notificationApi } from '../api/notification';
import { authApi } from '../api/auth';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { OptGroup, Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState({ total: 0, urgent: 0, normal: 0 });
  const [activeTab, setActiveTab] = useState<string>('all');

  const [detailModal, setDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [escalationModal, setEscalationModal] = useState(false);
  const [hrUsers, setHrUsers] = useState<any[]>([]);
  const [interviewerUsers, setInterviewerUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [escalationRules, setEscalationRules] = useState<any[]>([]);
  const [assignForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [completeRemark, setCompleteRemark] = useState('');
  const [completeModal, setCompleteModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    loadTasks();
    if (user?.role === 'admin' || user?.role === 'hr') {
      loadUsers();
      loadEscalationRules();
    }
  }, [page, typeFilter, categoryFilter, activeTab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };

      if (typeFilter) {
        params.type = typeFilter;
      }
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      if (activeTab === 'unread') {
        params.isRead = false;
      } else if (activeTab === 'urgent') {
        params.type = 'urgent';
      }

      const res = await notificationApi.getNotifications(params);
      if (res.success) {
        setNotifications(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await notificationApi.getMyTasks();
      if (res.success) {
        setTasks(res.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const [hrRes, interviewerRes, adminRes] = await Promise.all([
        authApi.getUsers({ role: 'hr', pageSize: 100 }),
        authApi.getUsers({ role: 'interviewer', pageSize: 100 }),
        authApi.getUsers({ role: 'admin', pageSize: 100 }),
      ]);
      if (hrRes.success) setHrUsers(hrRes.data.items);
      if (interviewerRes.success) setInterviewerUsers(interviewerRes.data.items);
      if (adminRes.success) setAdminUsers(adminRes.data.items);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadEscalationRules = async () => {
    try {
      const res = await notificationApi.getEscalationRules();
      if (res.success) {
        setEscalationRules(res.data);
      }
    } catch (error) {
      console.error('Failed to load escalation rules:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      loadNotifications();
      loadUnreadCount();
      message.success('已全部标记为已读');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewDetail = async (item: any) => {
    try {
      const res = await notificationApi.getNotificationDetail(item.id);
      if (res.success) {
        setSelectedNotification(res.data);
        setDetailModal(true);
        if (!item.isRead) {
          handleMarkAsRead(item.id);
        }
      }
    } catch (error) {
      console.error('Failed to load detail:', error);
    }
  };

  const handleOpenAssign = (item: any) => {
    setSelectedNotification(item);
    assignForm.resetFields();
    setAssignModal(true);
  };

  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      const res = await notificationApi.assignNotification(selectedNotification.id, {
        assigneeId: values.assigneeId,
        deadlineHours: values.deadlineHours || 24,
      });
      if (res.success) {
        message.success('分派成功');
        setAssignModal(false);
        loadNotifications();
        loadTasks();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '分派失败');
    }
  };

  const handleOpenEscalate = (item: any) => {
    setSelectedNotification(item);
    Modal.confirm({
      title: '确认手动升级',
      content: '将此通知任务升级到上一级负责人处理？',
      okText: '确认升级',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await notificationApi.manualEscalate(item.id);
          if (res.success) {
            message.success('已升级');
            loadNotifications();
            loadTasks();
          } else {
            message.error(res.message);
          }
        } catch (error: any) {
          message.error(error.message || '升级失败');
        }
      },
    });
  };

  const handleOpenComplete = (task: any) => {
    setCompletingTask(task);
    setCompleteRemark('');
    setCompleteModal(true);
  };

  const handleCompleteTask = async () => {
    try {
      const res = await notificationApi.completeTask(completingTask.id, completeRemark);
      if (res.success) {
        message.success('任务已完成');
        setCompleteModal(false);
        loadTasks();
        loadNotifications();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleCreateRule = async () => {
    try {
      const values = await ruleForm.validateFields();
      const res = await notificationApi.createEscalationRule(values);
      if (res.success) {
        message.success('规则创建成功');
        setEscalationModal(false);
        ruleForm.resetFields();
        loadEscalationRules();
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '创建失败');
    }
  };

  const handleCheckEscalation = async () => {
    try {
      const res = await notificationApi.checkEscalation();
      if (res.success) {
        message.success('升级检查完成');
        loadNotifications();
        loadTasks();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleTestScoreDispute = async () => {
    try {
      Modal.confirm({
        title: '触发测试评分争议',
        content: '将创建一条测试评分争议通知，按升级规则分派给负责人',
        okText: '确认触发',
        onOk: async () => {
          const res = await notificationApi.testScoreDispute();
          if (res.success) {
            message.success('测试评分争议已发送');
            loadNotifications();
            loadTasks();
            loadUnreadCount();
          }
        },
      });
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    urgent: { label: '紧急', color: 'red', icon: <WarningOutlined /> },
    warning: { label: '提醒', color: 'orange', icon: <WarningOutlined /> },
    info: { label: '通知', color: 'blue', icon: <InfoCircleOutlined /> },
  };

  const categoryMap: Record<string, string> = {
    resume_status: '简历状态',
    interview_schedule: '面试安排',
    score_dispute: '评分争议',
    deadline_reminder: '截止提醒',
    escalation: '升级通知',
    system: '系统通知',
  };

  const taskStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'orange' },
    escalated: { label: '已升级', color: 'red' },
    completed: { label: '已完成', color: 'green' },
  };

  const roleMap: Record<string, string> = {
    admin: '系统管理员',
    hr: '招聘经理',
    interviewer: '面试官',
    candidate: '候选人',
  };

  const isManager = user?.role === 'admin' || user?.role === 'hr';

  const getNotificationClass = (item: any) => {
    let cls = 'notification-item';
    if (item.type === 'urgent') cls += ' notification-urgent';
    else if (item.type === 'warning') cls += ' notification-warning';
    else cls += ' notification-info';

    if (!item.isRead) cls += ' notification-unread';
    else cls += ' notification-read';

    return cls;
  };

  const myPendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'escalated');

  const renderNotifications = () => {
    if (notifications.length === 0) {
      return <Empty description="暂无通知消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <List
        dataSource={notifications}
        loading={loading}
        renderItem={(item) => (
          <div
            key={item.id}
            className={getNotificationClass(item)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space style={{ flex: 1 }} align="start">
                {typeMap[item.type]?.icon}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: item.isRead ? 'normal' : 500 }}>
                    <Tag color={typeMap[item.type]?.color}>
                      {typeMap[item.type]?.label}
                    </Tag>
                    <Tag color="blue">
                      {categoryMap[item.category] || item.category}
                    </Tag>
                    <span>{item.title}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 13 }}>
                    {item.content}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: 12 }}>
                    {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              </Space>
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(item)}
                >
                  详情
                </Button>
                {item.category === 'score_dispute' && isManager && (
                  <>
                    <Button
                      type="link"
                      size="small"
                      icon={<TeamOutlined />}
                      onClick={() => handleOpenAssign(item)}
                    >
                      分派
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<ArrowUpOutlined />}
                      onClick={() => handleOpenEscalate(item)}
                    >
                      升级
                    </Button>
                  </>
                )}
                {!item.isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', flexShrink: 0 }} />
                )}
              </Space>
            </div>
          </div>
        )}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          showQuickJumper: true,
          onChange: (p) => setPage(p),
        }}
      />
    );
  };

  const renderTasks = () => {
    if (myPendingTasks.length === 0) {
      return <Empty description="暂无待处理任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <List
        dataSource={myPendingTasks}
        renderItem={(task) => (
          <List.Item key={task.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <List.Item.Meta
              avatar={task.escalationLevel > 0 ? <ArrowUpOutlined style={{ color: '#ff4d4f', fontSize: 20 }} /> : <ClockCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />}
              title={
                <Space>
                  <Text strong>{`任务 #${task.id.slice(0, 8)}`}</Text>
                  <Tag color={taskStatusMap[task.status]?.color}>
                    {taskStatusMap[task.status]?.label}
                  </Tag>
                  {task.escalationLevel > 0 && (
                    <Tag color="red">升级级别: {task.escalationLevel}</Tag>
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">
                    截止时间：{task.deadline ? dayjs(task.deadline).format('YYYY-MM-DD HH:mm') : '未设置'}
                  </Text>
                  {dayjs(task.deadline).isBefore(dayjs()) && (
                    <Text type="danger">已超时</Text>
                  )}
                  <Text type="secondary">
                    创建时间：{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </Space>
              }
            />
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleOpenComplete(task)}>
              完成
            </Button>
          </List.Item>
        )}
      />
    );
  };

  const renderRules = () => {
    if (!isManager) return null;

    if (escalationRules.length === 0) {
      return (
        <Empty
          description="暂无升级规则"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <List
        dataSource={escalationRules}
        renderItem={(rule) => (
          <List.Item key={rule.id}>
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{rule.name}</Text>
                  <Tag color="blue">{rule.eventType}</Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">
                    {roleMap[rule.primaryRole] || rule.primaryRole} 处理 {rule.timeoutHours} 小时未处理后，
                    升级到 {roleMap[rule.escalateToRole] || rule.escalateToRole}
                  </Text>
                  {rule.description && (
                    <Text type="secondary">描述：{rule.description}</Text>
                  )}
                </Space>
              }
            />
            <Tag color="green">已启用</Tag>
          </List.Item>
        )}
      />
    );
  };

  const notificationTabItems = [
    { key: 'all', label: '全部消息' },
    { key: 'unread', label: `未读 (${unreadCount.total})` },
    { key: 'urgent', label: `紧急/提醒 (${unreadCount.urgent})` },
    { key: 'tasks', label: `我的待办 (${myPendingTasks.length})` },
    ...(isManager ? [{ key: 'rules', label: '升级规则' }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>通知中心</Title>
        <Space>
          {isManager && (
            <>
              <Button icon={<WarningOutlined />} danger onClick={handleTestScoreDispute}>
                测试评分争议
              </Button>
              <Button icon={<ArrowUpOutlined />} onClick={handleCheckEscalation}>
                执行升级检查
              </Button>
              <Button icon={<TeamOutlined />} onClick={() => setEscalationModal(true)}>
                新建升级规则
              </Button>
            </>
          )}
          <Button type="primary" onClick={handleMarkAllAsRead}>
            全部标为已读
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="全部未读"
              value={unreadCount.total}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="紧急消息"
              value={unreadCount.urgent}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="普通通知"
              value={unreadCount.normal}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="我的待办"
              value={myPendingTasks.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="消息类型"
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="urgent">紧急</Option>
            <Option value="warning">提醒</Option>
            <Option value="info">通知</Option>
          </Select>
          <Select
            placeholder="消息分类"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(categoryMap).map(([key, val]) => (
              <Option key={key} value={key}>{val}</Option>
            ))}
          </Select>
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={notificationTabItems}
        />

        <Divider style={{ margin: '12px 0' }} />

        {activeTab === 'tasks' ? renderTasks() : activeTab === 'rules' ? renderRules() : renderNotifications()}
      </Card>

      <Modal
        title="通知详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {selectedNotification && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Space>
                  <Tag color={typeMap[selectedNotification.type]?.color}>
                    {typeMap[selectedNotification.type]?.label}
                  </Tag>
                  <Tag color="blue">
                    {categoryMap[selectedNotification.category] || selectedNotification.category}
                  </Tag>
                  <Text strong style={{ fontSize: 16 }}>{selectedNotification.title}</Text>
                </Space>
              </div>

              <Card size="small" title="内容">
                <p>{selectedNotification.content}</p>
                <Space style={{ marginTop: 8 }}>
                  <Text type="secondary">接收人：{selectedNotification.recipientName} ({roleMap[selectedNotification.recipientRole] || selectedNotification.recipientRole})</Text>
                </Space>
                <Space>
                  <Text type="secondary">创建时间：{dayjs(selectedNotification.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                </Space>
                {selectedNotification.readAt && (
                  <Space>
                    <Text type="secondary">已读时间：{dayjs(selectedNotification.readAt).format('YYYY-MM-DD HH:mm')}</Text>
                  </Space>
                )}
                {selectedNotification.actionUrl && (
                  <Space style={{ marginTop: 8 }}>
                    <Button type="link" onClick={() => navigate(selectedNotification.actionUrl)}>
                      前往处理
                    </Button>
                  </Space>
                )}
              </Card>

              {selectedNotification.tasks && selectedNotification.tasks.length > 0 && (
                <Card size="small" title="处理任务流程">
                  <Timeline
                    items={selectedNotification.tasks.map((task: any) => ({
                      color: task.status === 'completed' ? 'green' : task.status === 'escalated' ? 'red' : 'blue',
                      children: (
                        <div>
                          <Space>
                            <Text strong>{task.assigneeName}</Text>
                            <Tag>{roleMap[task.assigneeRole] || task.assigneeRole}</Tag>
                            <Tag color={taskStatusMap[task.status]?.color}>
                              {taskStatusMap[task.status]?.label}
                            </Tag>
                            {task.escalationLevel > 0 && <Tag color="red">L{task.escalationLevel} 升级</Tag>}
                          </Space>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">
                              截止：{task.deadline ? dayjs(task.deadline).format('YYYY-MM-DD HH:mm') : '未设置'}
                            </Text>
                          </div>
                          {task.completedAt && (
                            <div>
                              <Text type="secondary">
                                完成：{dayjs(task.completedAt).format('YYYY-MM-DD HH:mm')}
                              </Text>
                            </div>
                          )}
                        </div>
                      ),
                    }))}
                  />
                </Card>
              )}
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="分派任务"
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={handleAssign}
        okText="确认分派"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="assigneeId" label="指派给" rules={[{ required: true, message: '请选择处理人' }]}>
            <Select placeholder="请选择处理人">
              <OptGroup label="招聘经理">
                {hrUsers.map((u) => (
                  <Option key={u.id} value={u.id}>{u.name}</Option>
                ))}
              </OptGroup>
              <OptGroup label="面试官">
                {interviewerUsers.map((u) => (
                  <Option key={u.id} value={u.id}>{u.name}</Option>
                ))}
              </OptGroup>
              <OptGroup label="管理员">
                {adminUsers.map((u) => (
                  <Option key={u.id} value={u.id}>{u.name}</Option>
                ))}
              </OptGroup>
            </Select>
          </Form.Item>
          <Form.Item name="deadlineHours" label="处理时限(小时)" initialValue={24}>
            <Select>
              <Option value={4}>4 小时</Option>
              <Option value={8}>8 小时</Option>
              <Option value={12}>12 小时</Option>
              <Option value={24}>24 小时</Option>
              <Option value={48}>48 小时</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成任务"
        open={completeModal}
        onCancel={() => setCompleteModal(false)}
        onOk={handleCompleteTask}
        okText="确认完成"
      >
        <div>
          <p style={{ marginBottom: 12 }}>确认完成此任务？</p>
          <TextArea
            rows={3}
            placeholder="填写处理备注(可选)"
            value={completeRemark}
            onChange={(e) => setCompleteRemark(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="新建升级规则"
        open={escalationModal}
        onCancel={() => setEscalationModal(false)}
        onOk={handleCreateRule}
        okText="创建"
        width={500}
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="如：评分争议超时升级" />
          </Form.Item>
          <Form.Item name="eventType" label="事件类型" rules={[{ required: true }]}>
            <Select>
              <Option value="score_dispute">评分争议</Option>
              <Option value="interview_schedule">面试安排</Option>
              <Option value="deadline_reminder">截止提醒</Option>
              <Option value="resume_status">简历状态</Option>
            </Select>
          </Form.Item>
          <Form.Item name="primaryRole" label="初始处理角色" rules={[{ required: true }]}>
            <Select>
              <Option value="interviewer">面试官</Option>
              <Option value="hr">招聘经理</Option>
            </Select>
          </Form.Item>
          <Form.Item name="timeoutHours" label="超时时间(小时)" initialValue={24} rules={[{ required: true }]}>
            <Select>
              <Option value={4}>4 小时</Option>
              <Option value={8}>8 小时</Option>
              <Option value={12}>12 小时</Option>
              <Option value={24}>24 小时</Option>
              <Option value={48}>48 小时</Option>
            </Select>
          </Form.Item>
          <Form.Item name="escalateToRole" label="升级到角色" rules={[{ required: true }]}>
            <Select>
              <Option value="hr">招聘经理</Option>
              <Option value="admin">系统管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationCenter;
