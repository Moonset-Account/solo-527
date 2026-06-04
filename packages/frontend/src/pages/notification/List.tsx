import { useState } from 'react';
import {
  List,
  Card,
  Typography,
  Space,
  Button,
  Tag,
  Select,
  Badge,
  Empty,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { Notification, NotificationType } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const typeIcons: Record<NotificationType, React.ReactNode> = {
  [NotificationType.SYSTEM]: <BellOutlined />,
  [NotificationType.QUOTE_APPROVAL]: <FileTextOutlined />,
  [NotificationType.CONTRACT_APPROVAL]: <FileTextOutlined />,
  [NotificationType.REQUIREMENT_ASSIGNED]: <UserOutlined />,
  [NotificationType.STATUS_CHANGE]: <CheckCircleOutlined />,
  [NotificationType.PROFIT_WARNING]: <ExclamationCircleOutlined />,
  [NotificationType.TASK_REMINDER]: <DollarOutlined />,
};

const typeColors: Record<NotificationType, string> = {
  [NotificationType.SYSTEM]: 'default',
  [NotificationType.QUOTE_APPROVAL]: 'orange',
  [NotificationType.CONTRACT_APPROVAL]: 'blue',
  [NotificationType.REQUIREMENT_ASSIGNED]: 'cyan',
  [NotificationType.STATUS_CHANGE]: 'green',
  [NotificationType.PROFIT_WARNING]: 'red',
  [NotificationType.TASK_REMINDER]: 'purple',
};

const typeText: Record<NotificationType, string> = {
  [NotificationType.SYSTEM]: '系统通知',
  [NotificationType.QUOTE_APPROVAL]: '报价审批',
  [NotificationType.CONTRACT_APPROVAL]: '合同审批',
  [NotificationType.REQUIREMENT_ASSIGNED]: '需求分配',
  [NotificationType.STATUS_CHANGE]: '状态变更',
  [NotificationType.PROFIT_WARNING]: '利润预警',
  [NotificationType.TASK_REMINDER]: '任务提醒',
};

export default function NotificationList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    isRead: undefined as boolean | undefined,
    type: undefined as NotificationType | undefined,
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useQuery(
    ['notifications', filters],
    () => notificationService.getAll(filters),
    { keepPreviousData: true }
  );

  const markAsReadMutation = useMutation((id: string) => notificationService.markAsRead(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
    },
  });

  const markAllAsReadMutation = useMutation(() => notificationService.markAllAsRead(), {
    onSuccess: () => {
      message.success('已全部标记为已读');
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.relatedData) {
      const { quoteId, contractId, requirementId } = notification.relatedData;
      if (quoteId) navigate(`/quotes/${quoteId}`);
      else if (contractId) navigate(`/contracts/${contractId}`);
      else if (requirementId) navigate(`/requirements/${requirementId}`);
    }
  };

  const notifications = data?.data?.data || [];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            消息通知
          </Title>
          <Button
            icon={<CheckSquareOutlined />}
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={!notifications.some((n: Notification) => !n.isRead)}
          >
            全部已读
          </Button>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="已读状态"
            style={{ width: 120 }}
            value={filters.isRead === undefined ? undefined : filters.isRead ? 'read' : 'unread'}
            onChange={(value) =>
              setFilters({
                ...filters,
                isRead: value === undefined ? undefined : value === 'read',
                page: 1,
              })
            }
            allowClear
          >
            <Option value="unread">未读</Option>
            <Option value="read">已读</Option>
          </Select>
          <Select
            placeholder="消息类型"
            style={{ width: 130 }}
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value, page: 1 })}
            allowClear
          >
            {Object.entries(typeText).map(([key, value]) => (
              <Option key={key} value={key}>
                {value}
              </Option>
            ))}
          </Select>
          <Button
            onClick={() =>
              setFilters({ isRead: undefined, type: undefined, page: 1, limit: 20 })
            }
          >
            重置
          </Button>
        </Space>

        <List
          itemLayout="horizontal"
          dataSource={notifications}
          loading={isLoading}
          locale={{
            emptyText: <Empty description="暂无消息" />,
          }}
          renderItem={(item: Notification) => (
            <List.Item
              style={{
                cursor: 'pointer',
                background: item.isRead ? '#fff' : '#f6ffed',
                borderRadius: 8,
                marginBottom: 8,
                padding: '12px 16px',
              }}
              onClick={() => handleNotificationClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!item.isRead} offset={[5, 5]}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        background: item.isRead ? '#f0f0f0' : '#e6f7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.isRead ? '#bfbfbf' : '#1890ff',
                      }}
                    >
                      {typeIcons[item.type]}
                    </div>
                  </Badge>
                }
                title={
                  <Space>
                    <span style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.title}</span>
                    <Tag color={typeColors[item.type]} size="small">
                      {typeText[item.type]}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4, color: '#666' }}>{item.content}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                }
              />
              {!item.isRead && (
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsReadMutation.mutate(item.id);
                  }}
                >
                  标记已读
                </Button>
              )}
            </List.Item>
          )}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: data?.data?.total || 0,
            showSizeChanger: true,
            onChange: (page, pageSize) => setFilters({ ...filters, page, limit: pageSize }),
          }}
        />
      </Card>
    </div>
  );
}
