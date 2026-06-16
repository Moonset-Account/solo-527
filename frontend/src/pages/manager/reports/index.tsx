import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  DatePicker,
  Select,
  Form,
  Spin,
  message
} from 'antd'
import {
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import {
  getEventStats,
  getTaskStats,
  getResidentStats,
  exportReport
} from '@/api'


const { RangePicker } = DatePicker

const Reports = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [eventStats, setEventStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    categoryStats: [] as { category: string; count: number }[],
    dailyStats: [] as { date: string; count: number }[]
  })
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    expired: 0
  })
  const [residentStats, setResidentStats] = useState({
    total: 0,
    local: 0,
    migrant: 0,
    special: 0,
    buildingStats: [] as { building: string; count: number }[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [eRes, tRes, rRes] = await Promise.all([
        getEventStats(),
        getTaskStats(),
        getResidentStats()
      ])
      setEventStats(eRes.data)
      setTaskStats(tRes.data)
      setResidentStats(rRes.data)
    } finally {
      setLoading(false)
    }
  }

  const categoryLabelMap: Record<string, string> = {
    environment: '环境卫生',
    security: '治安安全',
    facility: '设施损坏',
    civil: '民事纠纷',
    other: '其他'
  }

  const handleExport = async (type: string) => {
    setExporting(true)
    try {
      const values = form.getFieldsValue()
      await exportReport(type, values)
      message.success('导出成功')
    } finally {
      setExporting(false)
    }
  }

  const categoryPieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        label: { show: true, formatter: '{b}: {c} ({d}%)' },
        data: eventStats.categoryStats.map(s => ({
          name: categoryLabelMap[s.category] || s.category,
          value: s.count
        }))
      }
    ]
  }

  const eventTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: eventStats.dailyStats.map(s => s.date)
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '事件数量',
        data: eventStats.dailyStats.map(s => s.count),
        type: 'bar',
        itemStyle: { color: '#1677ff' },
        barWidth: '50%'
      }
    ]
  }

  const taskPieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: '60%',
        label: { formatter: '{b}: {c} ({d}%)' },
        data: [
          { value: taskStats.pending, name: '待开始', itemStyle: { color: '#faad14' } },
          { value: taskStats.inProgress, name: '进行中', itemStyle: { color: '#1677ff' } },
          { value: taskStats.completed, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: taskStats.expired, name: '已超时', itemStyle: { color: '#ff4d4f' } }
        ]
      }
    ]
  }

  const residentBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: residentStats.buildingStats.map(s => `${s.building}栋`) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '居民数量',
        type: 'bar',
        data: residentStats.buildingStats.map(s => s.count),
        itemStyle: { color: '#722ed1' },
        barWidth: '50%',
        label: { show: true, position: 'top' }
      }
    ]
  }

  const householdPieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: '60%',
        label: { formatter: '{b}: {c} ({d}%)' },
        data: [
          { value: residentStats.local, name: '本地户籍', itemStyle: { color: '#1677ff' } },
          { value: residentStats.migrant, name: '流动人口', itemStyle: { color: '#52c41a' } },
          { value: residentStats.special, name: '特殊人群', itemStyle: { color: '#ff4d4f' } }
        ]
      }
    ]
  }

  return (
    <Spin spinning={loading}>
      <div>
        <Card
          title="统计报表"
          extra={
            <Space>
              <Form form={form} layout="inline">
                <Form.Item name="dateRange">
                  <RangePicker />
                </Form.Item>
                <Form.Item name="type">
                  <Select
                    placeholder="报表类型"
                    allowClear
                    style={{ width: 150 }}
                    defaultValue="event"
                    options={[
                      { value: 'event', label: '事件报表' },
                      { value: 'task', label: '任务报表' },
                      { value: 'resident', label: '居民报表' }
                    ]}
                  />
                </Form.Item>
              </Form>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={() => handleExport('event')}
              >
                导出报表
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="事件总数"
                value={eventStats.total}
                prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="待处理事件"
                value={eventStats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="已完成事件"
                value={eventStats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="居民总数"
                value={residentStats.total}
                valueStyle={{ color: '#722ed1' }}
                prefix={<TeamOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Card title="事件类型分布统计">
              <ReactECharts option={categoryPieOption} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="每日事件上报趋势">
              <ReactECharts option={eventTrendOption} style={{ height: 320 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Card title="巡查任务状态统计" extra={<SafetyOutlined />}>
              <ReactECharts option={taskPieOption} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="居民人口构成统计">
              <ReactECharts option={householdPieOption} style={{ height: 320 }} />
            </Card>
          </Col>
        </Row>

        <Card title="各楼栋居民分布统计">
          <ReactECharts option={residentBarOption} style={{ height: 350 }} />
        </Card>
      </div>
    </Spin>
  )
}

export default Reports
