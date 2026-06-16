import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { getDashboardReport, getEventStatusReport } from '@/api'
import type { DashboardReport, EventStatusReportItem } from '@/types'

const statusLabelMap: Record<string, string> = {
  reported: '已上报',
  assigned: '已指派',
  processing: '处理中',
  reviewing: '待复查',
  following_up: '跟进中',
  closed: '已关闭',
  abnormal_closed: '异常关闭'
}

const statusColorMap: Record<string, string> = {
  reported: '#faad14',
  assigned: '#1677ff',
  processing: '#597ef7',
  reviewing: '#722ed1',
  following_up: '#13c2c2',
  closed: '#52c41a',
  abnormal_closed: '#ff4d4f'
}

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardReport>({
    TotalResidents: 0,
    TotalPatrolTasks: 0,
    CompletedPatrolTasks: 0,
    PendingPatrolTasks: 0,
    PendingTodos: 0
  })
  const [eventStatusData, setEventStatusData] = useState<EventStatusReportItem[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, eRes] = await Promise.all([
        getDashboardReport(),
        getEventStatusReport()
      ])
      setDashboard(dRes)
      setEventStatusData(eRes)
    } finally {
      setLoading(false)
    }
  }

  const eventPieOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}: {c}' },
        data: eventStatusData.map(s => ({
          name: statusLabelMap[s.status] || s.status,
          value: s.count,
          itemStyle: { color: statusColorMap[s.status] || '#999' }
        }))
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
          { value: dashboard.PendingPatrolTasks, name: '待处理', itemStyle: { color: '#faad14' } },
          { value: dashboard.CompletedPatrolTasks, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: dashboard.TotalPatrolTasks - dashboard.CompletedPatrolTasks - dashboard.PendingPatrolTasks, name: '进行中', itemStyle: { color: '#1677ff' } }
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
                title="居民总数"
                value={dashboard.TotalResidents}
                valueStyle={{ color: '#722ed1' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待办总数"
                value={dashboard.PendingTodos}
                prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理巡查"
                value={dashboard.PendingPatrolTasks}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已完成巡查"
                value={dashboard.CompletedPatrolTasks}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="事件状态分布" extra={<FileTextOutlined />}>
              <ReactECharts option={eventPieOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="巡查任务状态" extra={<SafetyOutlined />}>
              <ReactECharts option={taskOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default ManagerDashboard
