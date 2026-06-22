import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import { 
  AppstoreOutlined, 
  KeyOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import useUserStore from '@/store/user';

const { Header, Sider, Content } = Layout;

const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const menuItems = [
    { key: '/user/plugins', icon: <AppstoreOutlined />, label: '插件市场' },
    { key: '/user/licenses', icon: <KeyOutlined />, label: '我的授权' },
    { key: '/user/applications', icon: <FileTextOutlined />, label: '申请记录' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'settings', icon: <SettingOutlined />, label: '账号设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        width={220} 
        className="bg-gradient-to-b from-slate-800 to-slate-900 border-r-0"
      >
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold border-b border-white/10">
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            插件授权计费台
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          theme="dark"
          className="border-r-0 mt-2"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white border-b flex items-center justify-between px-6 h-14">
          <div className="text-gray-600 text-sm">
            用户工作台
          </div>
          <Space size={16}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer hover:opacity-75 transition-opacity">
                <Avatar size={32} icon={<UserOutlined />} className="bg-blue-500" />
                <span className="text-gray-700">{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content className="bg-gray-50 p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserLayout;
