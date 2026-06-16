import { useState, useMemo, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  FormOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  SafetyOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SwapOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { clearAuth, getUserInfo } from '@/utils/auth'
import type { UserRole, UserInfo } from '@/types'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const roleNameMap: Record<UserRole, string> = {
  worker: '网格员',
  admin: '管理员',
  manager: '管理层'
}

const getMenuItems = (roles: UserRole[]): MenuItem[] => {
  const items: MenuItem[] = []

  if (roles.includes('worker') || roles.includes('manager')) {
    items.push({
      key: 'worker',
      icon: <SwapOutlined />,
      label: '网格员工作台',
      children: [
        {
          key: '/worker/dashboard',
          icon: <DashboardOutlined />,
          label: '待办概览'
        },
        {
          key: '/worker/event-report',
          icon: <FormOutlined />,
          label: '事件上报'
        },
        {
          key: '/worker/event-list',
          icon: <UnorderedListOutlined />,
          label: '事件列表'
        },
        {
          key: '/worker/todo-list',
          icon: <CheckCircleOutlined />,
          label: '待办列表'
        }
      ]
    })
  }

  if (roles.includes('admin') || roles.includes('manager')) {
    items.push({
      key: 'admin',
      icon: <TeamOutlined />,
      label: '居民管理',
      children: [
        {
          key: '/admin/resident-list',
          icon: <UnorderedListOutlined />,
          label: '居民信息'
        },
        {
          key: '/admin/resident-import',
          icon: <FileSearchOutlined />,
          label: '批量导入'
        }
      ]
    })
  }

  if (roles.includes('manager')) {
    items.push({
      key: 'manager',
      icon: <BarChartOutlined />,
      label: '管理中心',
      children: [
        {
          key: '/manager/dashboard',
          icon: <DashboardOutlined />,
          label: '数据概览'
        },
        {
          key: '/manager/patrol-tasks',
          icon: <SafetyOutlined />,
          label: '巡查任务'
        },
        {
          key: '/manager/reports',
          icon: <FileTextOutlined />,
          label: '统计报表'
        }
      ]
    })
  }

  return items
}

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    setUserInfo(getUserInfo())
  }, [])

  const menuItems = useMemo(
    () => (userInfo ? getMenuItems(userInfo.roles) : []),
    [userInfo]
  )

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const openKeys = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/worker')) return ['worker']
    if (path.startsWith('/admin')) return ['admin']
    if (path.startsWith('/manager')) return ['manager']
    return []
  }, [location.pathname])

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold'
          }}
        >
          {collapsed ? 'MS' : '网格管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              cursor: 'pointer',
              fontSize: 16
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={userInfo?.avatar} />
              <span>
                {userInfo?.nickname || '用户'}
                {userInfo?.roles?.[0] && (
                  <span style={{ color: '#999', marginLeft: 6 }}>
                    （{roleNameMap[userInfo.roles[0]]}）
                  </span>
                )}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
