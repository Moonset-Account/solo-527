import { Layout, Menu, Badge, Avatar, Dropdown, Space } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  RefundOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { reminderApi } from '../services/api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '/appointment',
    icon: <CalendarOutlined />,
    label: '预约管理',
  },
  {
    key: '/checkin',
    icon: <CheckCircleOutlined />,
    label: '到店核销',
  },
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: '后台管理',
  },
  {
    key: '/refund',
    icon: <RefundOutlined />,
    label: '退款管理',
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '统计报表',
  },
  {
    key: '/reminders',
    icon: <BellOutlined />,
    label: '消息中心',
  },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await reminderApi.getUnreadCount(1);
      if (res.success && res.data !== undefined) {
        setUnreadCount(res.data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'logout', label: '退出登录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '心咨' : '心理咨询核销系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: '#1f1f1f' }}>
            服务调度员工作台
          </div>
          <Space size={24}>
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 20, cursor: 'pointer', color: '#666' }}
                onClick={() => navigate('/reminders')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 0, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
