import React, { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  CrownOutlined,
  GiftOutlined,
  WarningOutlined,
  PictureOutlined,
  DownloadOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据概览' },
  {
    key: 'order-mgmt',
    icon: <FileTextOutlined />,
    label: '订单管理',
    children: [
      { key: '/orders', icon: <FileTextOutlined />, label: '订单列表' },
      { key: '/schedules', icon: <CalendarOutlined />, label: '拍摄档期' },
      { key: '/delivery-nodes', icon: <ClockCircleOutlined />, label: '交付节点' },
      { key: '/payments', icon: <CreditCardOutlined />, label: '回款状态' },
      { key: '/work-authorization', icon: <SafetyCertificateOutlined />, label: '作品授权' }
    ]
  },
  {
    key: 'brand-mgmt',
    icon: <ShopOutlined />,
    label: '品牌合作',
    children: [
      { key: '/brands', icon: <ShopOutlined />, label: '品牌列表' },
      { key: '/brand-quotes', icon: <DollarOutlined />, label: '品牌报价' },
      { key: '/contracts', icon: <FileDoneOutlined />, label: '合同附件' },
      { key: '/sponsorships', icon: <GiftOutlined />, label: '赞助权益' }
    ]
  },
  {
    key: 'member-mgmt',
    icon: <TeamOutlined />,
    label: '会员订阅',
    children: [
      { key: '/members', icon: <TeamOutlined />, label: '会员列表' },
      { key: '/subscriptions', icon: <CrownOutlined />, label: '订阅管理' }
    ]
  },
  {
    key: 'client-mgmt',
    icon: <PictureOutlined />,
    label: '客户端入口',
    children: [
      { key: '/orders#photo', icon: <PictureOutlined />, label: '选片确认' },
      { key: '/orders#delivery', icon: <DownloadOutlined />, label: '成片下载' }
    ]
  },
  { key: '/exception-pool', icon: <WarningOutlined />, label: '异常池' },
  { key: '/sync-logs', icon: <SyncOutlined />, label: '同步日志' }
]

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const handleMenuClick = ({ key }) => {
    if (key.includes('#')) {
      const [path, hash] = key.split('#')
      navigate(path, { state: { scrollTo: hash } })
    } else {
      navigate(key)
    }
  }

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/orders/')) return ['/orders']
    if (path.startsWith('/photo-selection/')) return ['/orders#photo']
    if (path.startsWith('/final-delivery/')) return ['/orders#delivery']
    return [path]
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div className="logo">
          {collapsed ? '📷' : '摄影管道系统'}
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
        <Header style={{ padding: '0 24px', background: colorBgContainer }}>
          <h2 style={{ margin: 0, lineHeight: '64px' }}>
            摄影师订单与品牌合作管道管理系统
          </h2>
        </Header>
        <Content style={{ margin: '16px', padding: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
