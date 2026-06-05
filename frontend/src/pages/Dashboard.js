import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Empty } from 'antd';
import { reportsAPI } from '../services/api';
import dayjs from 'dayjs';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await reportsAPI.dashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    draft: 'default',
    confirmed: 'blue',
    cancelled: 'red',
    completed: 'green',
  };

  const statusLabels = {
    draft: '草稿',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <div className="stat-number">{stats?.today_screenings || 0}</div>
            <div className="stat-label">今日场次</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <div className="stat-number">{stats?.today_bookings || 0}</div>
            <div className="stat-label">今日报名</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <div className="stat-number">{stats?.today_checkins || 0}</div>
            <div className="stat-label">今日签到</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <div className="stat-number">{stats?.total_active_members || 0}</div>
            <div className="stat-label">有效会员</div>
          </Card>
        </Col>
      </Row>

      <Card title="即将开始的场次" loading={loading}>
        {stats?.upcoming_screenings?.length > 0 ? (
          <List
            dataSource={stats.upcoming_screenings}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Tag color={statusColors[item.status]} key="status">
                    {statusLabels[item.status]}
                  </Tag>,
                ]}
              >
                <List.Item.Meta
                  title={item.film?.title}
                  description={
                    <div>
                      <div>{dayjs(item.start_time).format('YYYY-MM-DD HH:mm')}</div>
                      <div>{item.hall?.name} · {item.confirmed_count}/{item.capacity}人</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无即将开始的场次" />
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
