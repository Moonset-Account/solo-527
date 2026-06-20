
import { Suspense, useState, useEffect } from 'react'
import { Layout, Menu, Badge, Spin, Typography } from 'antd'
import { useRoutes, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  EditOutlined,
  ControlOutlined,
  AuditOutlined,
  DatabaseOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  CloudServerOutlined
} from '@ant-design/icons'
import { routes } from './router'
import { todos } from './services/http'

const { Header, Sider, Content } = Layout
const { Title } = Typography

function App() {
  const element = useRoutes(routes)
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingTodoCount, setPendingTodoCount] = useState(0)

  useEffect(() => {
    todos.pendingCount().then(setPendingTodoCount).catch(() => {})
  }, [location.pathname])

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘统计' },
    { key: '/submit', icon: <EditOutlined />, label: '提交报名资料' },
    { key: '/admin', icon: <ControlOutlined />, label: '管理台（座位/场次）' },
    { key: '/review', icon: <AuditOutlined />, label: '报名审核·分组赛程' },
    { key: '/inventory', icon: <DatabaseOutlined />, label: '票种库存统计' },
    {
      key: '/todos',
      icon: <Badge count={pendingTodoCount} size="small" offset={[10, 0]}><UnorderedListOutlined /></Badge>,
      label: '资料缺失待办'
    },
    { key: '/logs', icon: <FileTextOutlined />, label: '操作留痕日志' },
    { key: '/apiretry', icon: <CloudServerOutlined />, label: '接口失败重试/导出' }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={240}
        style={{ background: '#001529' }}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: collapsed ? 16 : 18, fontWeight: 600, letterSpacing: 1,
          background: 'rgba(255,255,255,0.05)'
        }}>
          {collapsed ? '票务' : '票务核销台'}
        </div>
        <Menu theme="dark" selectedKeys={[location.pathname]} mode="inline"
          items={menuItems} onClick={({ key }) => navigate(key as string)} />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            行业峰会座位库存后台
          </Title>
          <div style={{ color: '#666', fontSize: 13 }}>
            操作员：admin
          </div>
        </Header>
        <Content style={{ padding: 16, overflow: 'auto' }}>
          <Suspense fallback={<div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>}>
            {element}
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
