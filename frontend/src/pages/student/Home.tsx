import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, List, Tag, Progress } from 'antd';
import { BookOutlined, TeamOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { learningApi, orderApi } from '@/api';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCourses: 0, completed: 0, learning: 0, totalHours: 0 });

  const loadData = async () => {
    const [myProgress, myOrders] = await Promise.all([
      learningApi.my(),
      orderApi.list({ pageNum: 1, pageSize: 5 }),
    ]);
    setProgress(myProgress || []);
    setOrders(myOrders?.records || []);
    const totalCourses = myProgress?.length || 0;
    const completed = myProgress?.filter((p: any) => p.status === 'COMPLETED').length || 0;
    const learning = myProgress?.filter((p: any) => p.status === 'IN_PROGRESS').length || 0;
    const totalHours = myProgress?.reduce((sum: number, p: any) => sum + (p.consumedHours || 0), 0) || 0;
    setStats({ totalCourses, completed, learning, totalHours });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <Title level={3}>欢迎回来</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="已购课程" value={stats.totalCourses} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="学习中" value={stats.learning} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={stats.completed} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计学时"
              value={stats.totalHours}
              suffix="小时"
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={14}>
          <Card title="继续学习" extra={<a onClick={() => navigate('/continue-study')}>查看全部</a>}>
            {progress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无学习中的课程，<a onClick={() => navigate('/purchase')}>去购买</a>
              </div>
            ) : (
              <List
                dataSource={progress.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <a key="continue" onClick={() => navigate('/continue-study')}>
                        继续学习
                      </a>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          课程 #{item.courseId}
                          <Tag
                            color={STATUS_MAP[item.status]?.color}
                            style={{ marginLeft: 8 }}
                          >
                            {STATUS_MAP[item.status]?.text}
                          </Tag>
                        </span>
                      }
                      description={
                        <div>
                          <Progress percent={Number(item.completionRate || 0)} style={{ margin: '8px 0' }} />
                          <span style={{ color: '#999' }}>
                            已学习 {item.consumedHours || 0} / {item.totalHours || 0} 小时 · 上次学习{' '}
                            {item.lastStudyAt ? dayjs(item.lastStudyAt).format('YYYY-MM-DD HH:mm') : '-'}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="最近订单">
            <List
              dataSource={orders}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={item.orderNo}
                    description={
                      <span>
                        ¥{item.finalAmount} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    }
                  />
                  <Tag color={STATUS_MAP[item.status]?.color}>{STATUS_MAP[item.status]?.text}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentHome;
