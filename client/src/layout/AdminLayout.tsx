import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import { 
  CheckCircleOutlined,
  MoneyCollectOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined,
  BellOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import useUserStore from '@/store/user';
import { roleMap } from '@/utils';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useUserStore();

  const menuItems = [
    { key: '/admin/approvals', icon: <CheckCircleOutlined />, label: '授权审批' },
    { key: '/admin/pricing', icon: <MoneyCollectOutlined />, label: '计费配置' },
    { key: '/admin/reports', icon: <BarChartOutlined />, label: '数据报表' },
    { key: '/admin/settlement', icon: <FileSearchOutlined />, label: '对账中心' },
    { key: '/admin/trials', icon: <ClockCircleOutlined />, label: '试用管理' },
    ...(hasRole('SYS_ADMIN') ? [{ 
      key: '/admin/users', 
      icon: <TeamOutlined />, 
      label: '用户管理' 
    }] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'role', label: `角色：${roleMap[user?.role || 'USER']}`, disabled: true },
    { type: 'divider' as const },
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
        <div className="text-center text-white/60 text-xs py-2 border-b border-white/5">
          管理后台
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
            管理控制台
          </div>
          <Space size={20}>
            <Badge count={3} size="small">
              <BellOutlined className="text-xl text-gray-500 cursor-pointer hover:text-blue-500 transition-colors" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer hover:opacity-75 transition-opacity">
                <Avatar size={32} icon={<UserOutlined />} className="bg-gradient-to-r from-blue-500 to-indigo-500" />
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

export default AdminLayout;
