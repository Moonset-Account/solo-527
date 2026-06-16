
import React, { useState, useEffect } from 'react'
import { Layout, Menu, theme, Badge } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  BellOutlined,
  BarChartOutlined,
  BugOutlined,
  UserOutlined,
  UserAddOutlined,
  ScheduleOutlined
} from '@ant-design/icons'
import { getPendingTodoCount, getOverdueFollowUpCount } from '../services/api'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [todoBadge, setTodoBadge] = useState(0)
  const [followUpBadge, setFollowUpBadge] = useState(0)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const todoRes = await getPendingTodoCount()
        const count = typeof todoRes === 'number' ? todoRes : (todoRes?.data ?? 0)
        setTodoBadge(count)
      } catch {}
      try {
        const fuRes = await getOverdueFollowUpCount()
        const count = typeof fuRes === 'number' ? fuRes : (fuRes?.data ?? 0)
        setFollowUpBadge(count)
      } catch {}
    }
    fetchBadges()
    const interval = setInterval(fetchBadges, 60000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/appointment-booking', icon: <CalendarOutlined />, label: '预约挂号' },
    {
      key: '/todos',
      icon: <UnorderedListOutlined />,
      label: '待办事项',
      badge: todoBadge
    },
    {
      key: '/follow-ups',
      icon: <BellOutlined />,
      label: '随访管理',
      badge: followUpBadge
    },
    { key: '/workload-report', icon: <BarChartOutlined />, label: '排班负荷' },
    { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
    { key: '/api-monitor', icon: <BugOutlined />, label: '接口监控' },
    { key: '/patients', icon: <UserOutlined />, label: '患者管理' },
    { key: '/doctors', icon: <UserAddOutlined />, label: '医生管理' },
    { key: '/schedules', icon: <ScheduleOutlined />, label: '号源管理' },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 24,
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
            borderBottom: '1px solid #1f1f1f',
          }}
        >
          {collapsed ? '口腔' : '口腔复诊平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.badge > 0 ? (
              <Badge count={item.badge} size="small" offset={[8, -2]}>
                {item.icon}
              </Badge>
            ) : item.icon,
            label: item.label
          }))}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>连锁口腔复诊提醒平台</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={followUpBadge} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <UserOutlined style={{ fontSize: 18 }} />
            <span>管理员</span>
          </div>
        </Header>
        <Content style={{ margin: '16px', padding: 0, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
