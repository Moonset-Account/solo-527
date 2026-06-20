import React, { useEffect, useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Badge, Button } from 'antd'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  DashboardOutlined,
  AlertOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  ScheduleOutlined,
  BookOutlined,
  TeamOutlined,
  AuditOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/auth'
import { notificationApi } from '../api/notifications'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const [unreadCount, setUnreadCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    loadUnreadCount()
    const timer = setInterval(loadUnreadCount, 60000)
    return () => clearInterval(timer)
  }, [])

  const loadUnreadCount = async () => {
    try {
      const res = await notificationApi.unreadCount()
      setUnreadCount(res.count)
    } catch (e) {}
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.startsWith('/alerts')) return 'alerts'
    if (path.startsWith('/assets')) return 'assets'
    if (path.startsWith('/inspections/templates')) return 'inspection-templates'
    if (path.startsWith('/inspections/tasks')) return 'inspection-tasks'
    if (path.startsWith('/changes')) return 'changes'
    if (path.startsWith('/dictionaries')) return 'dictionaries'
    if (path.startsWith('/users')) return 'users'
    if (path.startsWith('/audits')) return 'audits'
    if (path.startsWith('/notifications')) return 'notification-rules'
    return 'dashboard'
  }

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">工作台</Link> },
    { key: 'alerts', icon: <AlertOutlined />, label: <Link to="/alerts">告警管理</Link> },
    { key: 'assets', icon: <DatabaseOutlined />, label: <Link to="/assets">资产管理</Link> },
    {
      key: 'inspections',
      icon: <FileSearchOutlined />,
      label: '巡检管理',
      children: [
        { key: 'inspection-templates', label: <Link to="/inspections/templates">巡检模板</Link> },
        { key: 'inspection-tasks', label: <Link to="/inspections/tasks">巡检任务</Link> },
      ],
    },
    { key: 'changes', icon: <ScheduleOutlined />, label: <Link to="/changes">变更窗口</Link> },
    { key: 'dictionaries', icon: <BookOutlined />, label: <Link to="/dictionaries">字典管理</Link> },
  ]

  if (user?.is_admin) {
    menuItems.push(
      { key: 'users', icon: <TeamOutlined />, label: <Link to="/users">用户管理</Link> },
      { key: 'audits', icon: <AuditOutlined />, label: <Link to="/audits">审计日志</Link> },
      { key: 'notification-rules', icon: <SettingOutlined />, label: <Link to="/notifications/rules">通知规则</Link> },
    )
  }

  const userMenu = {
    items: [
      { key: 'user', icon: <UserOutlined />, label: user?.name || user?.username },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{
          height: 64,
          margin: 16,
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {collapsed ? 'OPS' : '运维工单台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <Button
            type="text"
            style={{ marginRight: 16 }}
            icon={
              <Badge count={unreadCount} size="small">
                <BellOutlined style={{ fontSize: 18 }} />
              </Badge>
            }
            onClick={() => navigate('/notifications/rules')}
          />
          <Dropdown menu={userMenu}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name || user?.username}</span>
              <span style={{ fontSize: 12, color: '#999' }}>
                {user?.role_display}
              </span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, padding: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
