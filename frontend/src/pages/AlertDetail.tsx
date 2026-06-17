import { useState, useEffect } from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Card,
  Timeline,
  Form,
  Input,
  Select,
  Modal,
  message,
  Row,
  Col,
  Divider,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { alertApi, userApi } from '../api';
import type { Alert, AlertProcessLog, User } from '../types';
import { AlertStatus, AlertPriority, AlertType, UserRole } from '../types';
import {
  alertStatusText,
  alertStatusColor,
  alertPriorityText,
  alertPriorityColor,
  alertTypeText,
  formatDate,
} from '../utils';
import { useAuthStore } from '../store';

const { TextArea } = Input;

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [logs, setLogs] = useState<AlertProcessLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [processType, setProcessType] = useState<AlertStatus | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadData();
      loadLogs();
      loadUsers();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await alertApi.getById(Number(id));
      if (res.success && res.data) {
        setAlert(res.data);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await alertApi.getProcessLogs(Number(id));
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      // ignore
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userApi.getByRole(UserRole.StoreOperator);
      setUsers(res as unknown as User[]);
    } catch {
      // ignore
    }
  };

  const handleProcess = (type: AlertStatus) => {
    setProcessType(type);
    form.resetFields();
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = async (values: any) => {
    if (!processType) return;
    try {
      const res = await alertApi.process(Number(id), {
        toStatus: processType,
        remark: values.remark || '',
        rollbackPlan: values.rollbackPlan,
      });
      if (res.success) {
        message.success('操作成功');
        setProcessModalVisible(false);
        loadData();
        loadLogs();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const handleAssignSubmit = async (values: any) => {
    try {
      const res = await alertApi.assign(Number(id), {
        assignedToId: values.assignedToId,
        priority: values.priority,
        remark: values.remark,
      });
      if (res.success) {
        message.success('分派成功');
        setAssignModalVisible(false);
        loadData();
        loadLogs();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const getAvailableActions = () => {
    if (!alert) return [];
    const actions: { status: AlertStatus; label: string; type: string; icon: any }[] = [];

    if (user?.role === UserRole.Admin && alert.status === AlertStatus.Pending) {
      actions.push({ status: AlertStatus.Assigned, label: '分派处理人', type: 'primary', icon: <UserOutlined /> });
    }

    if (
      (alert.status === AlertStatus.Assigned || alert.status === AlertStatus.Pending) &&
      (user?.role === UserRole.Admin || alert.assignedToId === user?.id)
    ) {
      actions.push({ status: AlertStatus.Processing, label: '开始处理', type: 'primary', icon: <PlayCircleOutlined /> });
    }

    if (
      alert.status === AlertStatus.Processing &&
      (user?.role === UserRole.Admin || alert.assignedToId === user?.id)
    ) {
      actions.push({ status: AlertStatus.Resolved, label: '标记已解决', type: 'primary', icon: <CheckCircleOutlined /> });
      actions.push({ status: AlertStatus.Rollback, label: '回滚', type: 'default', icon: <RollbackOutlined /> });
    }

    if (
      alert.status === AlertStatus.Rollback &&
      (user?.role === UserRole.Admin || alert.assignedToId === user?.id)
    ) {
      actions.push({ status: AlertStatus.Processing, label: '恢复处理', type: 'primary', icon: <PlayCircleOutlined /> });
    }

    if (user?.role === UserRole.Admin && alert.status === AlertStatus.Resolved) {
      actions.push({ status: AlertStatus.Closed, label: '关闭工单', type: 'primary', icon: <CloseCircleOutlined /> });
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (!alert && !loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alerts')}>
          返回列表
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="告警详情" loading={loading}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="ID">{alert?.id}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {alert?.title}
                {alert?.isOverdue && <Tag color="red" style={{ marginLeft: 8 }}>已超期</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag>{alertTypeText[alert?.type || AlertType.ServerDown]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={alertPriorityColor[alert?.priority || AlertPriority.Medium]}>
                  {alertPriorityText[alert?.priority || AlertPriority.Medium]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={alertStatusColor[alert?.status || AlertStatus.Pending]}>
                  {alertStatusText[alert?.status || AlertStatus.Pending]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联资产">{alert?.assetName || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{alert?.assignedToName || '未分派'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{alert?.createdByName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDate(alert?.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="分派时间">{formatDate(alert?.assignedAt)}</Descriptions.Item>
              <Descriptions.Item label="开始处理时间">{formatDate(alert?.startedAt)}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{formatDate(alert?.resolvedAt)}</Descriptions.Item>
              <Descriptions.Item label="关闭时间">{formatDate(alert?.closedAt)}</Descriptions.Item>
              <Descriptions.Item label="截止时间">
                <span style={{ color: alert?.isOverdue ? '#ff4d4f' : 'inherit' }}>
                  {formatDate(alert?.dueDate)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>
                {alert?.description || '-'}
              </Descriptions.Item>
              {alert?.rollbackPlan && (
                <Descriptions.Item label="回滚方案" span={2}>
                  {alert.rollbackPlan}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Space wrap>
              {actions.map((action) =>
                action.status === AlertStatus.Assigned ? (
                  <Button
                    key={action.status}
                    type={action.type as any}
                    icon={action.icon}
                    onClick={() => setAssignModalVisible(true)}
                  >
                    {action.label}
                  </Button>
                ) : (
                  <Button
                    key={action.status}
                    type={action.type as any}
                    icon={action.icon}
                    onClick={() => handleProcess(action.status)}
                  >
                    {action.label}
                  </Button>
                )
              )}
            </Space>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="处理过程记录" size="small">
            <Timeline
              items={logs.map((log) => ({
                color: log.toStatus === AlertStatus.Resolved || log.toStatus === AlertStatus.Closed
                  ? 'green'
                  : log.toStatus === AlertStatus.Rollback
                  ? 'orange'
                  : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{log.actionDescription}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      操作人：{log.operatorName} · {formatDate(log.createdAt)}
                    </div>
                    {log.remark && (
                      <div style={{ marginTop: 4, color: '#666' }}>备注：{log.remark}</div>
                    )}
                  </div>
                ),
              }))}
            />
            {logs.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无处理记录</div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={processType === AlertStatus.Rollback ? '执行回滚' : `确认${processType ? alertStatusText[processType] : ''}`}
        open={processModalVisible}
        onCancel={() => setProcessModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleProcessSubmit}>
          <Form.Item name="remark" label="处理说明" rules={[{ required: true, message: '请输入处理说明' }]}>
            <TextArea rows={4} placeholder="请输入处理说明..." />
          </Form.Item>
          {processType === AlertStatus.Rollback && (
            <Form.Item name="rollbackPlan" label="回滚方案">
              <TextArea rows={3} placeholder="请输入回滚方案..." />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认提交
              </Button>
              <Button onClick={() => setProcessModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分派告警"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item name="assignedToId" label="处理人" rules={[{ required: true, message: '请选择处理人' }]}>
            <Select placeholder="请选择处理人">
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.fullName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={alert?.priority || AlertPriority.Medium}>
            <Select>
              {Object.entries(alertPriorityText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="分派说明">
            <TextArea rows={3} placeholder="请输入分派说明..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分派
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
