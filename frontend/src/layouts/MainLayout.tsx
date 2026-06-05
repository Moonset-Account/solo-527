import { useState, useMemo } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  RiseOutlined,
  TeamOutlined as GroupOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useUserStore()

  const menuItems = useMemo(() => {
    const role = userInfo?.role
    const items: any[] = []

    if (role === 'COACH') {
      items.push({
        key: '/my-performance',
        icon: <RiseOutlined />,
        label: '我的业绩',
      })
      items.push({
        key: '/bookings',
        icon: <CalendarOutlined />,
        label: '我的课程',
      })
      return items
    }

    if (role === 'ADMIN' || role === 'MANAGER') {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '数据看板',
      })
    }

    items.push({
      key: '/members',
      icon: <TeamOutlined />,
      label: '会员管理',
    })

    items.push({
      key: '/bookings',
      icon: <CalendarOutlined />,
      label: '预约管理',
    })

    items.push({
      key: '/group-classes',
      icon: <GroupOutlined />,
      label: '团课管理',
    })

    items.push({
      key: '/body-measurements',
      icon: <FileTextOutlined />,
      label: '体测记录',
    })

    if (role === 'ADMIN' || role === 'MANAGER') {
      items.push({
        key: '/coaches',
        icon: <UserOutlined />,
        label: '教练管理',
      })
    }

    return items
  }, [userInfo?.role])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true)
        }}
        style={{
          display: mobileMenuOpen ? 'block' : collapsed ? 'none' : 'block',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 12 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'GYM' : '健身房管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => {
              if (window.innerWidth < 992) {
                setMobileMenuOpen(!mobileMenuOpen)
              } else {
                setCollapsed(!collapsed)
              }
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Avatar size="small" icon={<UserOutlined />} src={userInfo?.avatar} />
                <span style={{ display: 'inline-block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userInfo?.realName}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
