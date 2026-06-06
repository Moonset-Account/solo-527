import { Layout, Menu, Avatar, Dropdown, Badge, Space } from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  HomeOutlined,
  ToolOutlined,
  WrenchOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useState, useEffect } from 'react'
import { get } from '../api'
import type { Notification, PaginatedResponse } from '../types'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = async () => {
    try {
      const data = await get<PaginatedResponse<Notification>>('/notifications', { params: { is_read: 0, page_size: 1 } })
      setUnreadCount(data.total || 0)
    } catch (e) {}
  }

  useEffect(() => {
    fetchUnread()
    const timer = setInterval(fetchUnread, 60000)
    return () => clearInterval(timer)
  }, [])

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '运营看板' },
    { key: '/calendar', icon: <CalendarOutlined />, label: '日历房态' },
    { key: '/cleaning-tasks', icon: <HomeOutlined />, label: '保洁任务' },
    { key: '/maintenance-orders', icon: <ToolOutlined />, label: '维修工单' },
    { key: '/properties', icon: <WrenchOutlined />, label: '房源管理' },
    { key: '/materials', icon: <FileTextOutlined />, label: '物料管理' },
    { key: '/reports', icon: <FileTextOutlined />, label: '成本报表' },
  ]

  if (user?.role === 'admin') {
    menuItems.push({ key: '/users', icon: <TeamOutlined />, label: '用户管理' })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: user?.full_name },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
          {collapsed ? '民宿' : '民宿运营系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(m => m.key === location.pathname)?.label || '民宿运营系统'}
          </div>
          <Space size={24}>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => navigate('/dashboard')} />
            </Badge>
            <Dropdown menu={userMenu}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.full_name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24, minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
