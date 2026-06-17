import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { UserOutlined, CalendarOutlined, ClockCircleOutlined, LogoutOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Content, Footer } = Layout;

function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'appointments',
        icon: <CalendarOutlined />,
        label: <Link to="/my-appointments">我的预约</Link>,
      },
      {
        key: 'waitlist',
        icon: <ClockCircleOutlined />,
        label: <Link to="/my-waitlist">我的候补</Link>,
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

  const navItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/counselors', icon: <TeamOutlined />, label: <Link to="/counselors">咨询师</Link> },
  ];

  const activeKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
            心语心理
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[activeKey]}
            style={{ borderBottom: 'none', flex: 1 }}
            items={navItems}
          />
        </div>

        <div>
          {user ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user.name}</span>
              </div>
            </Dropdown>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
            </div>
          )}
        </div>
      </Header>

      <Content style={{ padding: '24px 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        心语心理咨询平台 ©{new Date().getFullYear()} 您的心理健康守护者
      </Footer>
    </Layout>
  );
}

export default ClientLayout;
