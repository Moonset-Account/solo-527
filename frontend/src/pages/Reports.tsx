import { Card, Row, Col, Statistic, Table, DatePicker, Select, Space, Button, message, Tag } from 'antd'
import { DollarOutlined, TeamOutlined, DownloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import api from '../api'
import type { CleanerPerformance } from '../types'

const { RangePicker } = DatePicker
const { Option } = Select

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()])
  const [cleanerPerformance, setCleanerPerformance] = useState<CleanerPerformance[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPerformance = async () => {
    setLoading(true)
    try {
      const res = await api.get<any, CleanerPerformance[]>('/reports/cleaner-performance', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setCleanerPerformance(res.data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformance()
  }, [dateRange])

  const handleExportCost = async () => {
    try {
      const url = `/api/reports/export/cost?start_date=${dateRange[0].format('YYYY-MM-DD')}&end_date=${dateRange[1].format('YYYY-MM-DD')}`
      window.open(url, '_blank')
      message.success('正在导出...')
    } catch (e) {}
  }

  const performanceColumns = [
    { title: '保洁员', dataIndex: 'cleaner_name', key: 'cleaner_name', width: 120 },
    { title: '总任务数', dataIndex: 'total_tasks', key: 'total_tasks', width: 100 },
    { title: '已完成', dataIndex: 'completed_tasks', key: 'completed_tasks', width: 100 },
    { title: '完成率', dataIndex: 'completion_rate', key: 'completion_rate', width: 100,
      render: (v: number) => <span>{v}%</span> },
    { title: '平均时长(小时)', dataIndex: 'avg_duration_hours', key: 'avg_duration_hours', width: 120 },
    { title: '超时次数', dataIndex: 'overdue_count', key: 'overdue_count', width: 100,
      render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : v },
    { title: '超时率', dataIndex: 'overdue_rate', key: 'overdue_rate', width: 100,
      render: (v: number) => v > 20 ? <Tag color="red">{v}%</Tag> : <span>{v}%</span> },
  ]

  const totalTasks = cleanerPerformance.reduce((sum, p) => sum + p.total_tasks, 0)
  const totalCompleted = cleanerPerformance.reduce((sum, p) => sum + p.completed_tasks, 0)
  const avgCompletionRate = cleanerPerformance.length > 0
    ? Math.round(cleanerPerformance.reduce((sum, p) => sum + p.completion_rate, 0) / cleanerPerformance.length)
    : 0

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 24 }}>
          <RangePicker value={dateRange} onChange={(v) => v && setDateRange(v)} />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCost}>
            导出成本报表
          </Button>
        </Space>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总任务数"
                value={totalTasks}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总完成数"
                value={totalCompleted}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="平均完成率"
                value={avgCompletionRate}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="保洁员绩效排行" style={{ marginTop: 24 }}>
          <Table
            columns={performanceColumns}
            dataSource={cleanerPerformance}
            rowKey="cleaner_id"
            loading={loading}
            pagination={false}
          />
        </Card>
      </Card>
    </div>
  )
}

export default Reports
