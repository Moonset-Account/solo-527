
import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Progress, List, Typography } from 'antd'
import ReactECharts from 'echarts-for-react'
import { dashboard } from '../services/http'
import { DashboardStats, REG_STATUS_LABEL, TODO_STATUS_LABEL, TICKET_TYPE_LABEL, InventoryOccupancy, Registration, TodoItem } from '../types'
import dayjs from 'dayjs'
import {
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileExclamationOutlined,
  CalendarOutlined,
  ShopOutlined,
  SolutionOutlined,
  CloudFilled
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dashboard.stats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const inventoryOption = stats ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['已通过', '审核中', '资料缺失', '预留', '可用'] },
    grid: { left: 40, right: 20, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: stats.inventoryBySession.map(i => i.sessionName + ' ' + TICKET_TYPE_LABEL[i.ticketType]),
      axisLabel: { rotate: 30 }
    },
    yAxis: { type: 'value' },
    series: [
      { name: '已通过', type: 'bar', stack: 'total', data: stats.inventoryBySession.map(i => i.approvedOccupancy), itemStyle: { color: '#52c41a' } },
           { name: '审核中', type: 'bar', stack: 'total', data: stats.inventoryBySession.map(i => i.pendingReviewOccupancy), itemStyle: { color: '#1677ff' } },
      { name: '资料缺失', type: 'bar', stack: 'total', data: stats.inventoryBySession.map(i => i.missingDataOccupancy), itemStyle: { color: '#faad14' } },
      { name: '预留', type: 'bar', stack: 'total', data: stats.inventoryBySession.map(i => i.reservedOccupancy), itemStyle: { color: '#722ed1' } },
      { name: '可用', type: 'bar', stack: 'total', data: stats.inventoryBySession.map(i => i.availableCount), itemStyle: { color: '#f0f0f0' } }
    ]
  } : {}

  const statsCards = stats ? [
    { title: '总报名数', value: stats.totalRegistrations, icon: <TeamOutlined />, cls: 'primary', sub: '所有渠道提交' },
    { title: '待审核', value: stats.pendingReviewCount, icon: <ClockCircleOutlined />, cls: 'warning', sub: '需人工处理' },
    { title: '已通过', value: stats.approvedCount, icon: <CheckCircleOutlined />, cls: 'success', sub: '审核通过数' },
    { title: '资料缺失', value: stats.missingDataCount, icon: <WarningOutlined />, cls: 'danger', sub: '已同步到库存占用' },
    { title: '待办事项', value: stats.todoCount, icon: <FileExclamationOutlined />, cls: 'warning', sub: '待处理待办' },
    { title: '场次总数', value: stats.sessionsCount, icon: <CalendarOutlined />, cls: 'primary', sub: '含多分组赛程' },
    { title: '座位总数', value: stats.totalSeats, icon: <ShopOutlined />, cls: 'primary', sub: `上座率 ${stats.seatOccupancyRate}%` },
    { title: '接口失败', value: stats.failedApiCount, icon: <CloudFilled />, cls: 'danger', sub: '可进入重试导出' }
  ] : []

  return (
    <div className="page-container">
      <div className="stats-grid">
        {statsCards.map((c, i) => (
          <div key={i} className={`stat-card ${c.cls}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="label">{c.title}</div>
                <div className="value">{c.value}</div>
                <div className="sub">{c.sub}</div>
              </div>
              <div style={{ fontSize: 32, opacity: 0.3 }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="库存占用（按场次×票种）" loading={loading} style={{ marginBottom: 16 }}>
            <ReactECharts option={inventoryOption} style={{ height: 360 }} />
          </Card>
          <Card title="最近报名记录" loading={loading}>
            <Table<Registration>
              size="small" dataSource={stats?.recentRegistrations as any} rowKey="id" pagination={false}
              columns={[
                { title: '报名号', dataIndex: 'registrationNo', width: 160 },
                { title: '姓名', dataIndex: 'name', width: 100 },
                { title: '公司', dataIndex: 'company', ellipsis: true },
                { title: '场次', dataIndex: 'sessionName', width: 160 },
                { title: '数据质量', dataIndex: 'dataQualityScore', width: 100,
                  render: (score: number, r) => (
                    <span>
                      <Progress percent={score} size="small"
                        status={r.hasMissingData ? 'exception' : score >= 80 ? 'success' : 'normal'} />
                    </span>
                  ) },
                { title: '状态', dataIndex: 'status', width: 100,
                  render: (s: number) => <Tag color={(REG_STATUS_LABEL as any)[s].color}>{(REG_STATUS_LABEL as any)[s].text}</Tag> },
                { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => dayjs(v).format('MM-DD HH:mm') }
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="库存总览" loading={loading} style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={stats?.inventoryBySession.slice(0, 10) || []}
              renderItem={(item: InventoryOccupancy) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.sessionName} {TICKET_TYPE_LABEL[item.ticketType]}</Text>}
                    description={
                      <div>
                        <Progress percent={item.occupancyRate}
                          status={item.occupancyRate >= 90 ? 'exception' : item.occupancyRate >= 70 ? 'active' : 'normal'} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          已占 {item.occupiedTotal}/{item.totalCapacity}（缺失资料占 {item.missingDataOccupancy}）
                        </Text>
                      </div>
                    } />
                </List.Item>
              )} />
          </Card>
          <Card title="最近待办" loading={loading}>
            <List
              size="small"
              dataSource={stats?.recentTodos || []}
              renderItem={(item: TodoItem) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text>{item.title} <Tag color={(TODO_STATUS_LABEL as any)[item.status].color}>{(TODO_STATUS_LABEL as any)[item.status].text}</Tag></Text>}
                    description={
                      <div>
                        <Paragraph type="secondary" ellipsis style={{ fontSize: 12, margin: 0 }}>
                          {item.description}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                          {item.affectsInventory && <Tag color="orange" style={{ marginLeft: 8 }}>影响库存</Tag>}
                        </Text>
                      </div>
                    } />
                </List.Item>
              )} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
