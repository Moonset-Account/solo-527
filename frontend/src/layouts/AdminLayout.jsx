import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/admin/appointments',
      icon: <CalendarOutlined />,
      label: '预约管理',
    },
    {
      key: '/admin/waitlist',
      icon: <ClockCircleOutlined />,
      label: '候补队列',
    },
    {
      key: '/admin/waitlist-rules',
      icon: <OrderedListOutlined />,
      label: '候补规则',
    },
    {
      key: '/admin/services',
      icon: <FileTextOutlined />,
      label: '服务项目',
    },
    {
      key: '/admin/schedules',
      icon: <CalendarOutlined />,
      label: '排班管理',
    },
    {
      key: '/admin/refunds',
      icon: <BarChartOutlined />,
      label: '退款处理',
    },
    {
      key: '/admin/counselors',
      icon: <TeamOutlined />,
      label: '咨询师管理',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/processing-records',
      icon: <HistoryOutlined />,
      label: '操作记录',
    },
    {
      key: '/admin/cross-dept-report',
      icon: <BarChartOutlined />,
      label: '跨部门核对',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenu = {
    items: [
      {
        key: 'home',
        icon: <UserOutlined />,
        label: '返回前台',
        onClick: () => navigate('/'),
      },
      { type: 'divider' },
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
      <Sider theme="dark" width={220}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          心理咨询调度系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}（调度员）</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
