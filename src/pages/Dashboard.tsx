import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Space, Button } from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi, alertsApi } from '@/api';
import type { DashboardStats, TrendDataPoint, DeviceAlert } from '../../shared/types';
import { StatusTag } from '@/components/StatusTag';
import { DurationText } from '@/components/DurationText';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<DeviceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, trendsData, alertsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTrends(7),
        alertsApi.getList({ status: 'PENDING', pageSize: 5 }),
      ]);
      setStats(statsData);
      setTrends(trendsData);
      setPendingAlerts(alertsData.data);
    } catch (error) {
      console.error('Load dashboard data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const alertChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['告警数量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trends.map((t) => t.date),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '告警数量',
        type: 'line',
        smooth: true,
        data: trends.map((t) => t.alerts),
        lineStyle: { color: '#f5222d', width: 3 },
        itemStyle: { color: '#f5222d' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 34, 45, 0.3)' },
              { offset: 1, color: 'rgba(245, 34, 45, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  const revenueChartOption = {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>收益: ¥{c}' },
    legend: { data: ['储能收益'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trends.map((t) => t.date),
    },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        name: '储能收益',
        type: 'bar',
        data: trends.map((t) => t.revenue),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#096dd9' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const statCards = stats
    ? [
        {
          title: '告警总数',
          value: stats.totalAlerts,
          icon: <AlertOutlined style={{ color: '#f5222d', fontSize: 28 }} />,
          color: '#fff1f0',
          borderColor: '#ffa39e',
        },
        {
          title: '待处理',
          value: stats.pendingAlerts,
          icon: <WarningOutlined style={{ color: '#faad14', fontSize: 28 }} />,
          color: '#fff7e6',
          borderColor: '#ffd591',
          trend: stats.pendingAlerts > 0 ? 'up' : 'down',
        },
        {
          title: '处理中',
          value: stats.processingAlerts,
          icon: <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 28 }} />,
          color: '#e6f7ff',
          borderColor: '#91d5ff',
        },
        {
          title: '处理完成率',
          value: `${stats.alertProcessingRate}%`,
          icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 28 }} />,
          color: '#f6ffed',
          borderColor: '#b7eb8f',
        },
        {
          title: '今日收益',
          value: `¥${stats.todayRevenue.toLocaleString()}`,
          icon: <DollarOutlined style={{ color: '#722ed1', fontSize: 28 }} />,
          color: '#f9f0ff',
          borderColor: '#d3adf7',
        },
        {
          title: '运行策略',
          value: stats.activeStrategies,
          icon: <PlayCircleOutlined style={{ color: '#13c2c2', fontSize: 28 }} />,
          color: '#e6fffb',
          borderColor: '#87e8de',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Title level={3} style={{ margin: 0 }}>
          运营总览
        </Title>
        <Text type="secondary">实时监控电站运营状态和关键指标</Text>
      </div>

      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <Card
              loading={loading}
              style={{
                background: card.color,
                borderLeft: `4px solid ${card.borderColor}`,
                borderRadius: 8,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px 16px' }}
            >
              <Space align="center" size={16}>
                <div>{card.icon}</div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {card.title}
                  </Text>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#262626',
                      marginTop: 4,
                    }}
                  >
                    {card.value}
                  </div>
                  {card.trend && (
                    <div style={{ marginTop: 4 }}>
                      {card.trend === 'up' ? (
                        <Text type="danger" style={{ fontSize: 12 }}>
                          <ArrowUpOutlined /> 需要关注
                        </Text>
                      ) : (
                        <Text type="success" style={{ fontSize: 12 }}>
                          <ArrowDownOutlined /> 情况良好
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#f5222d' }} />
                <span>告警趋势（近7天）</span>
              </Space>
            }
            loading={loading}
          >
            <ReactECharts option={alertChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
                <span>储能收益趋势（近7天）</span>
              </Space>
            }
            loading={loading}
          >
            <ReactECharts option={revenueChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>待处理告警</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/alerts?status=PENDING')}>
                查看全部
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={pendingAlerts}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => navigate(`/alerts/${item.id}`)}
                    >
                      处理
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <StatusTag type="alertLevel" value={item.alertLevel} />
                        <span style={{ fontSize: 14, color: '#262626' }}>
                          {item.title}
                        </span>
                      </Space>
                    }
                    description={
                      <Space size={16} style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.deviceName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无待处理告警' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#52c41a' }} />
                <span>快速统计</span>
              </Space>
            }
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="累计收益"
                  value={stats?.totalRevenue || 0}
                  prefix="¥"
                  formatter={(value) => (
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      {Number(value).toLocaleString()}
                    </span>
                  )}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="异常关闭"
                  value={stats?.abnormalClosedAlerts || 0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="设备在线率"
                  value={stats?.onlineDeviceRate || 0}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="平均响应时长"
                  formatter={() => (
                    <DurationText seconds={stats ? 1800 : undefined} />
                  )}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
