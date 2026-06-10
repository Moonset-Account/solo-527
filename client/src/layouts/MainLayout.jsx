import React, { useState, useEffect } from 'react'
import { Layout, Menu, theme, Dropdown, Badge, Avatar, List, Button, message } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  FileTextOutlined,
  TeamOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { removeToken, getUser } from '@/utils/auth'
import request from '@/utils/request'
import dayjs from 'dayjs'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  const adminMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '日常看板'
    },
    {
      key: '/events',
      icon: <FileTextOutlined />,
      label: '事件管理'
    },
    {
      key: '/facilities',
      icon: <ShopOutlined />,
      label: '设施管理'
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理'
    },
    {
      key: '/operation-logs',
      icon: <HistoryOutlined />,
      label: '操作日志'
    }
  ]

  const workerMenuItems = [
    {
      key: '/worker',
      icon: <UserOutlined />,
      label: '我的工作台'
    },
    {
      key: '/facilities',
      icon: <ShopOutlined />,
      label: '设施列表'
    }
  ]

  const menuItems = isAdmin ? adminMenuItems : workerMenuItems

  useEffect(() => {
    fetchUnreadCount()
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await request.get('/notifications/unread-count')
      setUnreadCount(res.data.count)
    } catch (error) {
      console.error('获取未读数量失败:', error)
    }
  }

  const fetchNotifications = async () => {
    setNotificationLoading(true)
    try {
      const res = await request.get('/notifications', {
        params: { pageSize: 10, isRead: false }
      })
      setNotifications(res.data.list)
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  const handleNotificationVisibleChange = (visible) => {
    if (visible) {
      fetchNotifications()
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await request.post(`/notifications/${id}/read`)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await request.post('/notifications/read-all')
      setUnreadCount(0)
      setNotifications([])
      message.success('全部标记已读')
    } catch (error) {
      console.error('全部标记已读失败:', error)
    }
  }

  const notificationDropdown = (
    <div style={{ width: 360, padding: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <strong>通知中心</strong>
        <Button type="link" size="small" onClick={handleMarkAllAsRead}>
          全部已读
        </Button>
      </div>
      <List
        loading={notificationLoading}
        dataSource={notifications}
        locale={{ emptyText: '暂无未读通知' }}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            onClick={() => handleMarkAsRead(item.id)}
            style={{ cursor: 'pointer' }}
          >
            <List.Item.Meta
              title={item.title}
              description={
                <div>
                  <div>{item.content}</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {dayjs(item.createdAt).format('MM-DD HH:mm')}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ]

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout()
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold'
          }}
        >
          {collapsed ? '社区' : '社区管理系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 16
          }}
        >
          <Dropdown
            dropdownRender={() => notificationDropdown}
            trigger={['click']}
            onOpenChange={handleNotificationVisibleChange}
            placement="bottomRight"
          >
            <Badge count={unreadCount} size="small">
              <span
                style={{
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: '0 8px'
                }}
              >
                <BellOutlined />
              </span>
            </Badge>
          </Dropdown>

          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
              <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                {user?.name || '用户'}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
