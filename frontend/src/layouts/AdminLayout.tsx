import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileProtectOutlined,
  HistoryOutlined,
  WarningOutlined,
  AuditOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store'
import type { MenuProps } from 'antd'
import type { RoleCode } from '@/types'

const { Header, Sider, Content } = Layout

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUserStore()

  const hasRole = (roles: RoleCode[]) => {
    if (!user?.roles) return false
    return user.roles.some(role => roles.includes(role))
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/admin/approval',
      icon: <ClockCircleOutlined />,
      label: '待我审批'
    },
    {
      key: '/admin/approved',
      icon: <CheckCircleOutlined />,
      label: '已审批'
    },
    {
      key: '/admin/rules',
      icon: <FileProtectOutlined />,
      label: '审批规则配置'
    },
    {
      key: '/admin/config',
      icon: <SettingOutlined />,
      label: '系统配置'
    },
    {
      key: '/admin/change-logs',
      icon: <HistoryOutlined />,
      label: '口径变更记录'
    },
    {
      key: '/admin/timeout',
      icon: <WarningOutlined />,
      label: '超时异常处理'
    },
    {
      key: '/admin/audit-logs',
      icon: <AuditOutlined />,
      label: '审计日志'
    },
    ...(hasRole(['ADMIN']) ? [{
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: '用户管理'
    }] : [])
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.realName || user?.username}`
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 12 : 18, fontWeight: 'bold' }}>
          {collapsed ? '管理' : '管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.realName || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', padding: 24, background: '#f5f5f5', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
