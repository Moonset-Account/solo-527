import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  SearchOutlined,
  AlertOutlined,
  DatabaseOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider, Header, Content } = Layout

const MainLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const menuItems = [
    { key: '/purchase-requests', icon: <ShoppingCartOutlined />, label: '采购需求' },
    { key: '/approvals', icon: <CheckCircleOutlined />, label: '审批中心' },
    { key: '/price', icon: <RiseOutlined />, label: '价格波动' },
    { key: '/tracking', icon: <SearchOutlined />, label: '事后追踪' },
    { key: '/payment', icon: <AlertOutlined />, label: '付款差异' },
    { key: '/batch', icon: <DatabaseOutlined />, label: '批量操作' },
    { key: '/suppliers', icon: <TeamOutlined />, label: '供应商管理' },
    { key: '/approval-config', icon: <SettingOutlined />, label: '审批配置' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const userMenu = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          采购审批系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenu }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.realName || user.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
