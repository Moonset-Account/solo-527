import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { getEventStats, getTaskStats, getResidentStats } from '@/api'

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(false)
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

  const categoryOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}: {c}' },
        data: eventStats.categoryStats.map(s => ({
          name: categoryLabelMap[s.category] || s.category,
          value: s.count
        }))
      }
    ]
  }

  const trendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: eventStats.dailyStats.map(s => s.date)
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: eventStats.dailyStats.map(s => s.count),
        type: 'line',
        smooth: true,
        areaStyle: {}
      }
    ]
  }

  const buildingOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: residentStats.buildingStats.map(s => `${s.building}栋`) },
    yAxis: { type: 'value' },
    series: [
      {
        data: residentStats.buildingStats.map(s => s.count),
        type: 'bar',
        itemStyle: { color: '#1677ff' }
      }
    ]
  }

  const taskOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: [
          { value: taskStats.pending, name: '待处理', itemStyle: { color: '#faad14' } },
          { value: taskStats.inProgress, name: '进行中', itemStyle: { color: '#1677ff' } },
          { value: taskStats.completed, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: taskStats.expired, name: '已超时', itemStyle: { color: '#ff4d4f' } }
        ],
        label: { formatter: '{b}: {c}' }
      }
    ]
  }

  return (
    <Spin spinning={loading}>
      <div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="事件总数"
                value={eventStats.total}
                prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理事件"
                value={eventStats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已完成事件"
                value={eventStats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="居民总数"
                value={residentStats.total}
                valueStyle={{ color: '#722ed1' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Card title="事件类型分布" extra={<EnvironmentOutlined />}>
              <ReactECharts option={categoryOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="近7日事件趋势">
              <ReactECharts option={trendOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="巡查任务状态" extra={<SafetyOutlined />}>
              <ReactECharts option={taskOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="各楼栋居民分布">
              <ReactECharts option={buildingOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="居民概况">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="本地户籍"
                    value={residentStats.local}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="流动人口"
                    value={residentStats.migrant}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="特殊人群"
                    value={residentStats.special}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="进行中任务"
                    value={taskStats.inProgress}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default ManagerDashboard
