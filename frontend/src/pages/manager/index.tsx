import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import {
  DashboardOutlined,
  ReadOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import Dashboard from './dashboard';
import TrainingRecords from './training-records';
import AdoptionRecords from './adoption-records';
import HealthRecords from './health-records';
import FosterRecords from './foster-records';
import Reports from './reports';

const { Header, Sider, Content } = Layout;

const ManagerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getSelectedKey = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

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

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: 'training',
      icon: <ReadOutlined />,
      label: '训练记录',
    },
    {
      key: 'adoption',
      icon: <HeartOutlined />,
      label: '领养资料',
    },
    {
      key: 'health',
      icon: <MedicineBoxOutlined />,
      label: '健康变化',
    },
    {
      key: 'foster',
      icon: <HomeOutlined />,
      label: '寄养安全',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          🐾 宠物店管理系统
        </div>
        <div
          style={{
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 13,
            padding: '8px 0',
          }}
        >
          店长工作台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
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
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: '#262626' }}>
            {menuItems.find((item) => item.key === getSelectedKey())?.label || '店长工作台'}
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <span style={{ color: '#262626' }}>{user?.username || '店长'}</span>
              <DownOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 'calc(100vh - 112px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="training" element={<TrainingRecords />} />
            <Route path="adoption" element={<AdoptionRecords />} />
            <Route path="health" element={<HealthRecords />} />
            <Route path="foster" element={<FosterRecords />} />
            <Route path="reports" element={<Reports />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagerPage;
