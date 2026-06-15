import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import {
  DashboardOutlined,
  MessageOutlined,
  AuditOutlined,
  FileTextOutlined,
  BookOutlined,
  ClockCircleOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '质检看板',
  },
  {
    key: '/sessions',
    icon: <MessageOutlined />,
    label: '会话管理',
  },
  {
    key: '/inspections',
    icon: <AuditOutlined />,
    label: '质检评分',
  },
  {
    key: '/response-time',
    icon: <ClockCircleOutlined />,
    label: '响应时长',
  },
  {
    key: '/tickets',
    icon: <FileTextOutlined />,
    label: '工单协同',
  },
  {
    key: '/knowledge',
    icon: <BookOutlined />,
    label: '知识库',
  },
]

const userMenuItems = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: '个人中心',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: '退出登录',
  },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/sessions')) return ['/sessions']
    if (path.startsWith('/inspections')) return ['/inspections']
    if (path.startsWith('/tickets')) return ['/tickets']
    if (path.startsWith('/knowledge')) return ['/knowledge']
    if (path.startsWith('/response-time')) return ['/response-time']
    return ['/dashboard']
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 600,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '质检' : 'SaaS客服质检'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            客服主管工作台
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: 'rgba(0,0,0,0.65)' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ color: 'rgba(0,0,0,0.65)' }}>张质检</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
