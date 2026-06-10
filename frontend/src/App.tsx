import { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
import {
  ProjectOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  AuditOutlined,
  CustomerServiceOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Content, Sider } = Layout

const menuItems = [
  {
    key: '/projects',
    icon: <ProjectOutlined />,
    label: '项目列表'
  },
  {
    key: '/sales',
    icon: <ShoppingCartOutlined />,
    label: '销售录入'
  },
  {
    key: '/construction',
    icon: <ToolOutlined />,
    label: '施工管理'
  },
  {
    key: '/inspection',
    icon: <AuditOutlined />,
    label: '巡检'
  },
  {
    key: '/after-sales',
    icon: <CustomerServiceOutlined />,
    label: '售后'
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: '报表'
  }
]

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/projects/')) return ['/projects']
    if (path === '/') return ['/projects']
    return [path]
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
            fontSize: collapsed ? 12 : 16,
            fontWeight: 'bold'
          }}
        >
          {collapsed ? 'PMS' : '项目管理系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={getSelectedKeys()}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
