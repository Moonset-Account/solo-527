import { Layout, Menu, Button, Dropdown, Avatar, Badge } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCartOutlined, UnorderedListOutlined, WarningOutlined, DollarOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

const { Header, Content, Sider } = Layout

function UserLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { key: '/products', icon: <ShoppingCartOutlined />, label: '商品下单' },
    { key: '/orders', icon: <UnorderedListOutlined />, label: '我的订单' },
    { key: '/shortages', icon: <WarningOutlined />, label: '缺货确认' },
    { key: '/refunds', icon: <DollarOutlined />, label: '退款申请' },
  ]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ]

  if (!user) return null

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: collapsed ? 16 : 18, fontWeight: 600, color: '#52c41a' }}>
            {collapsed ? '生鲜' : '生鲜团购'}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>居民入口</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default UserLayout
