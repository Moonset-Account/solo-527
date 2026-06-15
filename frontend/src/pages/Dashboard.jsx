import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Tag, Badge, Avatar, Button, Spin } from 'antd';
import {
  CalendarOutlined,
  LoginOutlined,
  DollarOutlined,
  RiseOutlined,
  BellOutlined,
  WarningOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import dayjs from 'dayjs';
import { request } from '../api/client';
import { DASHBOARD, CONVERSION } from '../api/endpoints';
import { CONVERSION_STAGE_OPTIONS, CONVERSION_STAGE } from '../utils/constants';
import { formatMoney, formatNumber, formatThousand } from '../utils/format';

const PIE_COLORS = ['#1677ff', '#13c2c2', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#fa541c'];

const fetchDashboardData = () => request.get(DASHBOARD.DATA);

const fetchFunnelsByStage = (stage) => request.get(CONVERSION.FUNNELS, { stage });

const StatCards = ({ stats }) => {
  const items = [
    { title: '今日预约', value: stats?.today_bookings ?? 0, icon: <CalendarOutlined />, color: '#1677ff' },
    { title: '今日到店', value: stats?.today_arrivals ?? 0, icon: <LoginOutlined />, color: '#13c2c2' },
    { title: '今日营收', value: stats?.today_revenue ?? 0, icon: <DollarOutlined />, color: '#52c41a', isMoney: true },
    { title: '转化率', value: stats?.conversion_rate ?? 0, icon: <RiseOutlined />, color: '#722ed1', suffix: '%' },
    { title: '待处理提醒', value: stats?.pending_reminders ?? 0, icon: <BellOutlined />, color: '#faad14' },
    { title: '收银差异', value: stats?.cashier_discrepancy ?? 0, icon: <WarningOutlined />, color: '#ff4d4f', isMoney: true },
  ];

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} sm={12} lg={4} key={item.title}>
          <Card className="stat-card" bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={item.title}
              value={item.isMoney ? item.value : item.value}
              prefix={<span style={{ color: item.color, marginRight: 8 }}>{item.icon}</span>}
              suffix={item.suffix}
              formatter={(val) => (item.isMoney ? formatMoney(val) : formatNumber(val))}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

const RevenueTrendChart = ({ data }) => {
  const chartData = (data || []).map((item) => ({
    date: dayjs(item.date).format('MM-DD'),
    revenue: item.revenue ?? 0,
  }));

  return (
    <Card title="近7天营收趋势" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(v) => formatThousand(v)} />
          <Tooltip formatter={(value) => [formatMoney(value), '营收']} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1677ff"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

const ServiceStatusPie = ({ data }) => {
  const chartData = (data || []).map((item, idx) => ({
    name: item.name || item.status,
    value: item.count ?? item.value ?? 0,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  return (
    <Card title="服务状态分布" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

const PaymentMethodPie = ({ data }) => {
  const chartData = (data || []).map((item, idx) => ({
    name: item.label || item.name,
    value: item.count ?? item.value ?? 0,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  return (
    <Card title="支付方式分布" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

const TopServicesBar = ({ data }) => {
  const chartData = (data || []).map((item) => ({
    name: item.name || item.service_name,
    count: item.count ?? item.value ?? 0,
  }));

  return (
    <Card title="热门服务排行" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip formatter={(value) => [formatNumber(value), '服务次数']} />
          <Bar dataKey="count" fill="#1677ff" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

const FunnelKanban = () => {
  const { data: bookingData } = useQuery({
    queryKey: ['funnels', 'booking'],
    queryFn: () => fetchFunnelsByStage(CONVERSION_STAGE.BOOKING),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: arrivalData } = useQuery({
    queryKey: ['funnels', 'arrival'],
    queryFn: () => fetchFunnelsByStage(CONVERSION_STAGE.ARRIVAL),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: serviceData } = useQuery({
    queryKey: ['funnels', 'service'],
    queryFn: () => fetchFunnelsByStage(CONVERSION_STAGE.SERVICE),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: paymentData } = useQuery({
    queryKey: ['funnels', 'payment'],
    queryFn: () => fetchFunnelsByStage(CONVERSION_STAGE.PAYMENT),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: membershipData } = useQuery({
    queryKey: ['funnels', 'membership'],
    queryFn: () => fetchFunnelsByStage(CONVERSION_STAGE.MEMBERSHIP),
    refetchInterval: 5 * 60 * 1000,
  });

  const stages = [
    { key: CONVERSION_STAGE.BOOKING, data: bookingData?.results || bookingData || [] },
    { key: CONVERSION_STAGE.ARRIVAL, data: arrivalData?.results || arrivalData || [] },
    { key: CONVERSION_STAGE.SERVICE, data: serviceData?.results || serviceData || [] },
    { key: CONVERSION_STAGE.PAYMENT, data: paymentData?.results || paymentData || [] },
    { key: CONVERSION_STAGE.MEMBERSHIP, data: membershipData?.results || membershipData || [] },
  ];

  return (
    <Card title="转化漏斗看板" style={{ height: '100%' }}>
      <Row gutter={[12, 0]} style={{ overflowX: 'auto' }}>
        {stages.map((stage) => {
          const stageOption = CONVERSION_STAGE_OPTIONS.find((o) => o.value === stage.key);
          return (
            <Col span={Math.floor(24 / stages.length)} key={stage.key} style={{ minWidth: 180 }}>
              <div
                style={{
                  borderTop: `3px solid ${stageOption?.color === 'blue' ? '#1677ff' : stageOption?.color === 'cyan' ? '#13c2c2' : stageOption?.color === 'green' ? '#52c41a' : stageOption?.color === 'gold' ? '#faad14' : stageOption?.color === 'purple' ? '#722ed1' : '#1677ff'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Tag color={stageOption?.color}>{stageOption?.label}</Tag>
                  <Badge count={stage.data.length} style={{ backgroundColor: '#999' }} />
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {stage.data.length === 0 && (
                    <div style={{ color: '#bbb', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>暂无数据</div>
                  )}
                  {stage.data.map((item, idx) => (
                    <Card
                      key={item.id || idx}
                      size="small"
                      style={{ marginBottom: 8, borderRadius: 6 }}
                      bodyStyle={{ padding: '8px 12px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.customer_name || item.name || '-'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {item.service_name && <div>{item.service_name}</div>}
                        {item.phone && <div>{item.phone}</div>}
                        {item.booking_time && <div>{dayjs(item.booking_time).format('HH:mm')}</div>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

const Dashboard = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 5 * 60 * 1000,
  });

  const dashboardData = data?.results?.[0] || data?.data || data || {};

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">工作台</div>
          <div className="page-description">门店运营数据概览</div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
          刷新
        </Button>
      </div>

      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <StatCards stats={dashboardData.stats || dashboardData} />
          </Col>

          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <RevenueTrendChart data={dashboardData.revenue_trend || dashboardData.revenue_trends} />
              </Col>
              <Col xs={24} lg={6}>
                <ServiceStatusPie data={dashboardData.service_status || dashboardData.service_statuses} />
              </Col>
              <Col xs={24} lg={6}>
                <PaymentMethodPie data={dashboardData.payment_methods} />
              </Col>
            </Row>
          </Col>

          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <TopServicesBar data={dashboardData.top_services} />
              </Col>
              <Col xs={24} lg={12}>
                <FunnelKanban />
              </Col>
            </Row>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
