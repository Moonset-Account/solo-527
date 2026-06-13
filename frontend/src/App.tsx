import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  CarOutlined,
  BellOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import VoteList from './pages/VoteList';
import TaskList from './pages/TaskList';
import TodoList from './pages/TodoList';
import ReportPage from './pages/ReportPage';
import VoteRuleConfig from './pages/VoteRuleConfig';
import Login from './pages/Login';
import { User } from './types';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    } else if (location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/events',
      icon: <FileTextOutlined />,
      label: '事件管理',
      children: [
        { key: '/events/rectification', icon: <CheckCircleOutlined />, label: '整改复查' },
        { key: '/events/vote', icon: <CheckSquareOutlined />, label: '议题投票' },
        { key: '/events/patrol', icon: <CarOutlined />, label: '巡逻任务' },
      ],
    },
    {
      key: '/votes',
      icon: <CheckSquareOutlined />,
      label: '投票管理',
    },
    {
      key: '/tasks',
      icon: <CarOutlined />,
      label: '任务管理',
    },
    {
      key: '/todos',
      icon: <Badge count={3}><BellOutlined /></Badge>,
      label: '待办事项',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '数据报表',
    },
    {
      key: '/vote-rules',
      icon: <SettingOutlined />,
      label: '投票规则配置',
    },
  ];

  if (!user && location.pathname === '/login') {
    return <Login onLogin={(userData, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      navigate('/');
    }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout className="app-container" style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="sidebar-logo">
          {collapsed ? '北桥' : '北桥网格事件台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space size={24}>
            <Badge count={3}>
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} onClick={() => navigate('/todos')} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="main-content">
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/events/:type" element={<EventList />} />
            <Route path="/events" element={<Navigate to="/events/rectification" replace />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/votes" element={<VoteList />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/vote-rules" element={<VoteRuleConfig />} />
            <Route path="/login" element={<Login onLogin={() => {}} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
