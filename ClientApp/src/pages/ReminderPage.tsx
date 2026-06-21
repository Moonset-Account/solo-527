import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Badge,
  Avatar,
  Tabs,
} from 'antd';
import {
  BellOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  HourglassOutlined,
  ShopOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reminderApi } from '../services/api';
import type { ReminderDto, ReminderType } from '../types';

const { TabPane } = Tabs;

const typeConfig: Record<ReminderType, { icon: JSX.Element; color: string; label: string }> = {
  0: { icon: <CalendarOutlined />, color: 'blue', label: '预约提醒' },
  1: { icon: <ExclamationCircleOutlined />, color: 'red', label: '爽约提醒' },
  2: { icon: <DollarOutlined />, color: 'orange', label: '退款通知' },
  3: { icon: <HourglassOutlined />, color: 'purple', label: '候补通知' },
  4: { icon: <ShopOutlined />, color: 'orange', label: '关店通知' },
};

function ReminderPage() {
  const [allReminders, setAllReminders] = useState<ReminderDto[]>([]);
  const [unreadReminders, setUnreadReminders] = useState<ReminderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = 1;

  useEffect(() => {
    loadAll();
    loadUnread();
    loadUnreadCount();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await reminderApi.getByUser(userId, false);
      if (res.success && res.data) {
        setAllReminders(res.data);
      }
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUnread = async () => {
    try {
      const res = await reminderApi.getByUser(userId, true);
      if (res.success && res.data) {
        setUnreadReminders(res.data);
      }
    } catch (e: any) {
      // ignore
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await reminderApi.getUnreadCount(userId);
      if (res.success && res.data !== undefined) {
        setUnreadCount(res.data);
      }
    } catch (e: any) {
      // ignore
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await reminderApi.markAsRead(id);
      message.success('已标记为已读');
      loadAll();
      loadUnread();
      loadUnreadCount();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await reminderApi.markAllAsRead(userId);
      message.success('全部已标记为已读');
      loadAll();
      loadUnread();
      loadUnreadCount();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const renderList = (list: ReminderDto[], showUnreadOnly: boolean) => {
    if (list.length === 0) {
      return <Empty description={showUnreadOnly ? '暂无未读消息' : '暂无消息'} />;
    }

    return (
      <List
        dataSource={list}
        renderItem={(item) => {
          const config = typeConfig[item.type] || {
            icon: <BellOutlined />,
            color: 'default',
            label: '通知',
          };
          return (
            <List.Item
              style={{
                background: !item.isRead ? '#f6ffed' : '#fff',
                marginBottom: 8,
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #f0f0f0',
              }}
              actions={[
                !item.isRead && (
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkRead(item.id)}
                  >
                    标为已读
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: config.color, verticalAlign: 'middle' }}
                    icon={config.icon}
                  />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: 600 }}>{item.title}</span>
                    {!item.isRead && (
                      <Badge status="processing" text="未读" />
                    )}
                    <Tag color={config.color}>{config.label}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ marginBottom: 4, color: '#666' }}>{item.message}</p>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    );
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>
          消息中心
          <Badge
            count={unreadCount}
            style={{ marginLeft: 12 }}
            size="small"
          />
        </h2>
        <Button onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          全部标为已读
        </Button>
      </div>

      <Card>
        <Tabs defaultActiveKey="unread">
          <TabPane tab={`未读消息 (${unreadCount})`} key="unread">
            {renderList(unreadReminders, true)}
          </TabPane>
          <TabPane tab="全部消息" key="all">
            {renderList(allReminders, false)}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default ReminderPage;
