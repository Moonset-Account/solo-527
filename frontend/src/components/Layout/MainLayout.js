import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  VoteOutlined,
  SafetyOutlined,
  HeartOutlined,
  TodoOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getRoleText } from '../../utils/helpers';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/residents',
      icon: <TeamOutlined />,
      label: '居民台账',
    },
    {
      key: '/topics',
      icon: <FileTextOutlined />,
      label: '议题管理',
    },
    {
      key: '/voting',
      icon: <VoteOutlined />,
      label: '投票管理',
    },
    {
      key: '/patrol',
      icon: <SafetyOutlined />,
      label: '巡逻任务',
    },
    {
      key: '/assistance',
      icon: <HeartOutlined />,
      label: '帮扶需求',
    },
    {
      key: '/tasks',
      icon: <TodoOutlined />,
      label: '任务看板',
    },
    {
      key: '/volunteers',
      icon: <EnvironmentOutlined />,
      label: '志愿者路线',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const selectedKey = menuItems.find(item => 
    location.pathname.startsWith(item.key)
  )?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo">
          {collapsed ? '社区' : '社区议题管理系统'}
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
        <Header className="site-layout-background" style={{ padding: 0, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined className="trigger" onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined className="trigger" onClick={() => setCollapsed(true)} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 24 }}>
            <Badge count={0} style={{ marginRight: 24, cursor: 'pointer' }}>
              <BellOutlined style={{ fontSize: 18 }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>
                  {user?.username || '用户'}
                  <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                    ({getRoleText(user?.role)})
                  </span>
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="site-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
