import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Typography, List, Progress } from 'antd'
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  CoffeeOutlined,
  FunnelPlotOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import dayjs from 'dayjs'

const { Title } = Typography

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data: any = await dashboardApi.getStats()
      setStats(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const coachData = stats.coachPerformance
    ? Object.entries(stats.coachPerformance).map(([name, count]) => ({
        name,
        课时: count as number,
      }))
    : []

  const lowSessionColumns = [
    {
      title: '会员姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '剩余课时',
      dataIndex: 'totalRemainingSessions',
      key: 'remaining',
      render: (val: number) => (
        <Tag color={val <= 3 ? 'red' : 'orange'}>{val} 节</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          FROZEN: 'orange',
          EXPIRED: 'red',
        }
        const labelMap: Record<string, string> = {
          ACTIVE: '正常',
          FROZEN: '已冻结',
          EXPIRED: '已过期',
        }
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
      },
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        数据看板
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="会员总数"
              value={stats.totalMembers || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="活跃会员"
              value={stats.activeMembers || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="冻结会员"
              value={stats.frozenMembers || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="活跃教练"
              value={stats.activeCoaches || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="今日预约"
              value={stats.todayBookings || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="今日完成"
              value={stats.todayCompleted || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="待确认预约"
              value={stats.pendingBookings || 0}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="有效课包数"
              value={stats.activePackages || 0}
              prefix={<CheckCircleOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="续费漏斗" loading={loading} extra={<FunnelPlotOutlined />}>
            <List
              size="small"
              dataSource={[
                { label: '总会员', value: stats.renewalFunnel?.totalMembers || 0, color: '#1890ff', percent: 100 },
                { label: '活跃会员', value: stats.renewalFunnel?.activeMembers || 0, color: '#52c41a', percent: 80 },
                { label: '课时不足(≤3)', value: stats.renewalFunnel?.lowSessionMembers || 0, color: '#faad14', percent: 50 },
                { label: '课时耗尽', value: stats.renewalFunnel?.zeroSessionMembers || 0, color: '#fa8c16', percent: 30 },
                { label: '已过期', value: stats.renewalFunnel?.expiredMembers || 0, color: '#f5222d', percent: 10 },
              ]}
              renderItem={(item: any) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item.label}</span>
                      <Tag color={item.color}>{item.value} 人</Tag>
                    </div>
                    <Progress percent={item.percent} showInfo={false} size="small" strokeColor={item.color} />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="超时事项" loading={loading} extra={<AlertOutlined style={{ color: '#f5222d' }} />}>
            <List
              size="small"
              dataSource={stats.overdueBookings || []}
              locale={{ emptyText: '暂无超时事项' }}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<AlertOutlined style={{ color: '#f5222d', fontSize: 20 }} />}
                    title={
                      <span>
                        {item.member?.name || '未知会员'} - {item.courseType === 'PERSONAL' ? '私教课' : '团课'}
                      </span>
                    }
                    description={
                      <span>
                        预约时间: {dayjs(item.startTime).format('MM-DD HH:mm')}
                        <Tag color="red" style={{ marginLeft: 8 }}>已超时</Tag>
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="资源空闲状态" loading={loading} extra={<CoffeeOutlined />}>
            <List
              size="small"
              dataSource={[
                { label: '在岗教练', value: stats.resourceStatus?.activeCoaches || 0, total: stats.resourceStatus?.totalCoaches || 0, unit: '人' },
                { label: '当前空闲教练', value: stats.resourceStatus?.availableCoachesNow || 0, total: stats.resourceStatus?.activeCoaches || 0, unit: '人' },
                { label: '进行中团课', value: stats.resourceStatus?.activeGroupClasses || 0, total: stats.resourceStatus?.totalGroupClasses || 0, unit: '节' },
              ]}
              renderItem={(item: any) => (
                <List.Item>
                  <span>{item.label}</span>
                  <Tag color="blue">
                    {item.value} / {item.total} {item.unit}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="本月教练课时统计" loading={loading}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coachData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="课时" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课时不足会员（≤3节）" loading={loading}>
            <Table
              columns={lowSessionColumns}
              dataSource={stats.membersLowOnSessions || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
