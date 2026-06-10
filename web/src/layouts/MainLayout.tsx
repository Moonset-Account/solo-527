import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ForkOutlined,
  TeamOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  UserOutlined,
  BookOutlined,
  SettingOutlined,
  ExportOutlined,
  FileTextOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: '订单管理',
    children: [
      { key: '/orders', label: '订单列表' },
      { key: '/orders/:id', label: '订单详情', disabled: true },
    ],
  },
  {
    key: 'production',
    icon: <ForkOutlined />,
    label: '生产管理',
    children: [
      { key: '/production/nodes', icon: <AppstoreOutlined />, label: '生产节点' },
      { key: '/production/progress', icon: <ScheduleOutlined />, label: '生产进度' },
      { key: '/production/teams', icon: <TeamOutlined />, label: '班组管理' },
      { key: '/production/schedules', icon: <ScheduleOutlined />, label: '班组排期' },
    ],
  },
  {
    key: 'materials',
    icon: <AppstoreOutlined />,
    label: '耗材管理',
    children: [
      { key: '/materials/list', icon: <AppstoreOutlined />, label: '耗材列表' },
      { key: '/materials/costs', icon: <DollarOutlined />, label: '耗材成本' },
    ],
  },
  {
    key: '/quality/inspections',
    icon: <SafetyCertificateOutlined />,
    label: '质检记录',
  },
  {
    key: '/shortages',
    icon: <AlertOutlined />,
    label: '缺料处理',
  },
  {
    key: 'customers',
    icon: <UserOutlined />,
    label: '客户管理',
    children: [
      { key: '/customers', icon: <UserOutlined />, label: '客户列表' },
      { key: '/customers/prices', icon: <BookOutlined />, label: '客户价目表' },
    ],
  },
  {
    key: '/system/configs',
    icon: <SettingOutlined />,
    label: '系统配置',
  },
  {
    key: '/exports/records',
    icon: <ExportOutlined />,
    label: '导出记录',
  },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKeys = [location.pathname];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '账号设置' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={240}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : 20,
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <FileTextOutlined style={{ marginRight: collapsed ? 0 : 10, fontSize: 20 }} />
          {!collapsed && '青禾订单履约台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>青禾订单履约台</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: 8, marginRight: 4 }}>管理员</span>
              <DownOutlined style={{ fontSize: 12 }} />
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
