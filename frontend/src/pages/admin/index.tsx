import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import {
  CalendarOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import AppointmentsPage from './appointments';
import ServicesPage from './services';
import OperationLogsPage from './operation-logs';
import ReportsPage from './reports';
import UsersPage from './users';

const { Header, Sider, Content } = Layout;

const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getSelectedKey = () => {
    const path = location.pathname.split('/').pop() || 'appointments';
    return path;
  };

  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'appointments',
      icon: <CalendarOutlined />,
      label: '排班管理',
      onClick: () => navigate('/admin/appointments'),
    },
    {
      key: 'services',
      icon: <AppstoreOutlined />,
      label: '服务管理',
      onClick: () => navigate('/admin/services'),
    },
    {
      key: 'operation-logs',
      icon: <FileTextOutlined />,
      label: '操作日志',
      onClick: () => navigate('/admin/operation-logs'),
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
      onClick: () => navigate('/admin/reports'),
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: '用户管理',
      onClick: () => navigate('/admin/users'),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        type: 'divider' as const,
      },
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
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={200}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '宠物' : '宠物管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} src={undefined} />
              <span style={{ color: '#333' }}>{user?.name || user?.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Navigate to="appointments" replace />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="operation-logs" element={<OperationLogsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;
