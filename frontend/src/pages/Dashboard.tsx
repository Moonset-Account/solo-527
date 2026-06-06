import { Row, Col, Card, Table, Tag, DatePicker, Select, Statistic } from 'antd'
import { useQuery } from 'react-query'
import { dashboardApi } from '@/services/index'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts'
import dayjs from 'dayjs'
import type { PickupTrendItem, ClassUtilization, DashboardOverview } from '@/types'

const { RangePicker } = DatePicker

const Dashboard = () => {
  const [timeRange, setTimeRange] = React.useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [selectedClass, setSelectedClass] = React.useState<number | null>(null)

  const { data: overview, isLoading: overviewLoading } = useQuery(
    ['dashboard-overview'],
    () => dashboardApi.getOverview().then((res) => res.data as DashboardOverview)
  )

  const { data: trendData, isLoading: trendLoading } = useQuery(
    ['dashboard-pickup-trend', timeRange],
    () => dashboardApi.getPickupTrend(7).then((res) => res.data as PickupTrendItem[]),
    { refetchInterval: 60000 }
  )

  const { data: classUtilization, isLoading: utilLoading } = useQuery(
    ['dashboard-class-utilization'],
    () => dashboardApi.getClassUtilization().then((res) => res.data as ClassUtilization[])
  )

  const { data: statusBreakdown, isLoading: statusLoading } = useQuery(
    ['dashboard-status-breakdown'],
    () => dashboardApi.getStatusBreakdown().then((res) => res.data)
  )

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']

  const renderStatusPie = (data: any[]) => {
    const chartData = data?.map((item: any) => ({
      name: item.status,
      value: item.count
    })) || []
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const stats = [
    { label: '在园儿童', value: overview?.total_children || 0, color: '#1890ff' },
    { label: '今日入园', value: overview?.today_dropoff || 0, color: '#52c41a' },
    { label: '今日离园', value: overview?.today_pickup || 0, color: '#faad14' },
    { label: '待核验', value: overview?.pending_pickup || 0, color: '#ff4d4f' },
    { label: '今日请假', value: overview?.today_leave || 0, color: '#722ed1' },
    { label: '待审批', value: overview?.pending_leave || 0, color: '#eb2f96' },
  ]

  if (overview?.pending_payment !== undefined) {
    stats.push({ label: '待缴费', value: overview.pending_payment, color: '#13c2c2' })
    stats.push({ label: '已逾期', value: overview.overdue_payment || 0, color: '#f5222d' })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">数据看板</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select
            placeholder="选择班级"
            style={{ width: 160 }}
            allowClear
            onChange={(v) => setSelectedClass(v)}
          />
          <RangePicker
            value={timeRange}
            onChange={(v) => setTimeRange(v as any)}
          />
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, idx) => (
          <Col xs={12} sm={8} md={6} lg={4} key={idx}>
            <Card className="stat-card" bordered={false}>
              <div className="label">{stat.label}</div>
              <div className="value" style={{ color: stat.color }}>{stat.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="接送趋势" bordered={false} loading={trendLoading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format('MM-DD')} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dropoff" name="入园" stroke="#52c41a" strokeWidth={2} />
                <Line type="monotone" dataKey="pickup" name="离园" stroke="#faad14" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="班级资源利用率" bordered={false} loading={utilLoading}>
            <Table
              dataSource={classUtilization || []}
              pagination={false}
              size="small"
              columns={[
                { title: '班级', dataIndex: 'name' },
                { title: '在园/容量', render: (_, r) => `${r.current}/${r.capacity}` },
                {
                  title: '利用率',
                  render: (_, r) => (
                    <Tag color={r.utilization >= 90 ? 'red' : r.utilization >= 70 ? 'orange' : 'green'}>
                      {r.utilization}%
                    </Tag>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="接送状态分布" bordered={false} loading={statusLoading}>
            {renderStatusPie(statusBreakdown?.pickup_status || [])}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="请假状态分布" bordered={false} loading={statusLoading}>
            {renderStatusPie(statusBreakdown?.leave_status || [])}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="缴费状态分布" bordered={false} loading={statusLoading}>
            {renderStatusPie(statusBreakdown?.payment_status || [])}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
