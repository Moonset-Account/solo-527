import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Tag, Space, Typography, Table } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, StarOutlined, BarChartOutlined } from '@ant-design/icons';
import { interviewApi } from '../api/interview';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const InterviewQuality: React.FC = () => {
  const [stats, setStats] = useState<any>({
    total: 0,
    completed: 0,
    avgScore: 0,
    scoreDistribution: {},
  });
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadInterviews();
  }, []);

  const loadStats = async () => {
    try {
      const res = await interviewApi.getQualityStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to load quality stats:', error);
    }
  };

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewApi.getInterviews({ status: 'completed', pageSize: 20 });
      if (res.success) {
        setInterviews(res.data.items);
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: '优秀', color: '#52c41a' };
    if (score >= 80) return { label: '良好', color: '#1677ff' };
    if (score >= 70) return { label: '中等', color: '#faad14' };
    if (score >= 60) return { label: '及格', color: '#fa8c16' };
    return { label: '不及格', color: '#ff4d4f' };
  };

  const distributionChart = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['0-59', '60-69', '70-79', '80-89', '90-100'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: [
          stats.scoreDistribution['0-59'] || 0,
          stats.scoreDistribution['60-69'] || 0,
          stats.scoreDistribution['70-79'] || 0,
          stats.scoreDistribution['80-89'] || 0,
          stats.scoreDistribution['90-100'] || 0,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const avgScorePercent = Math.min((stats.avgScore / 100) * 100, 100);

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 100,
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
    },
    {
      title: '面试官',
      dataIndex: 'interviewerName',
      key: 'interviewerName',
      width: 100,
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => {
        if (score === null || score === undefined) return '-';
        const level = getScoreLevel(score);
        return (
          <Space>
            <Progress
              type="circle"
              percent={score}
              size="small"
              strokeColor={level.color}
              format={(p) => `${p}`}
            />
            <Tag color={level.color}>{level.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: '完成时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>面试质量分析</Title>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="面试总数"
              value={stats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均分"
              value={stats.avgScore.toFixed(1)}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="/ 100"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="通过率"
              value={stats.total > 0 ? ((stats.scoreDistribution['60-69'] || 0) + (stats.scoreDistribution['70-79'] || 0) + (stats.scoreDistribution['80-89'] || 0) + (stats.scoreDistribution['90-100'] || 0)) / stats.total * 100 : 0}
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="分数段分布">
            <ReactECharts option={distributionChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="平均分概览">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Progress
                type="dashboard"
                percent={avgScorePercent}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                width={200}
                format={(p) => (
                  <span style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {stats.avgScore.toFixed(1)}
                  </span>
                )}
              />
              <p style={{ marginTop: 16, color: '#666' }}>综合平均得分</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="最近完成的面试" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
};

export default InterviewQuality;
