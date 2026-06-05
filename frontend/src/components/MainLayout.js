import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  ScheduleOutlined,
  TeamOutlined,
  TicketOutlined,
  UserOutlined,
  ScanOutlined,
  BarChartOutlined,
  ImportOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/films', icon: <VideoCameraOutlined />, label: '影片管理' },
    { key: '/screenings', icon: <ScheduleOutlined />, label: '排片管理' },
    { key: '/members', icon: <TeamOutlined />, label: '会员管理' },
    { key: '/bookings', icon: <TicketOutlined />, label: '报名管理' },
    { key: '/guests', icon: <UserOutlined />, label: '嘉宾管理' },
    { key: '/check-in', icon: <ScanOutlined />, label: '票务核销' },
    { key: '/reports', icon: <BarChartOutlined />, label: '报表对账' },
    { key: '/import-export', icon: <ImportOutlined />, label: '导入导出' },
    { key: '/logs', icon: <FileTextOutlined />, label: '日志管理' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  ];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const roleLabels = {
    admin: '管理员',
    curator: '策展人',
    frontdesk: '前台',
    finance: '财务',
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
        }}>
          {collapsed ? '影院' : '影院策展系统'}
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
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
        }}>
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar style={{ marginRight: 8 }} icon={<UserOutlined />} />
              <span>
                {user?.username}
                <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                  ({roleLabels[user?.role] || user?.role})
                </span>
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
