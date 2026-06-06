import { Layout, Menu, Button, Dropdown, Avatar, Badge, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  DashboardOutlined, UnorderedListOutlined, WarningOutlined, DollarOutlined, 
  ShoppingOutlined, CarryOutOutlined, QrcodeOutlined, 
  ShopOutlined, HomeOutlined, TeamOutlined, UserOutlined, LogoutOutlined
} from '@ant-design/icons'
import { useEffect, useState } from 'react'

const { Header, Content, Sider } = Layout

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const u = JSON.parse(userStr)
      if (u.role !== 'admin' && u.role !== 'staff') {
        navigate('/')
        return
      }
      setUser(u)
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
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '截单提醒' },
    { key: '/admin/orders', icon: <UnorderedListOutlined />, label: '订单管理' },
    { key: '/admin/sorting', icon: <CarryOutOutlined />, label: '楼栋分拣' },
    { key: '/admin/shortages', icon: <WarningOutlined />, label: '缺货替换' },
    { key: '/admin/refunds', icon: <DollarOutlined />, label: '退款确认' },
    { key: '/admin/pickup', icon: <QrcodeOutlined />, label: '取货核销' },
    { type: 'divider' },
    { key: '/admin/products', icon: <ShoppingOutlined />, label: '商品管理' },
    { key: '/admin/buildings', icon: <HomeOutlined />, label: '楼栋管理' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
  ]

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ]

  if (!user) return null

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: collapsed ? 14 : 16, fontWeight: 600, color: '#fff' }}>
            {collapsed ? '分拣' : '分拣管理后台'}
          </span>
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
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>内部管理入口</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#52c41a' }} />
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

export default AdminLayout
