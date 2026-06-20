import { Layout, Menu, Avatar, Dropdown, Space, Tag } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  TeamOutlined,
  WarningOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  FileSearchOutlined,
  ImportOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import { useState, useEffect } from 'react'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/replenishment', icon: <ShoppingCartOutlined />, label: '补货建议' },
  { key: '/allocation', icon: <SwapOutlined />, label: '调拨申请' },
  { key: '/supplier', icon: <TeamOutlined />, label: '供应商回复' },
  { key: '/exception', icon: <WarningOutlined />, label: '异常记录' },
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: '管理员功能',
    children: [
      { key: '/admin/discrepancy', icon: <FileSearchOutlined />, label: '差异管理' },
      { key: '/admin/receipt', icon: <ImportOutlined />, label: '签收管理' },
      { key: '/admin/stockout-trend', icon: <LineChartOutlined />, label: '缺货风险趋势' },
      { key: '/admin/users', label: '用户管理' },
      { key: '/admin/warehouses', label: '仓库管理' },
      { key: '/admin/products', label: '商品管理' }
    ]
  }
]

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [userInfo, setUserInfo] = useState({ realName: '用户', role: 'Planner' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('userInfo')
      if (saved) setUserInfo(JSON.parse(saved))
    } catch (e) {}
  }, [])

  const selectedKey = location.pathname

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <Space>
          <span>{userInfo.realName}</span>
          <Tag color={userInfo.role === 'Admin' ? 'red' : 'blue'}>
            {userInfo.role === 'Admin' ? '管理员' : '采购计划员'}
          </Tag>
        </Space>
      )
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    }
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      navigate('/login')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 17,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.08)',
            letterSpacing: 1
          }}
        >
          {collapsed ? 'MBAP' : '医药调拨平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['/admin']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            height: 64
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: '#262626' }}>
            医药批次调拨协同平台
          </div>
          <Space size={24}>
            <div style={{ cursor: 'pointer', color: '#666', position: 'relative' }}>
              <BellOutlined style={{ fontSize: 18 }} />
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  background: '#ff4d4f',
                  color: '#fff',
                  fontSize: 10,
                  borderRadius: 10,
                  padding: '0 4px',
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                3
              </span>
            </div>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span>{userInfo.realName}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#f0f2f5',
            borderRadius: 4,
            minHeight: 'calc(100vh - 64px - 32px)'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
