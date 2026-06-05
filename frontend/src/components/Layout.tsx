import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Badge, List, Spin, theme, Popover } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  PayCircleOutlined,
  AuditOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  CameraOutlined,
  FileProtectOutlined,
  UserSwitchOutlined,
  HeartOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/store/authStore';
import type { UserRole, Notification } from '@/types';
import { getUnreadCount, getNotifications, markAsRead } from '@/api/notifications';

const { Header, Sider, Content } = AntLayout;

interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  path: string;
}

const roleMenus: Record<UserRole, MenuItem[]> = {
  admin: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘', path: '/admin' },
    { key: 'children', icon: <UserSwitchOutlined />, label: '儿童管理', path: '/admin/children' },
    { key: 'staff', icon: <TeamOutlined />, label: '员工管理', path: '/admin/staff' },
    { key: 'payments', icon: <PayCircleOutlined />, label: '缴费概览', path: '/admin/payments' },
    { key: 'audit-log', icon: <AuditOutlined />, label: '审计日志', path: '/admin/audit-log' },
  ],
  teacher: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘', path: '/teacher' },
    { key: 'daily-record', icon: <EditOutlined />, label: '每日记录', path: '/teacher/daily-record' },
    { key: 'pickup-verify', icon: <SafetyCertificateOutlined />, label: '接送核验', path: '/teacher/pickup-verify' },
    { key: 'growth-album', icon: <CameraOutlined />, label: '成长相册', path: '/teacher/growth-album' },
    { key: 'leave-manage', icon: <FileProtectOutlined />, label: '请假管理', path: '/teacher/leave-manage' },
  ],
  parent: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘', path: '/parent' },
    { key: 'my-child', icon: <UserSwitchOutlined />, label: '我的孩子', path: '/parent/my-child' },
    { key: 'pickup-auth', icon: <HeartOutlined />, label: '接送授权', path: '/parent/pickup-auth' },
    { key: 'leave-request', icon: <FileProtectOutlined />, label: '请假申请', path: '/parent/leave-request' },
    { key: 'payments', icon: <PayCircleOutlined />, label: '缴费记录', path: '/parent/payments' },
  ],
};

const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  parent: '家长',
};

const roleColors: Record<UserRole, string> = {
  admin: 'red',
  teacher: 'blue',
  parent: 'green',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.unread);
    } catch {}
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await getNotifications({ page_size: 10 });
      setNotifications(res.results);
    } catch {}
    setNotifLoading(false);
  };

  const handleNotifClick = async (item: Notification) => {
    if (!item.is_read) {
      try {
        await markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
  };

  if (!user) return null;

  const menuItems = roleMenus[user.role];

  const selectedKey =
    menuItems.find((item) => location.pathname === item.path)?.key || 'dashboard';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const item = menuItems.find((m) => m.key === key);
    if (item) navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dropdownItems: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  const notifContent = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <Spin spinning={notifLoading}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无通知</div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: item.is_read ? 'transparent' : '#f0f5ff',
                  padding: '8px 12px',
                }}
                onClick={() => handleNotifClick(item)}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.is_urgent && (
                        <span style={{ color: '#ff4d4f', marginRight: 4 }}>【紧急】</span>
                      )}
                      {item.title}
                    </span>
                  }
                  description={
                    <span style={{ fontSize: 12 }}>
                      {item.content.length > 60 ? item.content.slice(0, 60) + '...' : item.content}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );

  const displayName = user.first_name || user.last_name
    ? `${user.first_name}${user.last_name}`
    : user.username;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeToken.colorPrimary,
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '幼' : '幼教管理平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
            background: themeToken.colorBgContainer,
          }}
        >
          <Popover
            content={notifContent}
            title="通知消息"
            trigger="click"
            onOpenChange={(open) => {
              if (open) fetchNotifications();
            }}
          >
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
          </Popover>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
              <span>{displayName}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '0 6px',
                  borderRadius: 4,
                  color: '#fff',
                  background: roleColors[user.role],
                }}
              >
                {roleLabels[user.role]}
              </span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: themeToken.colorBgContainer,
              borderRadius: themeToken.borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
