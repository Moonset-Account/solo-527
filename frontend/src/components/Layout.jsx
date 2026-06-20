import React, { useState } from 'react'
import { Layout as AntLayout, Menu, Dropdown, Avatar, Badge, Button, Drawer, List, Tag } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  DashboardOutlined,
  AlertOutlined,
  WarningOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FilterOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { setLogout, clearNotification, clearAllNotifications } from '@/store'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/anomalies', icon: <WarningOutlined />, label: '异常原因' },
  { key: '/alert-rules', icon: <AlertOutlined />, label: '告警规则' },
  { key: '/dimensions', icon: <DatabaseOutlined />, label: '维度配置' },
  { key: '/dataset-permissions', icon: <SafetyOutlined />, label: '数据集权限' },
  { key: '/desensitization', icon: <EyeOutlined />, label: '数据脱敏' },
  { key: '/approvals', icon: <FileTextOutlined />, label: '权限审批' },
  { key: '/data-delay', icon: <ClockCircleOutlined />, label: '数据延迟' },
  { key: '/report-efficiency', icon: <BarChartOutlined />, label: '报表效率' },
  { key: '/filter-templates', icon: <FilterOutlined />, label: '筛选模板' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const roles = useSelector((state) => state.auth.roles)
  const notifications = useSelector((state) => state.app.notifications)

  const [collapsed, setCollapsed] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)

  const handleLogout = () => {
    dispatch(setLogout())
    navigate('/login')
  }

  const handleClearNotification = (index) => {
    dispatch(clearNotification(index))
  }

  const handleClearAll = () => {
    dispatch(clearAllNotifications())
    setNotificationOpen(false)
  }

  const userMenu = {
    items: [
      { key: 'info', label: `${user?.realName || user?.username}`, disabled: true },
      { key: 'role', label: `角色: ${roles?.join(', ')}`, disabled: true },
      { type: 'divider' },
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
    ],
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'red'
      case 'MEDIUM': return 'orange'
      default: return 'blue'
    }
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            background: '#002140',
          }}
        >
          {collapsed ? '数据门户' : '用户增长数据门户'}
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
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={notifications.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 20 }} />}
                onClick={() => setNotificationOpen(true)}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} src={null}>
                  {user?.realName?.charAt(0) || user?.username?.charAt(0)}
                </Avatar>
                <span>{user?.realName || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 0, background: '#f0f2f5' }}>
          <div className="page-container">
            <Outlet />
          </div>
        </Content>
      </AntLayout>

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>通知中心 ({notifications.length})</span>
            {notifications.length > 0 && (
              <Button type="link" onClick={handleClearAll}>
                全部清除
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={() => setNotificationOpen(false)}
        open={notificationOpen}
        width={400}
      >
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无通知
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  background: item.type === 'DATA_DELAY' ? '#fff1f0' : '#fff',
                  marginBottom: 8,
                  borderRadius: 8,
                  padding: 12,
                }}
                actions={[
                  <Button type="text" size="small" onClick={() => handleClearNotification(index)}>
                    清除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>数据延迟告警</span>
                      <Tag color={getSeverityColor(item.severity)}>{item.severity}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <strong>{item.datasetName}</strong> 已延迟 {item.delayMinutes} 分钟
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        预期更新时间: {new Date(item.expectedTime).toLocaleString()}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </AntLayout>
  )
}
