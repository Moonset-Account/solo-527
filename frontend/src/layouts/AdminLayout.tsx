import { Layout, Menu, Badge, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  SettingOutlined,
  BellOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  CarOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useReminderStore } from '@/store/reminderStore';
import { ROLE_LABELS } from '@/utils';

const { Header, Sider, Content } = Layout;

const adminMenuItems: MenuProps['items'] = [
  {
    key: '/admin',
    icon: <HomeOutlined />,
    label: '仪表盘',
  },
  {
    key: '/admin/inventory',
    icon: <CalendarOutlined />,
    label: '房态管理',
  },
  {
    key: '/admin/orders',
    icon: <ShoppingOutlined />,
    label: '订单管理',
    children: [
      { key: '/admin/orders', label: '订单列表' },
      { key: '/admin/orders/conversion', label: '入住转化' },
    ],
  },
  {
    key: '/admin/reminders',
    icon: <ExclamationCircleOutlined />,
    label: '提醒中心',
    children: [
      { key: '/admin/reminders', label: '提醒列表' },
      { key: '/admin/reminders/rules', label: '提醒规则' },
    ],
  },
  {
    key: '/admin/configuration',
    icon: <SettingOutlined />,
    label: '后台配置',
    children: [
      { key: '/admin/configuration/tour-routes', icon: <CarOutlined />, label: '导览路线' },
      { key: '/admin/configuration/cleaning-tasks', icon: <SwapOutlined />, label: '清洁任务' },
      { key: '/admin/configuration/itinerary-versions', icon: <BarChartOutlined />, label: '行程版本' },
    ],
  },
  {
    key: '/admin/audit',
    icon: <HistoryOutlined />,
    label: '操作日志',
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount, overdueCount, fetchUnreadCount } = useReminderStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.real_name || user?.email,
      disabled: true,
    },
    {
      key: 'role',
      label: `角色：${ROLE_LABELS[user?.role || 'operator']}`,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white m-0">青禾房态行程台</h1>
        </div>
        <div className="flex items-center gap-6">
          <Badge
            count={unreadCount}
            size="small"
            offset={[-2, 2]}
            className="cursor-pointer"
          >
            <BellOutlined
              className="text-white text-xl cursor-pointer hover:text-green-200 transition-colors"
              onClick={() => navigate('/admin/reminders')}
            />
          </Badge>
          {overdueCount > 0 && (
            <Badge
              count={`${overdueCount}逾期`}
              size="small"
              className="bg-red-500"
            >
              <span className="text-white text-sm cursor-pointer" onClick={() => navigate('/admin/reminders')}>
                逾期提醒
              </span>
            </Badge>
          )}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-1 rounded-lg transition-colors">
              <Avatar size="small" icon={<UserOutlined />} className="bg-primary-600" />
              <span className="text-white">{user?.real_name || user?.email}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={220} className="bg-white border-r border-gray-200">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={adminMenuItems}
            onClick={handleMenuClick}
            className="h-full border-r-0"
          />
        </Sider>
        <Content className="p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
