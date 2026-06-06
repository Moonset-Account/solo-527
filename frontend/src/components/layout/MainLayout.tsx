import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  SwapOutlined,
  FileTextOutlined,
  RiseOutlined,
  BellOutlined,
  MessageOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { useQuery } from 'react-query'
import { notificationApi } from '@/services/notifications'
import { leaveApi } from '@/services/leave'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const { data: notifCount } = useQuery(
    ['unread-count'],
    () => notificationApi.getUnreadCount().then((res) => res.data),
    { refetchInterval: 30000 }
  )

  const { data: leaveCount } = useQuery(
    ['pending-leave-count'],
    () => leaveApi.getPendingCount().then((res) => res.data),
    { refetchInterval: 30000, enabled: user?.role !== 'parent' }
  )

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '看板',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/children',
      icon: <TeamOutlined />,
      label: '儿童档案',
      roles: ['director', 'teacher']
    },
    {
      key: '/pickup/verify',
      icon: <SwapOutlined />,
      label: '接送核验',
      roles: ['director', 'teacher']
    },
    {
      key: '/pickup/records',
      icon: <FileTextOutlined />,
      label: '接送记录',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/daily',
      icon: <FileTextOutlined />,
      label: '每日记录',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/growth',
      icon: <RiseOutlined />,
      label: '成长记录',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/notifications',
      icon: <Badge count={notifCount?.unread_count || 0} size="small"><BellOutlined /></Badge>,
      label: '通知',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/messages',
      icon: <MessageOutlined />,
      label: '家长消息',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/leave',
      icon: <Badge count={leaveCount?.pending_count || 0} size="small"><CalendarOutlined /></Badge>,
      label: '请假',
      roles: ['director', 'teacher', 'parent']
    },
    {
      key: '/payments',
      icon: <DollarOutlined />,
      label: '缴费',
      roles: ['director', 'teacher', 'parent']
    }
  ].filter((item) => user?.role && item.roles.includes(user.role))

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout()
        navigate('/login')
      }
    }
  }

  return (
    <Layout className="layout-container">
      <Sider theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 600 }}>
          托育中心
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.key)
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            托育中心接送和家园沟通平台
          </div>
          <Dropdown menu={userMenu}>
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar || undefined} />
              <span>{user?.name}</span>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>({user?.role_display})</span>
            </Button>
          </Dropdown>
        </Header>
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
