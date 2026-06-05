import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag } from 'antd';
import { UserSwitchOutlined, BellOutlined, FileProtectOutlined, PayCircleOutlined } from '@ant-design/icons';
import { getChildren } from '@/api/children';
import { getUnreadCount, getNotifications } from '@/api/notifications';
import { getLeaves } from '@/api/finance';
import { getPayments } from '@/api/finance';
import type { Notification } from '@/types';

export default function ParentDashboard() {
  const [childCount, setChildCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [pendingPayment, setPendingPayment] = useState('0');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const childrenRes = await getChildren({ is_active: true });
        setChildCount(childrenRes.count);
      } catch {}

      try {
        const unreadRes = await getUnreadCount();
        setUnreadCount(unreadRes.unread);
      } catch {}

      try {
        const leavesRes = await getLeaves({ status: 'pending' });
        setPendingLeave(leavesRes.count);
      } catch {}

      try {
        const paymentsRes = await getPayments({ status: 'pending' });
        const total = paymentsRes.results.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
        setPendingPayment(total.toFixed(2));
      } catch {}

      try {
        const notifRes = await getNotifications({ page_size: 5 });
        setNotifications(notifRes.results);
      } catch {}
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>家长仪表盘</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="我的孩子" value={childCount} prefix={<UserSwitchOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="未读通知" value={unreadCount} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="请假状态（待审批）" value={pendingLeave} prefix={<FileProtectOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待缴费" value={pendingPayment} prefix={<PayCircleOutlined />} suffix="元" />
          </Card>
        </Col>
      </Row>

      <Card title="最近通知" style={{ marginTop: 24 }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无通知</div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      {item.is_urgent && <Tag color="red" style={{ marginRight: 4 }}>紧急</Tag>}
                      {item.title}
                    </span>
                  }
                  description={item.content}
                />
                <div style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap' }}>
                  {item.created_at?.slice(0, 10)}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
