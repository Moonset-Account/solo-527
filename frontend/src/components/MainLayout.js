import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  FormOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount, fetchNotifications, notifications, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">预算看板</Link>,
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: <Link to="/projects">项目管理</Link>,
    },
    {
      key: '/quotations',
      icon: <FormOutlined />,
      label: <Link to="/quotations">报价管理</Link>,
    },
    {
      key: '/budgets',
      icon: <FileTextOutlined />,
      label: <Link to="/budgets">预算管理</Link>,
    },
    {
      key: '/materials',
      icon: <AppstoreOutlined />,
      label: <Link to="/materials">材料管理</Link>,
    },
    {
      key: '/material-lists',
      icon: <LineChartOutlined />,
      label: <Link to="/material-lists">材料清单</Link>,
    },
    {
      key: '/inspections',
      icon: <CheckCircleOutlined />,
      label: <Link to="/inspections">巡检验收</Link>,
    },
    {
      key: '/repairs',
      icon: <ToolOutlined />,
      label: <Link to="/repairs">售后报修</Link>,
    },
    {
      key: '/search',
      icon: <SettingOutlined />,
      label: <Link to="/search">综合查询</Link>,
    },
  ];

  const notificationMenu = {
    items: [
      ...(notifications.slice(0, 5).map(n => ({
        key: n.id,
        label: (
          <div onClick={() => useNotificationStore.getState().markRead(n.id)}>
            <div style={{ fontWeight: 600 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{n.message.slice(0, 50)}...</div>
          </div>
        ),
      }))),
      { type: 'divider' },
      {
        key: 'all-read',
        label: <span onClick={markAllRead}>全部标为已读</span>,
      },
    ],
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/login');
        },
      },
    ],
  };

  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Layout className="app-container" style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 600 }}>
          施工验收台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <Dropdown menu={notificationMenu} trigger={['click']} onOpenChange={(open) => open && fetchNotifications()}>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
          </Dropdown>
          <Dropdown menu={userMenu} trigger={['click']}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <span>{user?.full_name || user?.email}</span>
            </div>
          </Dropdown>
        </Header>
        <Content>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
