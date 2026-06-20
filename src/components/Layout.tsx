import React, { useState } from 'react';
import { Layout as AntLayout, Menu, theme, Avatar, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  DashboardOutlined,
  AlertOutlined,
  SettingOutlined,
  DollarOutlined,
  GiftOutlined,
  PartitionOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/store/user';

const { Header, Sider, Content } = AntLayout;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: <Link to="/">首页仪表盘</Link>,
  },
  {
    key: '/alerts',
    icon: <AlertOutlined />,
    label: <Link to="/alerts">设备告警</Link>,
  },
  {
    key: '/strategies',
    icon: <SettingOutlined />,
    label: <Link to="/strategies">策略配置</Link>,
  },
  {
    key: '/revenue',
    icon: <DollarOutlined />,
    label: <Link to="/revenue">储能收益</Link>,
  },
  {
    key: '/subsidies',
    icon: <GiftOutlined />,
    label: <Link to="/subsidies">补贴记录</Link>,
  },
  {
    key: '/meters',
    icon: <PartitionOutlined />,
    label: <Link to="/meters">表计分区</Link>,
  },
];

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useUserStore((state) => state.currentUser);

  const userMenuItems = [
    {
      key: '1',
      label: '个人中心',
    },
    {
      key: '2',
      label: '退出登录',
    },
  ];

  const selectedKey = menuItems.find((item) => {
    if (item.key === '/' && location.pathname === '/') return true;
    if (item.key !== '/' && location.pathname.startsWith(item.key)) return true;
    return false;
  })?.key || '/';

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: '#001529',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 20,
            background: '#002140',
          }}
        >
          <div
            style={{
              fontSize: collapsed ? 20 : 24,
              fontWeight: 'bold',
              color: '#fff',
            }}
          >
            {collapsed ? 'PV' : '光伏电站管理'}
          </div>
          {!collapsed && (
            <div
              style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}
            >
              策略配置平台
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 16 }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Space>
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: 18, cursor: 'pointer' },
              }
            )}
            <span
              style={{ marginLeft: 16, fontSize: 16, color: '#262626' }}
            >
              {
                menuItems.find((item) => item.key === selectedKey)
                  ?.label?.props?.children || '首页仪表盘'
              }
            </span>
          </Space>
          <Space size={24}>
            <BellOutlined
              style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }}
            />
            <Dropdown menu={{ items: userMenuItems }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{currentUser?.name || '用户'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
