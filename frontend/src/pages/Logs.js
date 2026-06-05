import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  message,
  Modal,
  Select,
  Input,
  Descriptions,
  Badge,
} from 'antd';
import {
  FileTextOutlined,
  BellOutlined,
  ReloadOutlined,
  EyeOutlined,
  RetryOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { logsAPI } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

function Logs() {
  const [errorLogs, setErrorLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [logType, setLogType] = useState('errors');
  const [levelFilter, setLevelFilter] = useState(null);

  useEffect(() => {
    loadErrorLogs();
    loadNotifications();
  }, []);

  const loadErrorLogs = async () => {
    try {
      setLoading(true);
      const params = levelFilter ? { level: levelFilter } : {};
      const res = await logsAPI.listErrors(params);
      setErrorLogs(res.data);
    } catch (error) {
      message.error('加载错误日志失败');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await logsAPI.listNotifications();
      setNotifications(res.data);
    } catch (error) {
      message.error('加载通知日志失败');
    }
  };

  const handleViewError = async (id) => {
    try {
      const res = await logsAPI.getError(id);
      setCurrentLog(res.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('加载日志详情失败');
    }
  };

  const handleClearErrors = async () => {
    Modal.confirm({
      title: '确认清除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要清除30天前的错误日志吗？此操作不可恢复。',
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await logsAPI.clearErrors(30);
          message.success('已清除过期日志');
          loadErrorLogs();
        } catch (error) {
          message.error('清除失败');
        }
      },
    });
  };

  const handleRetryNotification = async (id) => {
    try {
      await logsAPI.retryNotification(id);
      message.success('已重新发送');
      loadNotifications();
    } catch (error) {
      message.error('重试失败');
    }
  };

  const errorColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => {
        const colors = {
          ERROR: 'red',
          WARNING: 'orange',
          INFO: 'blue',
          DEBUG: 'default',
        };
        return <Tag color={colors[level]}>{level}</Tag>;
      },
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (id) => id || '-',
    },
    {
      title: '发生时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewError(record.id)}>
          详情
        </Button>
      ),
    },
  ];

  const notificationColumns = [
    {
      title: '类型',
      dataIndex: 'notification_type',
      key: 'notification_type',
      width: 120,
      render: (type) => {
        const typeLabels = {
          booking_confirm: '报名确认',
          waitlist_promoted: '候补转正',
          booking_cancelled: '取消通知',
          guest_invitation: '嘉宾邀请',
          screening_reminder: '放映提醒',
        };
        return <Tag>{typeLabels[type] || type}</Tag>;
      },
    },
    {
      title: '接收人',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 150,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: '等待中' },
          sent: { color: 'green', text: '已发送' },
          failed: { color: 'red', text: '失败' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return (
          <Badge
            status={config.color === 'green' ? 'success' : config.color === 'red' ? 'error' : 'warning'}
            text={config.text}
          />
        );
      },
    },
    {
      title: '发送时间',
      dataIndex: 'sent_at',
      key: 'sent_at',
      width: 180,
      render: (time) => time || '-',
    },
    {
      title: '重试次数',
      dataIndex: 'retry_count',
      key: 'retry_count',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              icon={<RetryOutlined />}
              onClick={() => handleRetryNotification(record.id)}
            >
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            日志管理
          </Space>
        }
        extra={
          <Space>
            {logType === 'errors' && (
              <Select
                placeholder="筛选级别"
                style={{ width: 120 }}
                allowClear
                onChange={(val) => {
                  setLevelFilter(val);
                  setTimeout(loadErrorLogs, 0);
                }}
              >
                <Option value="ERROR">错误</Option>
                <Option value="WARNING">警告</Option>
                <Option value="INFO">信息</Option>
              </Select>
            )}
            <Button icon={<ReloadOutlined />} onClick={logType === 'errors' ? loadErrorLogs : loadNotifications} loading={loading}>
              刷新
            </Button>
            {logType === 'errors' && (
              <Button danger icon={<DeleteOutlined />} onClick={handleClearErrors}>
                清除过期
              </Button>
            )}
          </Space>
        }
      >
        <Tabs
          activeKey={logType}
          onChange={(key) => {
            setLogType(key);
            if (key === 'errors') loadErrorLogs();
            else loadNotifications();
          }}
        >
          <TabPane
            tab={
              <span>
                <ExclamationCircleOutlined />
                错误日志
              </span>
            }
            key="errors"
          >
            <Table
              columns={errorColumns}
              dataSource={errorLogs}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <BellOutlined />
                通知日志
              </span>
            }
            key="notifications"
          >
            <Table
              columns={notificationColumns}
              dataSource={notifications}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="错误日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {currentLog && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="级别">
              <Tag color={currentLog.level === 'ERROR' ? 'red' : 'orange'}>{currentLog.level}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="错误信息">{currentLog.message}</Descriptions.Item>
            <Descriptions.Item label="模块">{currentLog.module}</Descriptions.Item>
            <Descriptions.Item label="请求路径">{currentLog.path || '-'}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{currentLog.user_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="发生时间">{currentLog.created_at}</Descriptions.Item>
            <Descriptions.Item label="堆栈信息">
              <TextArea
                value={currentLog.traceback || '无'}
                readOnly
                autoSize={{ minRows: 8, maxRows: 20 }}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default Logs;
