
import { Card, Row, Col, Statistic, List, Tag, Table } from 'antd'
import { CalendarOutlined, DollarOutlined, TeamOutlined, WarningOutlined, BellOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { dashboardStats, revenueTrendData, memberGrowthData, treatmentSalesData, recentReminders, stockAlertList } from './mockData'

const Dashboard = () => {
  const revenueOption = {
    title: { text: '营收趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 'normal' } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['营收', '预约数'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: revenueTrendData.dates,
    },
    yAxis: [
      { type: 'value', name: '营收(元)' },
      { type: 'value', name: '预约数' },
    ],
    series: [
      {
        name: '营收',
        type: 'line',
        smooth: true,
        data: revenueTrendData.revenue,
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '预约数',
        type: 'bar',
        yAxisIndex: 1,
        data: revenueTrendData.appointments,
        itemStyle: { color: '#52c41a' },
      },
    ],
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
  }

  const memberGrowthOption = {
    title: { text: '会员增长', left: 'center', textStyle: { fontSize: 14, fontWeight: 'normal' } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增会员', '会员总数'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: memberGrowthData.months,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新增会员',
        type: 'bar',
        data: memberGrowthData.newMembers,
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '会员总数',
        type: 'line',
        smooth: true,
        data: memberGrowthData.totalMembers,
        itemStyle: { color: '#722ed1' },
      },
    ],
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
  }

  const treatmentSalesOption = {
    title: { text: '疗程销量排行', left: 'center', textStyle: { fontSize: 14, fontWeight: 'normal' } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}次' },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: treatmentSalesData.map(item => item.name).reverse(),
    },
    series: [
      {
        type: 'bar',
        data: treatmentSalesData.map(item => item.value).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#91d5ff' },
              { offset: 1, color: '#1890ff' },
            ],
          },
        },
        label: { show: true, position: 'right' },
      },
    ],
    grid: { left: 80, right: 40, top: 40, bottom: 20 },
  }

  const getLevelTag = (level) => {
    const colorMap = {
      urgent: 'red',
      warning: 'orange',
      normal: 'blue',
    }
    const textMap = {
      urgent: '紧急',
      warning: '警告',
      normal: '普通',
    }
    return <Tag color={colorMap[level]}>{textMap[level]}</Tag>
  }

  const stockColumns = [
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (text, record) => (
        <span style={{ color: text < record.minStock ? '#ff4d4f' : 'inherit' }}>
          {text} {record.unit}
        </span>
      ),
    },
    { title: '最低库存', dataIndex: 'minStock', key: 'minStock', render: (text, record) => `${text} ${record.unit}` },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>数据看板</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日预约"
              value={dashboardStats.todayAppointments}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月营收"
              value={dashboardStats.monthlyRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="会员总数"
              value={dashboardStats.totalMembers}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存预警"
              value={dashboardStats.stockAlerts}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card>
            <ReactECharts option={revenueOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <span>
                <BellOutlined style={{ marginRight: 8 }} />
                最近提醒
              </span>
            }
          >
            <List
              dataSource={recentReminders}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <span>
                        {getLevelTag(item.level)}
                        {item.type}
                      </span>
                    }
                    description={item.content}
                  />
                  <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <ReactECharts option={memberGrowthOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={treatmentSalesOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="库存预警" style={{ marginTop: 16 }}>
        <Table
          dataSource={stockAlertList}
          columns={stockColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default Dashboard
