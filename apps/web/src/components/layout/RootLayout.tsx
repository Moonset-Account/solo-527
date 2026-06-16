import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import {
  DashboardOutlined,
  ScheduleOutlined,
  BookOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  GiftOutlined,
  SolutionOutlined,
  BarChartOutlined,
  DownloadOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from '@tanstack/react-router';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '运营总览' },
  { key: '/camps', icon: <ScheduleOutlined />, label: '营期管理' },
  { key: '/chapters', icon: <BookOutlined />, label: '章节管理' },
  { key: '/members', icon: <TeamOutlined />, label: '会员管理' },
  { key: '/checkins', icon: <CheckSquareOutlined />, label: '打卡记录' },
  { key: '/refunds', icon: <DollarOutlined />, label: '退款管理' },
  { key: '/benefits', icon: <GiftOutlined />, label: '会员权益' },
  { key: '/todos', icon: <SolutionOutlined />, label: '待办事项' },
  { key: '/stats', icon: <BarChartOutlined />, label: '数据报表' },
  { key: '/export', icon: <DownloadOutlined />, label: '数据导出' },
];

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate({ to: key } as any);
  };

  const userMenu = {
    items: [
      {
        key: '1',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      { type: 'divider' as const },
      {
        key: '2',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
  };

  const selectedKey = (() => {
    const path = location.pathname;
    for (const item of menuItems) {
      if (path === item.key || path.startsWith(item.key + '/')) {
        return item.key;
      }
    }
    if (path === '/') return '/dashboard';
    return '/dashboard';
  })();

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            color: 'white',
            fontSize: collapsed ? 20 : 18,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ marginRight: collapsed ? 0 : 10 }}>📚</span>
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>亲子训练营</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems as any}
          onClick={handleMenuClick}
          style={{ borderRight: 0, paddingTop: 8 }}
        />
      </Sider>
      <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              {(() => {
                const found = menuItems.find((m) => m.key === selectedKey);
                return found ? found.label : '';
              })()}
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <BellOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
              <Dropdown menu={userMenu} placement="bottomRight">
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar style={{ backgroundColor: '#722ED1' }} icon={<UserOutlined />} />
                  <span style={{ color: '#333' }}>李运营</span>
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content className="app-content">{children}</Content>
        </Layout>
      </Layout>
  );
};

export default RootLayout;
