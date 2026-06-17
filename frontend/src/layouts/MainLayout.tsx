import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  DashboardOutlined,
  AlertOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  BugOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { notificationApi } from '../api';
import { UserRole } from '../types';
import { userRoleText } from '../utils';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { collapsed, toggleCollapsed } = useAppStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data || 0);
      }
    } catch {
      // ignore
    }
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/alerts', icon: <AlertOutlined />, label: '告警管理' },
    { key: '/assets', icon: <AppstoreOutlined />, label: '资产管理' },
    { key: '/batch-tasks', icon: <ThunderboltOutlined />, label: '批量任务' },
    { key: '/vulnerabilities', icon: <BugOutlined />, label: '漏洞管理' },
    ...(user?.role === UserRole.Admin
      ? [
          { key: '/audit-logs', icon: <FileTextOutlined />, label: '审计日志' },
          { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
        ]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: user?.fullName || user?.userName,
      },
      {
        key: 'role',
        label: userRoleText[user?.role || UserRole.StoreOperator],
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '运维' : '运维工单台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
          />
          <Space size="middle">
            <Badge count={unreadCount} offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={handleNotificationClick}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.fullName || user?.userName}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
