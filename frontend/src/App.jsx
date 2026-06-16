import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge, Space } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
  RefundOutlined,
  FileTextOutlined,
  TodoOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import Login from './pages/Login.jsx'
import EventList from './pages/EventList.jsx'
import EventDetail from './pages/EventDetail.jsx'
import OrderList from './pages/OrderList.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import BuyTickets from './pages/BuyTickets.jsx'
import CheckIn from './pages/CheckIn.jsx'
import RefundList from './pages/RefundList.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Review from './pages/Review.jsx'
import TodoList from './pages/TodoList.jsx'
import NotificationList from './pages/NotificationList.jsx'
import { notificationAPI, todoAPI } from './services/api.js'

const { Header, Sider, Content } = Layout

function App() {
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [todoStats, setTodoStats] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      setUser(JSON.parse(userStr))
      loadCounts()
      const timer = setInterval(loadCounts, 30000)
      return () => clearInterval(timer)
    }
  }, [])

  const loadCounts = async () => {
    try {
      const [unread, stats] = await Promise.all([
        notificationAPI.getUnreadCount(),
        todoAPI.getStats()
      ])
      setUnreadCount(unread)
      setTodoStats(stats)
    } catch (e) {}
  }

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    loadCounts()
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const getMenuItems = () => {
    const organizerItems = [
      { key: '/events', icon: <ShopOutlined />, label: '活动列表' },
      { key: '/orders', icon: <OrderedListOutlined />, label: '我的订单' },
      { key: '/todos', icon: <TodoOutlined />, label: '待办事项' }
    ]

    const internalItems = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '数据总览' },
      { key: '/events', icon: <ShopOutlined />, label: '活动管理' },
      { key: '/orders', icon: <OrderedListOutlined />, label: '订单管理' },
      { key: '/checkin', icon: <CheckCircleOutlined />, label: '核销签到' },
      { key: '/refunds', icon: <RefundOutlined />, label: '退票管理' },
      { key: '/review', icon: <BarChartOutlined />, label: '业务复盘' },
      { key: '/todos', icon: <TodoOutlined />, label: '待办事项' }
    ]

    if (user?.role === 'ORGANIZER') {
      return organizerItems
    }
    return internalItems
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout className="app-layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">🎵 演出看板</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            音乐演出活动复盘看板
          </div>
          <Space size="large">
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 20, cursor: 'pointer' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Badge count={todoStats?.pending || 0} size="small" color="orange">
              <TodoOutlined
                style={{ fontSize: 20, cursor: 'pointer' }}
                onClick={() => navigate('/todos')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 0 }}>
          <Routes>
            <Route path="/" element={<Navigate to={user.role === 'ORGANIZER' ? '/events' : '/dashboard'} replace />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/buy" element={<BuyTickets />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/refunds" element={<RefundList />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/review" element={<Review />} />
            <Route path="/todos" element={<TodoList onRefresh={loadCounts} />} />
            <Route path="/notifications" element={<NotificationList onRefresh={loadCounts} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
