import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Badge, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CalendarOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  StarOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { notificationApi } from '../api/notification';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState({ total: 0, urgent: 0, normal: 0 });

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const roleNames: Record<string, string> = {
    admin: '系统管理员',
    hr: '招聘经理',
    interviewer: '面试官',
    candidate: '候选人',
  };

  const getMenuItems = () => {
    const items: any[] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '工作台',
        onClick: () => navigate('/dashboard'),
      },
    ];

    if (user?.role === 'candidate') {
      items.push(
        {
          key: '/resume/submit',
          icon: <FileTextOutlined />,
          label: '投递简历',
          onClick: () => navigate('/resume/submit'),
        },
        {
          key: '/resume/progress',
          icon: <ClockCircleOutlined />,
          label: '进度查询',
          onClick: () => navigate('/resume/progress'),
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: '消息通知',
          onClick: () => navigate('/notifications'),
        }
      );
    } else {
      items.push(
        {
          key: 'resume',
          icon: <FileTextOutlined />,
          label: '简历管理',
          children: [
            { key: '/resumes', label: '简历列表', onClick: () => navigate('/resumes') },
            { key: '/resume/progress', label: '进度跟踪', onClick: () => navigate('/resume/progress') },
          ],
        },
        {
          key: 'question',
          icon: <QuestionCircleOutlined />,
          label: '题库管理',
          children: [
            { key: '/questions', label: '题目管理', onClick: () => navigate('/questions') },
            { key: '/question-banks', label: '题库列表', onClick: () => navigate('/question-banks') },
            { key: '/scoring-criteria', label: '评分标准', onClick: () => navigate('/scoring-criteria') },
          ],
        },
        {
          key: 'interview',
          icon: <CalendarOutlined />,
          label: '面试管理',
          children: [
            { key: '/interviews', label: '面试安排', onClick: () => navigate('/interviews') },
            { key: '/interview-schedule', label: '面试官档期', onClick: () => navigate('/interview-schedule') },
            { key: '/interview-quality', label: '面试质量', onClick: () => navigate('/interview-quality') },
          ],
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: '通知中心',
          onClick: () => navigate('/notifications'),
        },
        {
          key: 'recruitment',
          icon: <TeamOutlined />,
          label: '招聘周期',
          children: [
            { key: '/recruitment-cycles', label: '招聘周期', onClick: () => navigate('/recruitment-cycles') },
            { key: '/processing-records', label: '处理记录', onClick: () => navigate('/processing-records') },
          ],
        }
      );

      if (user?.role === 'admin') {
        items.push({
          key: '/users',
          icon: <SettingOutlined />,
          label: '用户管理',
          onClick: () => navigate('/users'),
        });
      }
    }

    return items;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.1)',
        }}>
          {collapsed ? '校招' : '校园招聘测评平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {roleNames[user?.role || 'candidate']} 工作台
          </div>
          <Space size="large">
            <Badge count={unreadCount.total} size="small">
              <BellOutlined
                style={{ fontSize: 20, cursor: 'pointer', color: '#666' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name || '用户'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="layout-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
