import { Layout, Menu, Typography, Avatar, Space, Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  StockOutlined,
  ScissorOutlined,
  ShoppingCartOutlined,
  RefundOutlined,
  SettingOutlined,
  BellOutlined,
  FileExcelOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/admin/routes',
      icon: <UnorderedListOutlined />,
      label: '路线管理',
    },
    {
      key: '/admin/inventory',
      icon: <StockOutlined />,
      label: '库存管理',
    },
    {
      key: '/admin/cleaning',
      icon: <ScissorOutlined />,
      label: '清洁任务',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
    },
    {
      key: '/admin/refunds',
      icon: <RefundOutlined />,
      label: '退款管理',
    },
    {
      key: '/admin/configs',
      icon: <SettingOutlined />,
      label: '配置中心',
    },
    {
      key: '/admin/reminder-rules',
      icon: <BellOutlined />,
      label: '提醒规则',
    },
    {
      key: '/admin/export-logs',
      icon: <FileExcelOutlined />,
      label: '导出日志',
    },
  ]

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const activeKey = menuItems.reduce((acc, item) => {
    if (location.pathname === item.key || location.pathname.startsWith(item.key + '/')) {
      return item.key
    }
    return acc
  }, '') || '/admin'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Title level={5} style={{ color: '#fff', margin: 0 }}>
            房态库存系统
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>管理员</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', background: '#fff', borderRadius: 8, padding: 24, minHeight: 'calc(100vh - 96px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
