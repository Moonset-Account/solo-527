import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Space, Button, Select, Empty, Typography, Badge, Divider, Row, Col, Statistic } from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { notificationApi } from '../api/notification';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState({ total: 0, urgent: 0, normal: 0 });
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'urgent' | 'normal'>('all');

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
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
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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

  const getNotificationClass = (item: any) => {
    let cls = 'notification-item';
    if (item.type === 'urgent') cls += ' notification-urgent';
    else if (item.type === 'warning') cls += ' notification-warning';
    else cls += ' notification-info';
    
    if (!item.isRead) cls += ' notification-unread';
    else cls += ' notification-read';
    
    return cls;
  };

  const tabItems = [
    { key: 'all', label: '全部', count: total },
    { key: 'unread', label: '未读', count: unreadCount.total },
    { key: 'urgent', label: '紧急/提醒', count: unreadCount.urgent },
    { key: 'normal', label: '普通通知', count: unreadCount.normal },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>通知中心</Title>
        <Space>
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
              title="已读消息"
              value={total - unreadCount.total > 0 ? total - unreadCount.total : 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#999' }}
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

        <Space size="large" style={{ marginBottom: 16 }}>
          {tabItems.map((tab) => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? 'primary' : 'default'}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
              {tab.count > 0 && <Badge count={tab.count} size="small" style={{ marginLeft: 8 }} />}
            </Button>
          ))}
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        {notifications.length === 0 ? (
          <Empty description="暂无通知消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={notifications}
            loading={loading}
            renderItem={(item) => (
              <div
                key={item.id}
                className={getNotificationClass(item)}
                onClick={() => handleMarkAsRead(item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Space style={{ flex: 1 }}>
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
                  {!item.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', flexShrink: 0 }} />
                  )}
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
        )}
      </Card>
    </div>
  );
};

export default NotificationCenter;
