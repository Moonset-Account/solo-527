import { Layout, Menu, Badge, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  ToolOutlined,
  BellOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  QrcodeOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
  SafetyOutlined,
  NotificationOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import axios from '@/utils/request'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await axios.get('/api/notifications/list/unread_count/')
        setUnread(data.unread_count)
      } catch {}
    }
    fetchUnread()
    const timer = setInterval(fetchUnread, 60000)
    return () => clearInterval(timer)
  }, [])

  const getMenuItems = () => {
    const baseItems = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
      { key: '/repairs', icon: <ToolOutlined />, label: '我的报修' },
      { key: '/notifications', icon: <Badge count={unread}><BellOutlined /></Badge>, label: '消息通知' },
      { key: '/announcements', icon: <NotificationOutlined />, label: '公告' },
      { key: '/study-rooms', icon: <ReadOutlined />, label: '自习室' },
      { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
    ]

    if (user?.role === 'admin' || user?.role === 'dorm_manager' || user?.role === 'maintenance') {
      baseItems.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: '管理后台',
        children: [
          { key: '/admin/repairs', icon: <ToolOutlined />, label: '报修管理' },
          user?.role !== 'maintenance' && { key: '/admin/push', icon: <BellOutlined />, label: '推送通知' },
          user?.role !== 'maintenance' && { key: '/admin/announcements', icon: <FileTextOutlined />, label: '公告管理' },
          user?.role !== 'maintenance' && { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
          user?.role === 'admin' && { key: '/admin/roles', icon: <SafetyOutlined />, label: '角色配置' },
          user?.role === 'admin' && { key: '/admin/audit', icon: <FileTextOutlined />, label: '操作日志' },
        ].filter(Boolean),
      })
    }

    if (user?.role === 'admin' || user?.role === 'dorm_manager') {
      baseItems.push({
        key: 'dorm',
        icon: <TeamOutlined />,
        label: '宿管工作',
        children: [
          { key: '/dorm/seats', icon: <ReadOutlined />, label: '座位管理' },
          { key: '/dorm/verify', icon: <UsergroupAddOutlined />, label: '身份审核' },
          { key: '/dorm/checkin', icon: <CheckSquareOutlined />, label: '签到核销' },
        ],
      })
    }

    return baseItems
  }

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout()
        navigate('/login')
      } else if (key === 'profile') {
        navigate('/profile')
      }
    },
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="dark"
        breakpoint="lg"
        collapsedWidth="0"
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          宿舍报修系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['admin', 'dorm']}
          onClick={({ key }) => navigate(key)}
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Dropdown menu={userMenu}>
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={user?.avatar} icon={!user?.avatar && <UserOutlined />} />
              <span>{user?.real_name || user?.username}</span>
              <span style={{ fontSize: 12, color: '#999' }}>({user?.role_display})</span>
            </Button>
          </Dropdown>
        </Header>
        <Content>
          <div className="page-container">
            <OutletPlaceholder />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

import { Outlet } from 'react-router-dom'
function OutletPlaceholder() {
  return <Outlet />
}
