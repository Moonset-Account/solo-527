import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  DatePicker,
  message,
} from 'antd'
import {
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { coachPerformanceApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography

export default function CoachPerformance() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(dayjs())

  useEffect(() => {
    loadStats()
  }, [selectedMonth])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data: any = await coachPerformanceApi.getMyStats(
        selectedMonth.year(),
        selectedMonth.month() + 1
      )
      setStats(data)
    } catch (error) {
      console.error(error)
      message.error('加载业绩数据失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '会员',
      dataIndex: ['member', 'name'],
      key: 'member',
    },
    {
      title: '课程类型',
      dataIndex: 'courseType',
      key: 'courseType',
      render: (type: string) => (type === 'PERSONAL' ? '私教课' : '团课'),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          CONFIRMED: 'blue',
          COMPLETED: 'green',
          CANCELLED: 'default',
          ABSENT: 'red',
        }
        const labelMap: Record<string, string> = {
          PENDING: '待确认',
          CONFIRMED: '已确认',
          COMPLETED: '已完成',
          CANCELLED: '已取消',
          ABSENT: '未到课',
        }
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
      },
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          我的业绩
        </Title>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(date) => date && setSelectedMonth(date)}
        />
      </div>

      {stats && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="完成课时"
                  value={stats.completedSessions || 0}
                  suffix="节"
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="课时收入"
                  value={stats.sessionIncome || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="提成金额"
                  value={stats.commission || 0}
                  precision={2}
                  prefix="¥"
                  prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <Statistic
                  title="本月预计收入"
                  value={stats.totalIncome || 0}
                  precision={2}
                  prefix="¥"
                  prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="课程明细" loading={loading}>
            <Table
              columns={columns}
              dataSource={stats.bookings || []}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}
    </div>
  )
}
