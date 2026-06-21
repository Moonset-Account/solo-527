import React from 'react'
import { Layout, Menu, Badge, Avatar, Dropdown, Button, theme } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileSearchOutlined,
  CheckSquareOutlined,
  LineChartOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore, useAppStore } from '@/store'
import { useEffect } from 'react'
import { dashboardApi } from '@/api/endpoints'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">工作台</Link> },
  { key: '/consumables', icon: <ShoppingCartOutlined />, label: <Link to="/consumables">耗材管理</Link>,
    children: [
      { key: '/consumables', label: <Link to="/consumables">耗材规格</Link> },
      { key: '/consumables/monthly-usage', label: <Link to="/consumables/monthly-usage">月度用量</Link> }
    ]
  },
  { key: '/contracts', icon: <FileTextOutlined />, label: <Link to="/contracts">合同管理</Link> },
  { key: '/suppliers', icon: <TeamOutlined />, label: <Link to="/suppliers">供应商管理</Link> },
  { key: '/invoices', icon: <FileSearchOutlined />, label: <Link to="/invoices">发票管理</Link> },
  { key: '/approvals', icon: <CheckSquareOutlined />, label: <Link to="/approvals">审批中心</Link> },
  { key: '/price-board', icon: <LineChartOutlined />, label: <Link to="/price-board">价格波动看板</Link> },
  { key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">系统设置</Link> }
]

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { unreadCount, setUnreadCount } = useAppStore()
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const loadUnreadCount = async () => {
    try {
      const res = await dashboardApi.notifications.unreadCount()
      setUnreadCount(res.data.count)
    } catch (e) {}
  }

  useEffect(() => {
    loadUnreadCount()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
    ]
  }

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/consumables')) return ['/consumables']
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme="light" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>耗材协议管理系统</span>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={['/consumables']}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {menuItems.flatMap(m => m.children || [m]).find(m => getSelectedKeys().includes(m.key))?.label?.props?.children || '工作台'}
          </h2>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined />} size="large" onClick={() => navigate('/dashboard')} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.full_name || user?.email || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ background: colorBgContainer, padding: 24, borderRadius: 8, minHeight: 'calc(100vh - 160px)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
