import React from 'react'
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  FireOutlined, 
  AppstoreOutlined, 
  LineChartOutlined,
  InboxOutlined,
  AlertOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  { key: '/artworks', icon: <AppstoreOutlined />, label: '作品登记' },
  { key: '/kiln-runs', icon: <FireOutlined />, label: '窑次编排' },
  { key: '/firing-curves', icon: <LineChartOutlined />, label: '曲线模板' },
  { key: '/kiln-out-records', icon: <InboxOutlined />, label: '出窑记录' },
  { key: '/damage-claims', icon: <AlertOutlined />, label: '破损赔付' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const userMenu = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.1)'
        }}>
          窑炉排烧平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <Dropdown menu={{ items: userMenu }}>
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>管理员</span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
