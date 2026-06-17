import React, { useState, useCallback } from 'react';
import { Layout, Menu, Badge, Popover, Tag, notification, Space, List } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  GoldOutlined,
  ControlOutlined,
  TeamOutlined,
  BellOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAlertHub } from '../../hooks/useSignalR';
import type { Alert } from '../../types';

const { Sider, Header, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const mainMenuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/batches', icon: <AppstoreOutlined />, label: '采收批次' },
  { key: '/environment', icon: <EnvironmentOutlined />, label: '环境监测' },
  { key: '/materials', icon: <FileTextOutlined />, label: '申报材料' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单履约' },
  { key: '/operations', icon: <HistoryOutlined />, label: '批量操作' },
  { key: '/plots', icon: <GoldOutlined />, label: '地块管理' },
  { type: 'divider' as const },
  {
    type: 'group' as const,
    label: '运营配置',
    children: [
      { key: '/thresholds', icon: <ControlOutlined />, label: '阈值配置' },
      { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
    ],
  },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const [api, contextHolder] = notification.useNotification();

  const handleReceiveAlert = useCallback(
    (alert: Alert) => {
      setActiveAlerts((prev) => [alert, ...prev].slice(0, 20));

      const isCritical = alert.level === 'Critical';
      const isWarning = alert.level === 'Warning';

      api.open({
        message: isCritical ? '严重告警' : isWarning ? '警告' : '信息',
        description: (
          <div>
            <div style={{ marginBottom: 4 }}>
              <strong>参数:</strong> {alert.parameterType || '未知'}
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>当前值:</strong> {alert.currentValue} /{' '}
              <strong>阈值:</strong> {alert.thresholdValue}
            </div>
            <div>{alert.message}</div>
          </div>
        ),
        icon: isCritical ? (
          <WarningOutlined style={{ color: 'red' }} />
        ) : isWarning ? (
          <WarningOutlined style={{ color: '#fa8c16' }} />
        ) : undefined,
        type: isCritical ? 'error' : isWarning ? 'warning' : 'info',
        duration: isCritical ? 0 : 5,
      });
    },
    [api]
  );

  useAlertHub(handleReceiveAlert);

  const activeAlertCount = activeAlerts.filter(
    (a) => a.status === 'Active'
  ).length;

  const alertPopoverContent = (
    <div style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
      {activeAlerts.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#999' }}>
          暂无告警
        </div>
      ) : (
        <List
          size="small"
          dataSource={activeAlerts}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge
                    color={
                      item.level === 'Critical'
                        ? 'red'
                        : item.level === 'Warning'
                        ? 'orange'
                        : 'blue'
                    }
                  />
                }
                title={
                  <span>
                    {item.parameterType}
                    <Tag
                      color={
                        item.level === 'Critical'
                          ? 'red'
                          : item.level === 'Warning'
                          ? 'orange'
                          : 'blue'
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {item.level === 'Critical'
                        ? '严重'
                        : item.level === 'Warning'
                        ? '警告'
                        : '信息'}
                    </Tag>
                  </span>
                }
                description={
                  <div>
                    <div>{item.message}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {new Date(item.triggeredAt || item.createdAt).toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sider
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 12 : 16,
            fontWeight: 600,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '溯源' : '农产品溯源管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['运营配置']}
          items={mainMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: 64,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Space size={24}>
            <Popover
              title="最近告警"
              content={alertPopoverContent}
              trigger="click"
              placement="bottomRight"
            >
              <Badge count={activeAlertCount} offset={[-4, 4]}>
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
            </Popover>
            <Space size={8}>
              <Tag color="blue">农技员</Tag>
              <span>tech01</span>
            </Space>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
