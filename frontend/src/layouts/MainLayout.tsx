import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Badge,
  Button,
  Tooltip,
  Popover,
  List,
  Tag,
  Typography,
  Divider,
} from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  UserOutlined,
  BellOutlined,
  WarningOutlined,
  BarChartOutlined,
  LineChartOutlined,
  HistoryOutlined,
  UserSwitchOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore, useAuthStore } from '../store';
import { roleLabel } from '../types';
import { todoApi, authApi } from '../services/api';
import { todoPriorityColor, todoPriorityLabel, todoStatusLabel, todoTypeLabel } from '../types';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
  badge?: number;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const collapsed = useAppStore((s) => s.collapsed);
  const toggleCollapsed = useAppStore((s) => s.toggleCollapsed);
  const currentPath = useAppStore((s) => s.currentPath);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [todoCount, setTodoCount] = useState(0);
  const [todoList, setTodoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodoStats();
  }, []);

  const loadTodoStats = async () => {
    try {
      setLoading(true);
      const [board, listData] = await Promise.all([
        todoApi.boardStats({ myOnly: true }),
        todoApi.list({ myOnly: true, status: 'PENDING', pageSize: 5, page: 1 }),
      ]);
      setTodoList(listData.list || []);
      const pending = board.byStatus?.find((b: any) => b.status === 'PENDING')?._count || 0;
      const inProgress = board.byStatus?.find((b: any) => b.status === 'IN_PROGRESS')?._count || 0;
      setTodoCount(pending + inProgress);
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuItem[] = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/camps', icon: <CalendarOutlined />, label: '营期安排' },
    { key: '/checkin', icon: <CheckSquareOutlined />, label: '打卡台' },
    { key: '/members', icon: <TeamOutlined />, label: '会员管理' },
    { key: '/todos', icon: <FileTextOutlined />, label: '待办中心', badge: todoCount },
    { key: '/lagging', icon: <WarningOutlined />, label: '掉队学员' },
    { key: '/conversion', icon: <BarChartOutlined />, label: '转化来源' },
    { key: '/retention', icon: <LineChartOutlined />, label: '留存报表' },
    { key: '/handover', icon: <UserSwitchOutlined />, label: '交接班视图', roles: ['ADMIN', 'OPERATOR'] },
    { key: '/logs', icon: <HistoryOutlined />, label: '操作日志', roles: ['ADMIN'] },
    { key: '/users', icon: <UserOutlined />, label: '用户管理', roles: ['ADMIN'] },
  ];

  const visibleItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user ? item.roles.includes(user.role) : false;
  });

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/users'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      onClick: () => {},
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getOpenKeys = () => {
    for (const item of visibleItems) {
      if (currentPath.startsWith(item.key)) return [item.key];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            color: '#fff',
            fontSize: collapsed ? 16 : 16,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <RiseOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: collapsed ? 0 : 8 }} />
          {!collapsed && <span>亲子训练营</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPath]}
          defaultOpenKeys={getOpenKeys()}
          items={visibleItems.map((item) => ({
            key: item.key,
            icon: item.badge ? (
              <Badge size="small" count={item.badge} offset={[6, -2]} color={item.badge > 5 ? '#ff4d4f' : '#faad14'}>
                {item.icon}
              </Badge>
            ) : (
              item.icon
            ),
            label: item.label,
          }))}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: 16 }}
            />
            <Text strong style={{ fontSize: 15 }}>
              亲子训练营社群打卡台
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Popover
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>我的待办</Text>
                  <Button type="link" size="small" onClick={() => navigate('/todos')}>
                    查看全部
                  </Button>
                </div>
              }
              content={
                <List
                  loading={loading}
                  dataSource={todoList}
                  locale={{ emptyText: '暂无待办事项' }}
                  renderItem={(item) => (
                    <List.Item
                      onClick={() => navigate('/todos')}
                      style={{ cursor: 'pointer', padding: '8px 0' }}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Tag color={todoPriorityColor[item.priority as any]} style={{ margin: 0 }}>
                              {todoPriorityLabel[item.priority as any]}
                            </Tag>
                            <Tag color={todoStatusLabel[item.status as any] === '待处理' ? 'warning' : 'processing'} style={{ margin: 0 }}>
                              {todoStatusLabel[item.status as any]}
                            </Tag>
                            <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                          </div>
                        }
                        description={
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            <span>{todoTypeLabel[item.type as any]}</span>
                            {item.dueDate && (
                              <>
                                <span style={{ margin: '0 6px' }}>·</span>
                                <span style={{ color: dayjs(item.dueDate).isBefore(dayjs()) ? '#ff4d4f' : undefined }}>
                                  截止：{dayjs(item.dueDate).fromNow()}
                                </span>
                              </>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  style={{ width: 380, maxHeight: 420, overflow: 'auto' }}
                />
              }
              trigger="click"
              placement="bottomRight"
            >
              <Tooltip title="待办事项">
                <Badge count={todoCount} size="small" offset={[4, -2]}>
                  <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
                </Badge>
              </Tooltip>
            </Popover>

            <Divider type="vertical" style={{ margin: 0 }} />

            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {user ? roleLabel[user.role as keyof typeof roleLabel] : ''}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            overflow: 'auto',
          }}
        >
          <div className="page-container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
