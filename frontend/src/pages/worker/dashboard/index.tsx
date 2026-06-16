import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, List, Tag, Button } from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getDashboardReport, getTodoList } from '@/api'
import type { TodoItem, TodoType, DashboardReport } from '@/types'

const todoTypeMap: Record<TodoType, { label: string; color: string }> = {
  event_process: { label: '事件处理', color: 'blue' },
  patrol: { label: '巡查任务', color: 'green' },
  review: { label: '整改复查', color: 'orange' },
  follow_up: { label: '随访回访', color: 'purple' }
}

const WorkerDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardReport>({
    TotalResidents: 0,
    TotalPatrolTasks: 0,
    CompletedPatrolTasks: 0,
    PendingPatrolTasks: 0,
    PendingTodos: 0
  })
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dashboardRes, todosRes] = await Promise.all([
        getDashboardReport(),
        getTodoList({ pageIndex: 1, pageSize: 5, isCompleted: false })
      ])
      setStats(dashboardRes)
      setTodos(todosRes.items)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待办总数"
              value={stats.PendingTodos}
              prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理巡查"
              value={stats.PendingPatrolTasks}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成巡查"
              value={stats.CompletedPatrolTasks}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="紧急待办"
              value={todos.filter(t => !t.isCompleted).length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="待办事项"
            extra={
              <Button type="link" onClick={() => navigate('/worker/todo-list')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              loading={loading}
              dataSource={todos}
              locale={{ emptyText: '暂无待办事项' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" key="handle">
                      处理
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={todoTypeMap[item.type]?.color || 'default'}>
                          {todoTypeMap[item.type]?.label || item.type}
                        </Tag>
                        <Tag color={item.isCompleted ? 'green' : 'orange'}>
                          {item.isCompleted ? '已完成' : '待处理'}
                        </Tag>
                        <span>{item.title}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default WorkerDashboard
