import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Button, Space, Tag, Empty, message, Badge,
  Radio, Tooltip
} from 'antd';
import {
  BellOutlined, CheckOutlined, CheckCircleOutlined,
  CalendarOutlined, UserOutlined, MessageOutlined
} from '@ant-design/icons';
import { notificationsApi } from '../api';
import dayjs from 'dayjs';

const typeConfig: Record<string, { icon: any; color: string; text: string }> = {
  appointment_created: { icon: CalendarOutlined, color: 'blue', text: '新预约' },
  appointment_updated: { icon: CalendarOutlined, color: 'orange', text: '预约更新' },
  appointment_reminder: { icon: CalendarOutlined, color: 'red', text: '预约提醒' },
  feedback_received: { icon: MessageOutlined, color: 'green', text: '新评价' },
  review_result: { icon: UserOutlined, color: 'purple', text: '审核结果' },
  system: { icon: BellOutlined, color: 'default', text: '系统通知' },
};

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { data } = useQuery(
    ['notifications', filter, page, pageSize],
    () => notificationsApi.list({
      is_read: filter === 'unread' ? false : undefined,
      page,
      per_page: pageSize,
    })
  );

  const { data: unreadCount } = useQuery(
    'notifications-unread-count',
    () => notificationsApi.getUnreadCount()
  );

  const markReadMutation = useMutation(
    (id: number) => notificationsApi.markRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries('notifications-unread-count');
      },
    }
  );

  const markAllReadMutation = useMutation(
    () => notificationsApi.markAllRead(),
    {
      onSuccess: () => {
        message.success('已全部标记为已读');
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries('notifications-unread-count');
      },
    }
  );

  const handleItemClick = (item: any) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    if (item.related_type === 'appointment' && item.related_id) {
      navigate(`/appointments/${item.related_id}`);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const notifications = data?.data?.items || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">消息通知</h1>
        <Space>
          <Badge count={unreadCount?.data?.count || 0} size="small">
            <span className="text-gray-500">未读消息</span>
          </Badge>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleMarkAllRead}
            disabled={!unreadCount?.data?.count}
          >
            全部已读
          </Button>
        </Space>
      </div>

      <Card size="small">
        <Space className="mb-4">
          <Radio.Group value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <Radio.Button value="all">全部消息</Radio.Button>
            <Radio.Button value="unread">未读消息</Radio.Button>
          </Radio.Group>
        </Space>

        {notifications.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={notifications}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
            }}
            renderItem={(item: any) => {
              const config = typeConfig[item.type] || typeConfig.system;
              const Icon = config.icon;
              return (
                <List.Item
                  className={`cursor-pointer hover:bg-gray-50 ${!item.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleItemClick(item)}
                  actions={[
                    !item.is_read && (
                      <Tooltip title="标记已读">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(item.id);
                          }}
                        />
                      </Tooltip>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${config.color}-100`}>
                        <Icon className={`text-${config.color}-500`} />
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {!item.is_read && <Badge status="processing" />}
                        <Tag color={config.color}>{config.text}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <p className="text-gray-600 mb-1">{item.content}</p>
                        <p className="text-gray-400 text-xs">
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                        </p>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Notifications;
