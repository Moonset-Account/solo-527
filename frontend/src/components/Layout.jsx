import React, { useState, useEffect } from 'react'
import { Layout, Menu, Badge, Dropdown, Avatar, Space } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  DashboardOutlined,
  ScanOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  WarningOutlined,
  ShoppingOutlined,
  BellOutlined,
  HistoryOutlined,
  CloudUploadOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { notificationApi } from '../services/api'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAdmin } = useAuth()

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await notificationApi.getUnreadCount()
        if (response.code === 200) {
          setUnreadCount(response.data.count)
        }
      } catch (e) {
        console.error('Fetch unread count error:', e)
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/scan',
      icon: <ScanOutlined />,
      label: '扫码流转',
    },
    {
      key: '/equipments',
      icon: <DesktopOutlined />,
      label: '设备管理',
    },
    {
      key: '/processes',
      icon: <AppstoreOutlined />,
      label: '工序管理',
    },
    {
      key: '/workorders',
      icon: <FileTextOutlined />,
      label: '生产工单',
    },
    {
      key: '/plans',
      icon: <ScheduleOutlined />,
      label: '生产计划',
    },
    {
      key: '/utilization',
      icon: <BarChartOutlined />,
      label: '设备稼动',
    },
    {
      key: '/reworks',
      icon: <WarningOutlined />,
      label: '返工管理',
    },
    {
      key: '/materials',
      icon: <ShoppingOutlined />,
      label: '物料齐套',
    },
    {
      key: '/notifications',
      icon: (
        <Badge count={unreadCount} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: '通知中心',
    },
    {
      key: '/import',
      icon: <ImportOutlined />,
      label: '批量导入',
    },
    ...(isAdmin()
      ? [
          {
            key: '/logs',
            icon: <HistoryOutlined />,
            label: '操作日志',
          },
          {
            key: '/users',
            icon: <TeamOutlined />,
            label: '用户管理',
          },
        ]
      : []),
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.name} (${user?.role === 'ADMIN' ? '管理员' : '车间主任'})`,
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo">{collapsed ? '注塑' : '注塑排产系统'}</div>
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
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            注塑设备排产计划系统
          </h2>
          <Space size={16}>
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 20, cursor: 'pointer', color: '#666' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 112px)',
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
