import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { UserRole } from '../types';
import { roleLabels } from '../utils/enums';

const { Header, Content, Footer } = Layout;

function FrontLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">房源大厅</Link> },
  ];

  if (isAuthenticated && user) {
    if (user.role === UserRole.Customer) {
      items.push(
        { key: '/my-appointments', icon: <CalendarOutlined />, label: <Link to="/my-appointments">我的预约</Link> },
        { key: '/my-contracts', icon: <FileTextOutlined />, label: <Link to="/my-contracts">我的租约</Link> },
        { key: '/my-bills', icon: <DollarOutlined />, label: <Link to="/my-bills">我的账单</Link> },
      );
    }
    if (user.role !== UserRole.Customer) {
      items.push(
        { key: '/admin', icon: <SettingOutlined />, label: <Link to="/admin">管理后台</Link> },
      );
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenu = {
    items: [
      { key: 'role', label: `角色：${user ? roleLabels[user.role] : ''}`, disabled: true },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <h2 style={{ margin: 0, color: '#1677ff' }}>🏢 联合办公预约</h2>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={items}
            style={{ border: 'none', flex: 1, minWidth: 400 }}
          />
        </div>
        <div>
          {isAuthenticated ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.realName || user?.userName}</span>
              </Space>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
          )}
        </div>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div style={{ background: '#fff', borderRadius: 8, minHeight: 'calc(100vh - 180px)', padding: 24 }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        联合办公房源预约管理系统 ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}

export default FrontLayout;
