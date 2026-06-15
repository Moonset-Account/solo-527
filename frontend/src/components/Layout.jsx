import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  PayCircleOutlined,
  GiftOutlined,
  CrownOutlined,
  ToolOutlined,
  CarOutlined,
  FunnelPlotOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import useAuthStore from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';

const { Sider, Header, Content } = AntLayout;

const allMenuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '工作台',
    group: '工作台',
  },
  {
    key: '/bookings',
    icon: <CalendarOutlined />,
    label: '预约管理',
    group: '业务入口',
  },
  {
    key: '/payments',
    icon: <PayCircleOutlined />,
    label: '支付管理',
    group: '业务入口',
  },
  {
    key: '/membership/packages',
    icon: <GiftOutlined />,
    label: '套餐配置',
    group: '会员管理',
  },
  {
    key: '/membership/benefits',
    icon: <CrownOutlined />,
    label: '权益管理',
    group: '会员管理',
  },
  {
    key: '/services',
    icon: <ToolOutlined />,
    label: '服务项目',
    group: '服务管理',
  },
  {
    key: '/test-drives',
    icon: <CarOutlined />,
    label: '试驾时段',
    group: '服务管理',
  },
  {
    key: '/conversion',
    icon: <FunnelPlotOutlined />,
    label: '到店转化',
    group: '数据分析',
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: '转化报表',
    group: '数据分析',
  },
  {
    key: '/cashier',
    icon: <ShoppingCartOutlined />,
    label: '收银班次',
    group: '收银管理',
  },
  {
    key: '/alerts',
    icon: <BellOutlined />,
    label: '告警提醒',
    group: '系统通知',
  },
];

const memberAllowedKeys = ['/', '/bookings', '/membership/packages', '/membership/benefits'];

const groupOrder = ['工作台', '业务入口', '会员管理', '服务管理', '数据分析', '收银管理', '系统通知'];

const Layout = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const filteredItems = useMemo(() => {
    const isMember = hasRole(USER_ROLES.MEMBER) && !hasRole(USER_ROLES.ADMIN) && !hasRole(USER_ROLES.MANAGER);
    const items = isMember
      ? allMenuItems.filter((item) => memberAllowedKeys.includes(item.key))
      : allMenuItems;

    const grouped = {};
    items.forEach((item) => {
      const group = item.group;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(item);
    });

    const menuItems = [];
    groupOrder.forEach((groupName) => {
      if (!grouped[groupName]) return;
      if (groupName === '工作台') {
        grouped[groupName].forEach((item) => {
          menuItems.push({ key: item.key, icon: item.icon, label: item.label });
        });
      } else {
        menuItems.push({
          type: 'group',
          label: groupName,
          children: grouped[groupName].map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          })),
        });
      }
    });

    return menuItems;
  }, [hasRole]);

  const selectedKeys = [location.pathname];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '洗车' : '洗车门店管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={filteredItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username || user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="page-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
