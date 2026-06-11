import { Layout, Menu, theme } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { menuItems } from '@/router'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const getSelectedKeys = (): string[] => {
    const path = location.pathname
    if (path.startsWith('/admin')) {
      return [path.split('/')[2] || '']
    }
    return [path.split('/')[1] || '']
  }

  const getOpenKeys = (): string[] => {
    if (location.pathname.startsWith('/admin')) {
      return ['admin']
    }
    return []
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const item = findMenuItem(menuItems as MenuItem[], key)
    if (item && 'path' in item) {
      navigate(item.path as string)
    }
  }

  const findMenuItem = (items: MenuItem[], key: string): MenuItem | undefined => {
    for (const item of items) {
      if (item && 'key' in item && item.key === key) {
        return item
      }
      if (item && 'children' in item && item.children) {
        const found = findMenuItem(item.children as MenuItem[], key)
        if (found) return found
      }
    }
    return undefined
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? '客服' : '智能客服系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems as MenuItem[]}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div
            style={{
              padding: '0 24px',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            智能客服管理系统
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
