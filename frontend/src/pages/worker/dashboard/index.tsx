import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, List, Tag, Button } from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getTodoStats, getTodoList } from '@/api'
import type { TodoItem, TodoType } from '@/types'

const todoTypeMap: Record<TodoType, { label: string; color: string }> = {
  event: { label: '事件处理', color: 'blue' },
  task: { label: '巡查任务', color: 'green' },
  review: { label: '整改复查', color: 'orange' },
  visit: { label: '随访回访', color: 'purple' }
}

const priorityMap = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'orange' },
  low: { label: '低', color: 'green' }
}

const WorkerDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 })
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, todosRes] = await Promise.all([
        getTodoStats(),
        getTodoList({ page: 1, pageSize: 5, status: 'pending' })
      ])
      setStats(statsRes.data)
      setTodos(todosRes.data.list)
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
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="紧急待办"
              value={todos.filter(t => t.priority === 'high').length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
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
                        <Tag color={todoTypeMap[item.type].color}>
                          {todoTypeMap[item.type].label}
                        </Tag>
                        <Tag color={priorityMap[item.priority].color}>
                          {priorityMap[item.priority].label}优先级
                        </Tag>
                        <span>{item.title}</span>
                      </div>
                    }
                    description={item.description}
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
