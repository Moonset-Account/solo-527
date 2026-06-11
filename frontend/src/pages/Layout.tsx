import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag, Space } from 'antd';
import {
  ShoppingCartOutlined,
  PlayCircleOutlined,
  BookOutlined,
  TeamOutlined,
  GiftOutlined,
  BarChartOutlined,
  FolderOutlined,
  EditOutlined,
  DollarOutlined,
  RollbackOutlined,
  LogoutOutlined,
  UserOutlined,
  AppstoreOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const roleMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  ADMIN: { text: '超级管理员', color: 'gold', icon: <CrownOutlined /> },
  OPERATOR: { text: '运营专员', color: 'blue', icon: <TeamOutlined /> },
  STUDENT: { text: '学员', color: 'green', icon: <UserOutlined /> },
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isOperator = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const roleInfo = user?.role ? roleMap[user.role] || { text: user.role, color: 'default', icon: <UserOutlined /> } : null;

  const studentItems = [
    { key: '/', icon: <AppstoreOutlined />, label: '首页' },
    { key: '/purchase', icon: <ShoppingCartOutlined />, label: '购买课程' },
    { key: '/continue-study', icon: <PlayCircleOutlined />, label: '继续学习' },
  ];

  const operatorItems = [
    { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: '/classes', icon: <TeamOutlined />, label: '班级配置' },
    { key: '/coupons', icon: <GiftOutlined />, label: '优惠管理' },
    { key: '/completion-rate', icon: <BarChartOutlined />, label: '完课率统计' },
    { key: '/materials', icon: <FolderOutlined />, label: '营期资料' },
    { key: '/assignments', icon: <EditOutlined />, label: '作业点评' },
    { key: '/commissions', icon: <DollarOutlined />, label: '分销佣金' },
    { key: '/refunds', icon: <RollbackOutlined />, label: '退款异常' },
  ];

  const items = isOperator ? operatorItems : studentItems;

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/login', { replace: true });
        },
      },
    ],
  };

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
            borderBottom: '1px solid #333',
          }}
        >
          <Title level={5} style={{ color: '#fff', margin: 0 }}>
            青禾课程运营台
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                <span style={{ fontSize: 14 }}>{user?.nickname || user?.username}</span>
                {roleInfo && (
                  <Tag color={roleInfo.color} size="small" icon={roleInfo.icon} style={{ marginTop: 2 }}>
                    {roleInfo.text}
                  </Tag>
                )}
              </Space>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <div
            style={{
              padding: 24,
              background: '#fff',
              borderRadius: 8,
              minHeight: 'calc(100vh - 160px)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
