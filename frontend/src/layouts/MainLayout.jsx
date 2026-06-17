import React from 'react'
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd'
import {
  FileListOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/userStore'

const { Header, Sider, Content, Footer } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/requirements',
      icon: <FileListOutlined />,
      label: '需求管理',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '协作效率',
    },
    {
      key: '/delays',
      icon: <ClockCircleOutlined />,
      label: '延期管理',
    },
    {
      key: '/logs',
      icon: <HistoryOutlined />,
      label: '操作日志',
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.startsWith('/requirements')) return '/requirements'
    return path
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-logo">跨部门需求审批流系统</div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', color: 'white' }}>
            <Avatar icon={<UserOutlined />} size="small" />
            <span>{user?.realName || user?.username}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content className="app-content">
            <Outlet />
          </Content>
          <Footer className="app-footer">
            跨部门需求审批流系统 ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default MainLayout
