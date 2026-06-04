import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Typography } from 'antd';
import {
  FileTextOutlined,
  CalculatorOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import api from '../../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  roles?: UserRole[];
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count');
    }
  };

  const menuItems: MenuItem[] = [
    {
      key: '/requirements',
      icon: <FileTextOutlined />,
      label: '客户需求',
      path: '/requirements',
    },
    {
      key: '/quotes',
      icon: <CalculatorOutlined />,
      label: '报价管理',
      path: '/quotes',
    },
    {
      key: '/contracts',
      icon: <FileSearchOutlined />,
      label: '合同管理',
      path: '/contracts',
      roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE, UserRole.SALES],
    },
    {
      key: '/profit',
      icon: <BarChartOutlined />,
      label: '利润统计',
      path: '/profit',
      roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const userMenuItems = [
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '消息通知',
      onClick: () => navigate('/notifications'),
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

  const getRoleName = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: '管理员',
      [UserRole.SALES]: '销售',
      [UserRole.PRODUCT_MANAGER]: '产品经理',
      [UserRole.SUPERVISOR]: '主管',
      [UserRole.FINANCE]: '财务',
      [UserRole.OPERATION]: '运营',
    };
    return roleMap[role] || role;
  };

  const getQuickAddButton = () => {
    const path = location.pathname;
    if (path.includes('requirements')) {
      return (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/requirements/new')}>
          新建需求
        </Button>
      );
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'TQP' : '旅行报价系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems.map((item) => ({
            key: item.path,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Space>{getQuickAddButton()}</Space>
          <Space size="middle">
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {getRoleName(user?.role as UserRole)}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
