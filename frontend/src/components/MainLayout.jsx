import React, { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  CalendarOutlined,
  ScheduleOutlined,
  UserOutlined,
  BarChartOutlined,
  WarningOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/reception', icon: <CalendarOutlined />, label: '分诊台' },
  { key: '/appointments', icon: <ScheduleOutlined />, label: '预约管理' },
  { key: '/patients', icon: <UserOutlined />, label: '患者档案' },
  { key: '/schedule', icon: <TeamOutlined />, label: '排班管理' },
  { key: '/conflicts', icon: <WarningOutlined />, label: '号源冲突' },
  { key: '/stats', icon: <BarChartOutlined />, label: '数据统计' },
]

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const getSelectedKey = () => {
    if (location.pathname === '/') return '/reception'
    return menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/reception'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
          }}
        >
          {collapsed ? '口腔' : '连锁口腔'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>连锁口腔预约分诊管理系统</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#666' }}>管理员</span>
            <SettingOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
