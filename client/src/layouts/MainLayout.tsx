
import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  ShopOutlined,
  BellOutlined,
  ToolOutlined,
  BatchProcessingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
      onClick: () => navigate('/')
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: '订单管理',
      onClick: () => navigate('/orders')
    },
    {
      key: '/orders/create',
      icon: <PlusCircleOutlined />,
      label: '订单录入',
      onClick: () => navigate('/orders/create')
    },
    {
      key: '/store-summary',
      icon: <ShopOutlined />,
      label: '门店汇总',
      onClick: () => navigate('/store-summary')
    },
    {
      key: '/delivery-reminders',
      icon: <BellOutlined />,
      label: '交付提醒',
      onClick: () => navigate('/delivery-reminders')
    },
    {
      key: '/equipment',
      icon: <ToolOutlined />,
      label: '设备管理',
      onClick: () => navigate('/equipment')
    },
    {
      key: '/batch-operations',
      icon: <BatchProcessingOutlined />,
      label: '批量处理',
      onClick: () => navigate('/batch-operations')
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo">
          {collapsed ? '印刷' : '印刷厂协同平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <div style={{ marginLeft: 16, fontSize: 18, fontWeight: 500 }}>
            印刷厂订单门店协同台面
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
