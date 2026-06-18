import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Space } from 'antd';
import {
  CalendarOutlined,
  ReadOutlined,
  HeartOutlined,
  HomeOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import request from '../../utils/request';
import {
  AppointmentOverviewData,
  ServiceRepurchaseData,
  FosterSafetyData,
} from '../../types';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AppointmentOverviewData>({
    todayAppointments: 0,
    trainingPets: 0,
    pendingAdoptions: 0,
    activeFosters: 0,
    monthlyRevenue: 0,
  });
  const [repurchaseData, setRepurchaseData] = useState<ServiceRepurchaseData[]>([]);
  const [fosterSafetyData, setFosterSafetyData] = useState<FosterSafetyData>({
    volunteerStats: [],
    negativeReviews: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewData, repurchaseData, fosterData] = await Promise.all([
        request.get<AppointmentOverviewData>('/statistics/appointment-overview'),
        request.get<ServiceRepurchaseData[]>('/statistics/service-repurchase'),
        request.get<FosterSafetyData>('/statistics/foster-safety'),
      ]);
      setOverview(overviewData || overview);
      setRepurchaseData(repurchaseData || []);
      setFosterSafetyData(fosterData || { volunteerStats: [], negativeReviews: [] });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const repurchaseChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['购买次数', '复购率(%)'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: repurchaseData.map((item) => item.serviceType),
    },
    yAxis: [
      {
        type: 'value',
        name: '购买次数',
        position: 'left',
      },
      {
        type: 'value',
        name: '复购率(%)',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
    ],
    series: [
      {
        name: '购买次数',
        type: 'bar',
        data: repurchaseData.map((item) => item.purchaseCount),
        itemStyle: { color: '#1890ff' },
        barWidth: '30%',
      },
      {
        name: '复购率(%)',
        type: 'bar',
        yAxisIndex: 1,
        data: repurchaseData.map((item) => (item.repurchaseRate * 100).toFixed(1)),
        itemStyle: { color: '#52c41a' },
        barWidth: '30%',
      },
    ],
  };

  const volunteerChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: fosterSafetyData.volunteerStats.map((item) => item.volunteerName),
      axisLabel: {
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value',
      name: '寄养数量',
    },
    series: [
      {
        type: 'bar',
        data: fosterSafetyData.volunteerStats.map((item) => item.fosterCount),
        itemStyle: { color: '#722ed1' },
        barWidth: '40%',
        label: {
          show: true,
          position: 'top',
        },
      },
    ],
  };

  const negativeReviewsChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: fosterSafetyData.negativeReviews.map((item) => ({
          value: item.count,
          name: item.reason,
        })),
      },
    ],
  };

  const statsCards = [
    {
      title: '今日预约',
      value: overview.todayAppointments,
      icon: <CalendarOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
    {
      title: '在训宠物',
      value: overview.trainingPets,
      icon: <ReadOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      color: '#f9f0ff',
    },
    {
      title: '待领养',
      value: overview.pendingAdoptions,
      icon: <HeartOutlined style={{ fontSize: 28, color: '#eb2f96' }} />,
      color: '#fff0f6',
    },
    {
      title: '寄养中',
      value: overview.activeFosters,
      icon: <HomeOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: '本月营收',
      value: overview.monthlyRevenue,
      prefix: '¥',
      icon: <DollarOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
      color: '#fff7e6',
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 0 }}>
          数据概览
        </Title>

        <Row gutter={16}>
          {statsCards.map((card, index) => (
            <Col span={Math.floor(24 / statsCards.length)} key={index}>
              <Card style={{ background: card.color, borderRadius: 8 }}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.prefix}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                  suffix={card.icon}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="服务复购统计" bordered={false} style={{ borderRadius: 8 }}>
          <ReactECharts option={repurchaseChartOption} style={{ height: 320 }} />
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="志愿者寄养数量统计" bordered={false} style={{ borderRadius: 8 }}>
              <ReactECharts option={volunteerChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="差评原因分布" bordered={false} style={{ borderRadius: 8 }}>
              <ReactECharts option={negativeReviewsChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>
      </Space>
    </Spin>
  );
};

export default Dashboard;
