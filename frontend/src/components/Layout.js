import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  AuditOutlined,
  ShopOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/leads',
      icon: <UserOutlined />,
      label: '线索管理',
    },
    {
      key: '/public-sea',
      icon: <ShopOutlined />,
      label: '公海池',
    },
    {
      key: '/consultations',
      icon: <MedicineBoxOutlined />,
      label: '咨询记录',
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: '合同管理',
    },
    {
      key: '/contract-approval',
      icon: <AuditOutlined />,
      label: '折扣审批',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
    },
    {
      key: '/operation-logs',
      icon: <HistoryOutlined />,
      label: '操作日志',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    dispatch(logout());
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
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
        onClick: () => navigate('/settings'),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo" style={{ color: '#fff', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
          {collapsed ? '牙科' : '牙科诊所系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: '0 24px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {collapsed ? (
                <MenuUnfoldOutlined onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, cursor: 'pointer' }} />
              ) : (
                <MenuFoldOutlined onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, cursor: 'pointer' }} />
              )}
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {menuItems.find(item => item.key === selectedKey)?.label || '工作台'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Badge count={3} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                  <span>{user?.full_name || user?.email}</span>
                </Space>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
