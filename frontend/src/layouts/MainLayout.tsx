import { Layout, Menu, Avatar, Dropdown, Badge, theme } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  LineChartOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store'
import { useEffect, useState } from 'react'
import { notificationApi } from '@/api'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout, isAdmin, isCoach } = useUserStore()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (userInfo?.userId) {
      loadUnreadCount()
    }
  }, [userInfo])

  const loadUnreadCount = async () => {
    if (userInfo?.userId) {
      try {
        const count = await notificationApi.countUnread(userInfo.userId)
        setUnreadCount(count)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '数据看板'
    },
    {
      key: '/members',
      icon: <TeamOutlined />,
      label: '会员管理'
    },
    {
      key: '/coaches',
      icon: <UserOutlined />,
      label: '教练管理'
    },
    {
      key: '/packages',
      icon: <ShopOutlined />,
      label: '课包管理'
    },
    {
      key: '/group-classes',
      icon: <CalendarOutlined />,
      label: '团课管理'
    },
    {
      key: '/bookings',
      icon: <ClockCircleOutlined />,
      label: '预约排班'
    },
    {
      key: '/freezes',
      icon: <PauseCircleOutlined />,
      label: '冻结管理'
    },
    {
      key: '/measurements',
      icon: <LineChartOutlined />,
      label: '体测记录'
    }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const getRoleLabel = () => {
    if (isAdmin()) return '管理员'
    if (isCoach()) return '教练'
    return '前台'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold'
          }}
        >
          {collapsed ? '健身' : '健身房管理系统'}
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
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ margin: 0 }}>
            {menuItems.find((item) => item.key === location.pathname)?.label || '健身房管理系统'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>
                  {userInfo?.realName} ({getRoleLabel()})
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
