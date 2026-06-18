import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  TeamOutlined,
  ScheduleOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  BellOutlined,
  DashboardOutlined,
  WarningOutlined,
  BarChartOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api';
import { UserRoleMap } from '../../types';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.notifications.unreadCount().then((res: any) => setUnreadCount(res.count)).catch(() => {});
    }
  }, [user]);

  const isStudent = user?.role === 'Student';

  const studentItems = [
    { key: '/my/classes', icon: <TeamOutlined />, label: '我的班级' },
    { key: '/my/schedule', icon: <ScheduleOutlined />, label: '我的课表' },
    { key: '/my/feedbacks', icon: <FileTextOutlined />, label: '作品反馈' },
    { key: '/my/notifications', icon: <BellOutlined />, label: '消息通知' },
    { key: '/my/report', icon: <BarChartOutlined />, label: '月度报告' }
  ];

  const adminItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '数据总览' },
    { key: '/classes', icon: <AppstoreOutlined />, label: '班级管理' },
    { key: '/schedules', icon: <ScheduleOutlined />, label: '课表管理' },
    { key: '/attendance', icon: <CheckSquareOutlined />, label: '考勤消课' },
    { key: '/leaves', icon: <SolutionOutlined />, label: '请假审批' },
    { key: '/feedbacks', icon: <FileSearchOutlined />, label: '家校反馈' },
    { key: '/warnings', icon: <WarningOutlined />, label: '课时预警' },
    { key: '/reports', icon: <BarChartOutlined />, label: '月度报表' },
    { key: '/logs', icon: <HistoryOutlined />, label: '操作记录' },
    { key: '/batch', icon: <FileTextOutlined />, label: '批量操作记录' }
  ];

  const menuItems = isStudent ? studentItems : adminItems;
  const selectedKey = '/' + location.pathname.split('/').slice(1).join('/');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userMenu = {
    items: [
      { key: 'info', icon: <UserOutlined />, label: `${user?.realName}（${user?.role ? UserRoleMap[user.role] : ''}）` },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220} style={{ borderRight: '1px solid #e8e8e8' }}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: '#1677ff',
          borderBottom: '1px solid #e8e8e8'
        }}>
          艺考排课系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e8e8e8',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {isStudent ? '学生工作台' : '教务管理后台'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 20, cursor: 'pointer', color: '#595959' }}
                onClick={() => navigate(isStudent ? '/my/notifications' : '/notifications')}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <span style={{ color: '#595959' }}>{user?.realName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: '#f5f7fa', padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
