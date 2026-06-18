import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Typography } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import ServicesPage from './services';
import AppointmentsPage from './appointments';
import ProfilePage from './profile';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const CustomerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/appointments')) return 'appointments';
    if (path.includes('/services')) return 'services';
    if (path.includes('/profile')) return 'profile';
    return 'services';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/customer/${key}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
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
          顾客前台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          onClick={handleMenuClick}
          style={{ marginTop: 16 }}
          items={[
            {
              key: 'services',
              icon: <AppstoreOutlined />,
              label: '预约服务',
            },
            {
              key: 'appointments',
              icon: <CalendarOutlined />,
              label: '我的预约',
            },
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: '个人中心',
            },
          ]}
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
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
              <Avatar icon={<UserOutlined />} />
              <Space direction="vertical" size={0}>
                <Text strong>{user?.name || user?.username}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.phone || ''}
                </Text>
              </Space>
              <DownOutlined style={{ fontSize: 12 }} />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Navigate to="services" replace />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CustomerPage;
