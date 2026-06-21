import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const MainLayout = ({ menuItems }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  const handleMenuSelect = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
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
          {collapsed ? 'App' : '管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuSelect}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ cursor: 'pointer', fontSize: '18px' }}>
            {collapsed ? (
              <MenuUnfoldOutlined onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined onClick={() => setCollapsed(true)} />
            )}
          </div>
          <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>管理员</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
