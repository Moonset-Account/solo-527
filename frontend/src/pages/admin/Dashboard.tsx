import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space, Typography } from 'antd'
import {
  StockOutlined,
  ShoppingCartOutlined,
  ScissorOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { getInventoryList } from '@/api/inventory'
import { getOrderList } from '@/api/order'
import { getCleaningTaskList } from '@/api/cleaning'
import type { RoomInventory, TourOrder, CleaningTask } from '@/types'

const { Title } = Typography

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalInventory: 0,
    todayOrders: 0,
    pendingTasks: 0,
    lowStockItems: 0,
  })

  const [recentInventory, setRecentInventory] = useState<RoomInventory[]>([])
  const [recentOrders, setRecentOrders] = useState<TourOrder[]>([])
  const [todayTasks, setTodayTasks] = useState<CleaningTask[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [invRes, orderRes, taskRes] = await Promise.all([
        getInventoryList({ page: 0, size: 5 }),
        getOrderList({ page: 0, size: 5 }),
        getCleaningTaskList({ page: 0, size: 5 }),
      ])

      if (invRes.data.code === 200) {
        setRecentInventory(invRes.data.data.records)
        const lowStock = invRes.data.data.records.filter((i) => i.availableQuantity < 5).length
        setStats((s) => ({ ...s, totalInventory: invRes.data.data.total, lowStockItems: lowStock }))
      }

      if (orderRes.data.code === 200) {
        setRecentOrders(orderRes.data.data.records)
        setStats((s) => ({ ...s, todayOrders: orderRes.data.data.total }))
      }

      if (taskRes.data.code === 200) {
        setTodayTasks(taskRes.data.data.records)
        const pending = taskRes.data.data.records.filter((t) => t.taskStatus === 'PENDING').length
        setStats((s) => ({ ...s, pendingTasks: pending }))
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const inventoryColumns = [
    {
      title: '酒店',
      dataIndex: 'hotelName',
      key: 'hotelName',
    },
    {
      title: '房型',
      dataIndex: 'roomType',
      key: 'roomType',
    },
    {
      title: '日期',
      dataIndex: 'inventoryDate',
      key: 'inventoryDate',
    },
    {
      title: '可用库存',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      render: (val: number) => (
        <Tag color={val < 5 ? 'red' : val < 10 ? 'orange' : 'green'}>{val}</Tag>
      ),
    },
  ]

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => `¥${val}`,
    },
    {
      title: '状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          CONFIRMED: 'green',
          PENDING: 'orange',
          CANCELLED: 'red',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
  ]

  const taskColumns = [
    {
      title: '任务号',
      dataIndex: 'taskNo',
      key: 'taskNo',
    },
    {
      title: '房间',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: '类型',
      dataIndex: 'taskType',
      key: 'taskType',
    },
    {
      title: '状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          IN_PROGRESS: 'blue',
          COMPLETED: 'green',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
  ]

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>仪表盘</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总库存记录"
              value={stats.totalInventory}
              prefix={<StockOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.todayOrders}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理清洁任务"
              value={stats.pendingTasks}
              prefix={<ScissorOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="低库存预警"
              value={stats.lowStockItems}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="库存概览" extra={<a href="#/admin/inventory">查看全部</a>}>
            <Table
              dataSource={recentInventory}
              columns={inventoryColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近订单" extra={<a href="#/admin/orders">查看全部</a>}>
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="今日清洁任务" extra={<a href="#/admin/cleaning">查看全部</a>}>
            <Table
              dataSource={todayTasks}
              columns={taskColumns}
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

export default Dashboard
