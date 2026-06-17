import { useState, useEffect } from 'react';
import {
  List,
  Button,
  Space,
  Tag,
  Card,
  Empty,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  BugOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { notificationApi } from '../api';
import type { Notification } from '../types';
import { NotificationType } from '../types';
import { formatDate } from '../utils';
import { useNavigate } from 'react-router-dom';

const notificationTypeIcon: Record<number, any> = {
  [NotificationType.AlertCreated]: <AlertOutlined style={{ color: '#faad14' }} />,
  [NotificationType.AlertAssigned]: <AlertOutlined style={{ color: '#1890ff' }} />,
  [NotificationType.AlertStatusChanged]: <AlertOutlined style={{ color: '#52c41a' }} />,
  [NotificationType.AlertOverdue]: <AlertOutlined style={{ color: '#ff4d4f' }} />,
  [NotificationType.AssetSyncRequired]: <AppstoreOutlined style={{ color: '#faad14' }} />,
  [NotificationType.VulnerabilityExpired]: <BugOutlined style={{ color: '#ff4d4f' }} />,
  [NotificationType.BatchTaskCompleted]: <ThunderboltOutlined style={{ color: '#52c41a' }} />,
};

export default function NotificationList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getList({ isRead: filter, count: 100 });
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationApi.markAllAsRead();
      if (res.success) {
        message.success('已全部标记为已读');
        loadNotifications();
      }
    } catch {
      message.error('操作失败');
    }
  };

  const handleItemClick = async (item: Notification) => {
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item.id);
        loadNotifications();
      } catch {
        // ignore
      }
    }

    if (item.relatedType === 'Alert' && item.relatedId) {
      navigate(`/alerts/${item.relatedId}`);
    } else if (item.relatedType === 'Asset' && item.relatedId) {
      navigate(`/assets`);
    } else if (item.relatedType === 'BatchTask' && item.relatedId) {
      navigate(`/batch-tasks`);
    } else if (item.relatedType === 'Vulnerability' && item.relatedId) {
      navigate(`/vulnerabilities`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <Card
        title={
          <Space>
          <BellOutlined />
          <span>消息通知</span>
          {unreadCount > 0 && <Tag color="red">{unreadCount} 条未读</Tag>}
        </Space>
      }
        extra={
          <Space>
            <Button
              type={filter === undefined ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilter(undefined)}
            >
              全部
            </Button>
            <Button
              type={filter === false ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilter(false)}
            >
              未读
            </Button>
            <Button
              type={filter === true ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilter(true)}
            >
              已读
            </Button>
            <Button size="small" icon={<CheckCircleOutlined />} onClick={handleMarkAllAsRead}>
              全部已读
            </Button>
          </Space>
        }
      >
        <List
          loading={loading}
          dataSource={notifications}
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleItemClick(item)}
              style={{
                cursor: 'pointer',
                background: item.isRead ? '#fff' : '#f6ffed',
                padding: '12px 16px',
              }}
              className={item.isRead ? '' : 'notification-unread'}
            >
              <List.Item.Meta
                avatar={notificationTypeIcon[item.type] || <BellOutlined />}
                title={
                  <Space>
                    <span style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.title}</span>
                    {!item.isRead && <Tag color="red" style={{ fontSize: 10 }}>新</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ color: '#666' }}>{item.content}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
