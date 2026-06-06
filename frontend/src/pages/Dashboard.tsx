import { Card, Row, Col, Statistic, Table, Tag, Space, DatePicker, Select, Button, Progress, message } from 'antd'
import {
  HomeOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { get, post } from '../api'
import type { DashboardStats, CleaningTask, MaintenanceOrder, PaginatedResponse } from '../types'

const { RangePicker } = DatePicker
const { Option } = Select

const statusColors: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  in_progress: 'processing',
  submitted: 'warning',
  inspecting: 'purple',
  approved: 'success',
  completed: 'success',
  rejected: 'error',
  cancelled: 'default',
}

const statusTexts: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  submitted: '待验收',
  inspecting: '验收中',
  approved: '已完成',
  completed: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
}

const priorityColors: Record<string, string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
}

const priorityTexts: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [overdueTasks, setOverdueTasks] = useState<CleaningTask[]>([])
  const [overdueOrders, setOverdueOrders] = useState<MaintenanceOrder[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, 'day'), dayjs()])
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await get<DashboardStats>('/dashboard/stats', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setStats(data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const fetchOverdue = async () => {
    try {
      const [tasksData, ordersData] = await Promise.all([
        get<PaginatedResponse<CleaningTask>>('/cleaning-tasks', {
          params: { is_overdue: 1, page_size: 10 },
        }),
        get<PaginatedResponse<MaintenanceOrder>>('/maintenance-orders', {
          params: { is_overdue: 1, page_size: 10 },
        }),
      ])
      setOverdueTasks(tasksData.data)
      setOverdueOrders(ordersData.data)
    } catch (e) {}
  }

  const handleCheckOverdue = async () => {
    try {
      await post('/tasks/check-overdue')
      message.success('超时检查完成')
      fetchStats()
      fetchOverdue()
    } catch (e) {}
  }

  useEffect(() => {
    fetchStats()
    fetchOverdue()
  }, [dateRange])

  const taskColumns = [
    { title: '任务编号', dataIndex: 'task_no', key: 'task_no', width: 140 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={statusColors[s]}>{statusTexts[s]}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p: string) => <Tag color={priorityColors[p]}>{priorityTexts[p]}</Tag> },
    { title: '截止时间', dataIndex: 'deadline_time', key: 'deadline_time', width: 160, render: (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '超时', dataIndex: 'is_overdue', key: 'is_overdue', width: 60, render: (v: number) => v ? <Tag color="red">是</Tag> : '-' },
  ]

  const orderColumns = [
    { title: '工单编号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={statusColors[s]}>{statusTexts[s]}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p: string) => <Tag color={priorityColors[p]}>{priorityTexts[p]}</Tag> },
    { title: '超时', dataIndex: 'is_overdue', key: 'is_overdue', width: 60, render: (v: number) => v ? <Tag color="red">是</Tag> : '-' },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker value={dateRange} onChange={(v) => v && setDateRange(v as [Dayjs, Dayjs])} />
        <Button icon={<ReloadOutlined />} onClick={fetchStats}>刷新</Button>
        <Button type="primary" icon={<WarningOutlined />} onClick={handleCheckOverdue}>检查超时</Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="保洁任务总数"
              value={stats?.total_cleaning_tasks || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成保洁"
              value={stats?.completed_cleaning_tasks || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="保洁超时"
              value={stats?.overdue_cleaning_tasks || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="保洁员利用率"
              value={stats?.cleaner_utilization || 0}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="维修工单总数"
              value={stats?.total_maintenance_orders || 0}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成维修"
              value={stats?.completed_maintenance_orders || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="维修超时"
              value={stats?.overdue_maintenance_orders || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总运营成本"
              value={stats?.total_cost || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="资源利用率" extra={<Tag color="blue">实时</Tag>}>
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span><TeamOutlined /> 保洁员利用率</span>
                  <span>{stats?.cleaner_utilization || 0}%</span>
                </div>
                <Progress percent={stats?.cleaner_utilization || 0} status="active" />
              </div>
              <div>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span><TeamOutlined /> 维修工利用率</span>
                  <span>{stats?.technician_utilization || 0}%</span>
                </div>
                <Progress percent={stats?.technician_utilization || 0} status="active" strokeColor="#fa8c16" />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block type="primary" size="large" href="#/cleaning-tasks">创建保洁任务</Button>
              <Button block size="large" href="#/maintenance-orders">创建维修工单</Button>
              <Button block size="large" href="#/calendar">查看房态日历</Button>
              <Button block size="large" href="#/reports">查看成本报表</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> 超时保洁任务</span>}>
            <Table
              columns={taskColumns}
              dataSource={overdueTasks}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> 超时维修工单</span>}>
            <Table
              columns={orderColumns}
              dataSource={overdueOrders}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
