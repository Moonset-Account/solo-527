import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  TagsOutlined,
  ExceptionOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShopOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { logout as apiLogout } from '../api/auth'
import { message } from 'antd'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUserStore()

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch (e) {
    }
    logout()
    message.success('已退出登录')
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '看板',
    },
    {
      key: '/leads',
      icon: <UserOutlined />,
      label: '线索列表',
    },
    {
      key: '/public-sea',
      icon: <ShopOutlined />,
      label: '公海池',
    },
    {
      key: '/exceptions',
      icon: <ExceptionOutlined />,
      label: '异常记录',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '管理中心',
      children: [
        {
          key: '/admin/tags',
          icon: <TagsOutlined />,
          label: '标签管理',
        },
        {
          key: '/admin/lost-reasons',
          icon: <FileTextOutlined />,
          label: '流失原因',
        },
        {
          key: '/admin/public-sea-rules',
          icon: <FileTextOutlined />,
          label: '公海规则',
        },
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: '用户管理',
        },
      ],
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

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/admin')) {
      return [path, '/admin']
    }
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          装修CRM系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={['/admin']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.realName || user?.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
