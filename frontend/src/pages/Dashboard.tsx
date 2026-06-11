import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button, List, Typography } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { resumeApi } from '../api/resume';
import { notificationApi } from '../api/notification';
import { interviewApi } from '../api/interview';
import { recruitmentApi } from '../api/recruitment';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({ total: 0, byStatus: {}, todayNew: 0 });
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const loadData = async () => {
    try {
      if (user?.role !== 'candidate') {
        const statsRes = await resumeApi.getStats();
        if (statsRes.success) {
          setStats(statsRes.data);
        }

        const cyclesRes = await recruitmentApi.getCycles('active');
        if (cyclesRes.success) {
          setCycles(cyclesRes.data);
        }

        const interviewRes = await interviewApi.getInterviews({ pageSize: 5 });
        if (interviewRes.success) {
          setRecentInterviews(interviewRes.data.items);
        }
      }

      const notifRes = await notificationApi.getNotifications({ pageSize: 5 });
      if (notifRes.success) {
        setRecentNotifications(notifRes.data.items);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    submitted: { label: '已提交', color: 'blue' },
    screening: { label: '筛选中', color: 'orange' },
    written_test: { label: '笔试中', color: 'purple' },
    interview: { label: '面试中', color: 'cyan' },
    offer: { label: '已发Offer', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
    hired: { label: '已入职', color: 'success' },
  };

  const getChartOption = () => {
    const statuses = Object.keys(stats.byStatus);
    const values = Object.values(stats.byStatus);
    
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: '0', left: 'center' },
      series: [
        {
          name: '简历状态分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          data: statuses.map((s, i) => ({
            value: values[i],
            name: statusMap[s]?.label || s,
          })),
        },
      ],
    };
  };

  const notificationTypeMap: Record<string, string> = {
    urgent: 'red',
    warning: 'orange',
    info: 'blue',
  };

  if (user?.role === 'candidate') {
    return (
      <div>
        <div className="page-header">
          <Title level={3} style={{ margin: 0 }}>候选人工作台</Title>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="我的简历"
                value={0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="进行中"
                value={0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="已完成"
                value={0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={12}>
            <Card title="快捷操作" extra={<Button type="link" onClick={() => navigate('/resume/submit')}>立即投递</Button>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" block icon={<FileTextOutlined />} onClick={() => navigate('/resume/submit')}>
                  投递简历
                </Button>
                <Button block icon={<ClockCircleOutlined />} onClick={() => navigate('/resume/progress')}>
                  查看进度
                </Button>
                <Button block icon={<BellOutlined />} onClick={() => navigate('/notifications')}>
                  消息通知
                </Button>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="最新通知" extra={<Button type="link" onClick={() => navigate('/notifications')}>查看全部</Button>}>
              <List
                dataSource={recentNotifications}
                renderItem={(item: any) => (
                  <List.Item key={item.id} onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={notificationTypeMap[item.type]}>{item.type === 'urgent' ? '紧急' : item.type === 'warning' ? '提醒' : '通知'}</Tag>
                          {item.title}
                        </Space>
                      }
                      description={item.content}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>招聘管理工作台</Title>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="简历总数"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={stats.todayNew}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="面试中"
              value={stats.byStatus?.interview || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已录用"
              value={stats.byStatus?.hired || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="简历状态分布">
            <ReactECharts option={getChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="进行中的招聘周期">
            <List
              dataSource={cycles}
              renderItem={(cycle: any) => (
                <List.Item key={cycle.id}>
                  <List.Item.Meta
                    title={cycle.name}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {dayjs(cycle.startDate).format('YYYY-MM-DD')} ~ {dayjs(cycle.endDate).format('YYYY-MM-DD')}
                        </Text>
                        <Space>
                          <Tag color="blue">简历 {cycle.resumeCount}</Tag>
                          <Tag color="green">录用 {cycle.hireCount}</Tag>
                        </Space>
                      </Space>
                    }
                  />
                  <Button type="link" onClick={() => navigate('/recruitment-cycles')}>查看</Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="最近面试安排" extra={<Button type="link" onClick={() => navigate('/interviews')}>查看全部</Button>}>
            <List
              dataSource={recentInterviews}
              renderItem={(item: any) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.candidateName}</span>
                        <Tag color="blue">{item.position}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {item.scheduledTime ? dayjs(item.scheduledTime).format('YYYY-MM-DD HH:mm') : '待安排'}
                        </Text>
                        <Text type="secondary">面试官：{item.interviewerName || '待分配'}</Text>
                      </Space>
                    }
                  />
                  <Tag color={item.status === 'scheduled' ? 'blue' : 'green'}>
                    {item.status === 'scheduled' ? '已安排' : item.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最新通知" extra={<Button type="link" onClick={() => navigate('/notifications')}>查看全部</Button>}>
            <List
              dataSource={recentNotifications}
              renderItem={(item: any) => (
                <List.Item key={item.id} onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={notificationTypeMap[item.type]}>
                          {item.type === 'urgent' ? '紧急' : item.type === 'warning' ? '提醒' : '通知'}
                        </Tag>
                        {item.title}
                      </Space>
                    }
                    description={
                      <Text type="secondary" ellipsis={{ tooltip: item.content }}>
                        {item.content}
                      </Text>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.createdAt).fromNow()}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
