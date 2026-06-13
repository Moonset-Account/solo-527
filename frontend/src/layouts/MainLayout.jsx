import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  DollarOutlined,
  SyncOutlined,
  BellOutlined,
  UndoOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';

  const financeMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/bills',
      icon: <FileTextOutlined />,
      label: '应收账单',
    },
    {
      key: '/invoices',
      icon: <FileSearchOutlined />,
      label: '发票管理',
    },
    {
      key: '/payments',
      icon: <DollarOutlined />,
      label: '付款记录',
    },
    {
      key: '/transactions',
      icon: <SyncOutlined />,
      label: '流水匹配',
    },
    {
      key: '/collections',
      icon: <BellOutlined />,
      label: '催款提醒',
    },
    {
      key: '/refunds',
      icon: <UndoOutlined />,
      label: '退款管理',
    },
    {
      key: '/writeoffs',
      icon: <FileTextOutlined />,
      label: '冲销审批',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '回款统计',
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: '客户管理',
    },
  ];

  const customerMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/bills',
      icon: <FileTextOutlined />,
      label: '应收账单',
    },
    {
      key: '/invoices',
      icon: <FileSearchOutlined />,
      label: '我的发票',
    },
    {
      key: '/payment-entry',
      icon: <DollarOutlined />,
      label: '付款入口',
    },
    {
      key: '/payments',
      icon: <DollarOutlined />,
      label: '付款记录',
    },
    {
      key: '/refunds',
      icon: <UndoOutlined />,
      label: '退款申请',
    },
  ];

  const menuItems = isCustomer ? customerMenuItems : financeMenuItems;

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

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
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
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

  const getRoleName = (role) => {
    const roleMap = {
      ADMIN: '系统管理员',
      FINANCE_MANAGER: '财务经理',
      FINANCE_STAFF: '财务专员',
      CUSTOMER: '客户',
    };
    return roleMap[role] || role;
  };

  return (
    <Layout className="layout-wrapper">
      <Sider
        width={220}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 6,
        }}>
          账单对账中心
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout style={{ marginLeft: 220 }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{getRoleName(user?.role)}</div>
              </div>
            </Space>
          </Dropdown>
        </Header>
        
        <Content
          style={{
            margin: '24px',
            padding: 0,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
