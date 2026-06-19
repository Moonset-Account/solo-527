import { Layout, Menu, Button, Dropdown, Avatar, Space, theme } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ExceptionOutlined,
  FileSearchOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { UserRole } from '../types';
import { roleLabels } from '../utils/enums';
import { useState } from 'react';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const baseMenu = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">工作台</Link> },
    { key: '/admin/appointments', icon: <CalendarOutlined />, label: <Link to="/admin/appointments">看房预约</Link> },
  ];

  if (user && (user.role === UserRole.SuperAdmin || user.role === UserRole.LandlordManager || user.role === UserRole.ConsultantManager)) {
    baseMenu.push(
      { key: '/admin/noshow', icon: <ExceptionOutlined />, label: <Link to="/admin/noshow">爽约处理</Link> },
    );
  }

  if (user && (user.role === UserRole.SuperAdmin || user.role === UserRole.ConsultantManager || user.role === UserRole.LandlordManager)) {
    baseMenu.push(
      { key: '/admin/spaces', icon: <HomeOutlined />, label: <Link to="/admin/spaces">房源管理</Link> },
    );
  }

  baseMenu.push(
    { key: '/admin/contracts', icon: <FileTextOutlined />, label: <Link to="/admin/contracts">租约合同</Link> },
  );

  if (user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance)) {
    baseMenu.push(
      { key: '/admin/bills', icon: <DollarOutlined />, label: <Link to="/admin/bills">账单管理</Link> },
    );
  }

  baseMenu.push(
    { key: '/admin/orders', icon: <ShoppingOutlined />, label: <Link to="/admin/orders">订单履约</Link> },
  );

  if (user && user.role === UserRole.SuperAdmin) {
    baseMenu.push(
      { key: '/admin/logs', icon: <FileSearchOutlined />, label: <Link to="/admin/logs">操作日志</Link> },
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'role', label: `角色：${user ? roleLabels[user.role] : ''}`, disabled: true },
      { key: 'front', label: <Link to="/">返回前台</Link>, icon: <HomeOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 18, fontWeight: 'bold' }}>
          {collapsed ? '🏢' : '🏢 预约管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={baseMenu}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <Button
            type="text"
            icon={collapsed ? <span style={{ fontSize: 18 }}>☰</span> : <span style={{ fontSize: 18 }}>☰</span>}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.realName || user?.userName}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
