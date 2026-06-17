import { Layout, Menu, Typography, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { EnvironmentOutlined, HomeOutlined } from '@ant-design/icons'

const { Header, Content, Footer } = Layout
const { Title } = Typography

const PublicLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <EnvironmentOutlined />,
      label: '导览路线',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <HomeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>城市导览</Title>
          </Space>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ border: 'none', minWidth: 200 }}
          />
        </div>
      </Header>
      <Content style={{ padding: '24px 0', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        城市导览房态库存系统 ©{new Date().getFullYear()} Created with Spring Boot + React
      </Footer>
    </Layout>
  )
}

export default PublicLayout
