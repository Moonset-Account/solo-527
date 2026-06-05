import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Badge, Drawer } from 'antd';
import { 
  HomeOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  BellOutlined,
  MenuFoldOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { notificationsApi } from '../api';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res.data.count);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    { key: '/mentors', icon: <TeamOutlined />, label: '导师列表' },
    { key: '/appointments', icon: <CalendarOutlined />, label: '我的预约' },
    { key: '/profile', icon: <UserOutlined />, label: '个人资料' },
    { key: '/notifications', icon: <Badge count={unreadCount}><BellOutlined /></Badge>, label: '消息通知' },
    ...(user?.role === 'admin' ? [{ key: '/admin/review', icon: <TeamOutlined />, label: '审核管理' }] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Layout className="h-full">
      <Header className="bg-white px-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button type="text" icon={<MenuFoldOutlined />} onClick={() => setMobileMenuOpen(true)} />
          )}
          <h1 className="text-lg font-semibold m-0">校友导师平台</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge count={unreadCount} size="small">
            <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/notifications')} />
          </Badge>
          <span className="hidden md:inline">{user?.name}</span>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} />
        </div>
      </Header>
      
      <Layout>
        {!isMobile ? (
          <Sider 
            theme="light" 
            collapsible 
            collapsed={collapsed} 
            onCollapse={setCollapsed}
            className="min-h-[calc(100vh-64px)]"
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
        ) : (
          <Drawer
            placement="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            width={280}
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Drawer>
        )}
        
        <Content className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
