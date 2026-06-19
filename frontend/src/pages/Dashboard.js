import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Spin, message } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  SafetyOutlined,
  HeartOutlined,
  TodoOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { commonAPI, tasksAPI, topicsAPI, votingAPI } from '../services/api';
import { formatDateTime, getStatusBadge, getTaskTypeText } from '../utils/helpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentTopics, setRecentTopics] = useState([]);
  const [votingStats, setVotingStats] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tasksRes, topicsRes] = await Promise.all([
        commonAPI.getStatistics().catch(() => ({ data: {} })),
        tasksAPI.list({ page_size: 5 }).catch(() => ({ data: { results: [] } })),
        topicsAPI.list({ page_size: 5 }).catch(() => ({ data: { results: [] } })),
      ]);
      
      setStatistics(statsRes.data);
      setRecentTasks(tasksRes.data.results || []);
      setRecentTopics(topicsRes.data.results || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const statCards = [
    { title: '居民总数', value: statistics?.resident_count || 0, icon: <TeamOutlined />, color: '#1890ff', path: '/residents' },
    { title: '待处理议题', value: statistics?.pending_topics || 0, icon: <FileTextOutlined />, color: '#52c41a', path: '/topics' },
    { title: '进行中巡逻', value: statistics?.active_patrols || 0, icon: <SafetyOutlined />, color: '#fa8c16', path: '/patrol' },
    { title: '待帮扶需求', value: statistics?.pending_assistance || 0, icon: <HeartOutlined />, color: '#eb2f96', path: '/assistance' },
    { title: '待办任务', value: statistics?.pending_tasks || 0, icon: <TodoOutlined />, color: '#722ed1', path: '/tasks' },
    { title: '资格异常', value: statistics?.qualification_exceptions || 0, icon: <AlertOutlined />, color: '#f5222d', path: '/tasks?type=qualification_exception' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <Card 
              hoverable 
              onClick={() => navigate(stat.path)}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card">
                <div style={{ fontSize: 36, color: stat.color, marginBottom: 8 }}>
                  {stat.icon}
                </div>
                <div className="stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="stat-label">{stat.title}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近任务" extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}>
            <List
              dataSource={recentTasks}
              renderItem={(item) => (
                <List.Item 
                  key={item.id}
                  actions={[
                    <Tag className={`status-${item.status}`}>{getStatusBadge(item.status).text}</Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={<a onClick={() => navigate(`/tasks`)}>{item.title}</a>}
                    description={
                      <div>
                        <div>{getTaskTypeText(item.task_type)} · {formatDateTime(item.created_at)}</div>
                        {item.description && <div style={{ color: '#999' }}>{item.description.substring(0, 50)}...</div>}
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无任务' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="最近议题" extra={<a onClick={() => navigate('/topics')}>查看全部</a>}>
            <List
              dataSource={recentTopics}
              renderItem={(item) => (
                <List.Item 
                  key={item.id}
                  actions={[
                    <Tag className={`status-${item.status}`}>{getStatusBadge(item.status).text}</Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={<a onClick={() => navigate(`/topics/${item.id}`)}>{item.title}</a>}
                    description={
                      <div>
                        <div>{item.author_name || item.author?.username || '未知'} · {formatDateTime(item.created_at)}</div>
                        {item.description && <div style={{ color: '#999' }}>{item.description.substring(0, 50)}...</div>}
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无议题' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
