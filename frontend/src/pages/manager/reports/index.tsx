import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Spin,
  message
} from 'antd'
import {
  DownloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import {
  getDashboardReport,
  getEventStatusReport,
  getClosureReport,
  exportResidents
} from '@/api'
import type { DashboardReport, EventStatusReportItem, ClosureReport } from '@/types'

const statusLabelMap: Record<string, string> = {
  reported: '已上报',
  assigned: '已指派',
  processing: '处理中',
  reviewing: '待复查',
  following_up: '跟进中',
  closed: '已关闭',
  abnormal_closed: '异常关闭'
}

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardReport>({
    TotalResidents: 0,
    TotalPatrolTasks: 0,
    CompletedPatrolTasks: 0,
    PendingPatrolTasks: 0,
    PendingTodos: 0
  })
  const [eventStatusData, setEventStatusData] = useState<EventStatusReportItem[]>([])
  const [closureReport, setClosureReport] = useState<ClosureReport>({
    pendingVisitCount: 0,
    pendingVisitRate: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, eRes, cRes] = await Promise.all([
        getDashboardReport(),
        getEventStatusReport(),
        getClosureReport()
      ])
      setDashboard(dRes)
      setEventStatusData(eRes)
      setClosureReport(cRes)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportResidents()
      message.success('导出成功')
    } finally {
      setExporting(false)
    }
  }

  const eventPieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        label: { show: true, formatter: '{b}: {c} ({d}%)' },
        data: eventStatusData.map(s => ({
          name: statusLabelMap[s.status] || s.status,
          value: s.count
        }))
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
          { value: dashboard.PendingPatrolTasks, name: '待处理', itemStyle: { color: '#faad14' } },
          { value: dashboard.CompletedPatrolTasks, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: dashboard.TotalPatrolTasks - dashboard.CompletedPatrolTasks - dashboard.PendingPatrolTasks, name: '进行中', itemStyle: { color: '#1677ff' } }
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
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={handleExport}
              >
                导出居民数据
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="居民总数"
                value={dashboard.TotalResidents}
                valueStyle={{ color: '#722ed1' }}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="待办总数"
                value={dashboard.PendingTodos}
                prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="待回访数"
                value={closureReport.pendingVisitCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="待回访率"
                value={closureReport.pendingVisitRate}
                suffix="%"
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Card title="事件状态分布统计">
              <ReactECharts option={eventPieOption} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="巡查任务状态统计">
              <ReactECharts option={taskPieOption} style={{ height: 320 }} />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default Reports
