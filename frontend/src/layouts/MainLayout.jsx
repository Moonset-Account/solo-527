import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Tag, Button, theme } from 'antd'
import {
  DashboardOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
  PhoneOutlined,
  EditOutlined,
  BugOutlined,
  ExperimentOutlined,
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '效果看板' },
  { key: '/data-import', icon: <CloudUploadOutlined />, label: '数据导入' },
  { key: '/scoring', icon: <ThunderboltOutlined />, label: '风险评分工作台' },
  { key: '/callbacks', icon: <PhoneOutlined />, label: '人工回访名单' },
  { key: '/sms-templates', icon: <MessageOutlined />, label: '短信策略管理' },
  { key: '/feedback', icon: <EditOutlined />, label: '人工反馈闭环' },
  { key: '/error-samples', icon: <BugOutlined />, label: '错误样本管理' },
  { key: '/models', icon: <ExperimentOutlined />, label: '模型版本管理' },
]

const roleColor = {
  admin: 'red',
  operator: 'blue',
  data_scientist: 'purple',
}

const roleLabel = {
  admin: '管理员',
  operator: '运营人员',
  data_scientist: '数据科学家',
}

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.full_name || user?.username}`,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleMenuClick = ({ key }) => navigate(key)
  const handleUserMenu = ({ key }) => {
    if (key === 'logout') logout()
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={230}
        style={{
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            color: '#fff',
            fontWeight: 600,
            fontSize: collapsed ? 20 : 16,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '🏥' : '🏥 门诊爽约AI平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>
            {menuItems.find((m) => m.key === location.pathname)?.label || '门诊爽约风险提醒AI平台'}
          </div>
          <Space size={16}>
            <Tag icon={<SafetyOutlined />} color={roleColor[user?.role] || 'default'}>
              {roleLabel[user?.role] || user?.role}
            </Tag>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                <Avatar
                  style={{ backgroundColor: token.colorPrimary }}
                  icon={<UserOutlined />}
                  size="small"
                />
                <span style={{ fontSize: 14 }}>{user?.full_name || user?.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 0, overflow: 'initial' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
