import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Empty, Space, Badge } from 'antd';
import { CheckCircleOutlined, CheckSquareOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { NotificationDto } from '../../types';
import { message } from 'antd';

export default function StudentNotifications() {
  const [data, setData] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadData = (only = false) => {
    setLoading(true);
    setUnreadOnly(only);
    api.notifications.list(only).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRead = (id: number) => {
    api.notifications.markRead(id).then(() => {
      message.success('已标记为已读');
      loadData(unreadOnly);
    });
  };

  const handleMarkAllRead = () => {
    api.notifications.markAllRead().then(() => {
      message.success('全部已标记为已读');
      loadData(unreadOnly);
    });
  };

  const typeColor: Record<string, string> = {
    ScheduleChange: 'blue', HoursInsufficient: 'red', WorkFeedback: 'green',
    LeaveApproved: 'green', LeaveRejected: 'red', HomeFeedback: 'orange', SystemNotice: 'purple'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>消息通知</div>
        <Space>
          <Button onClick={() => loadData(!unreadOnly)}>
            {unreadOnly ? '显示全部' : '仅看未读'}
          </Button>
          <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleMarkAllRead}>
            全部标为已读
          </Button>
        </Space>
      </div>
      {data.length === 0 && !loading ? (
        <Empty description={unreadOnly ? '暂无未读消息' : '暂无消息通知'} />
      ) : (
        <Card className="card-shadow">
          <List
            loading={loading}
            dataSource={data}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  !item.isRead && (
                    <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleMarkRead(item.id)}>
                      标为已读
                    </Button>
                  )
                ]}
              >
                <Badge dot={!item.isRead} offset={[2, 4]}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={typeColor[item.type] || 'default'}>{item.type}</Tag>
                        <strong>{item.title}</strong>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>{item.content}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {item.fromUserName ? `来自: ${item.fromUserName} · ` : ''}
                          {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    }
                  />
                </Badge>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
