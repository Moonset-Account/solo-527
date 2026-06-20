import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, AuditOutlined, WarningOutlined,
  BellOutlined, SettingOutlined, UserOutlined, LogoutOutlined,
  FileSearchOutlined, SafetyOutlined, SwapOutlined, DatabaseOutlined, NumberOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';
import DashboardPage from '../pages/admin/DashboardPage';
import ContractListPage from '../pages/admin/contract/ContractListPage';
import ContractDetailPage from '../pages/admin/contract/ContractDetailPage';
import ContractCreatePage from '../pages/admin/contract/ContractCreatePage';
import NumberPoolPage from '../pages/admin/contract/NumberPoolPage';
import ApprovalTasksPage from '../pages/admin/approval/ApprovalTasksPage';
import ConflictListPage from '../pages/admin/conflict/ConflictListPage';
import ConflictDetailPage from '../pages/admin/conflict/ConflictDetailPage';
import NotificationListPage from '../pages/admin/notification/NotificationListPage';
import PermissionManagePage from '../pages/admin/permission/PermissionManagePage';
import CallbackLogsPage from '../pages/admin/CallbackLogsPage';
import ResourcesPage from '../pages/admin/ResourcesPage';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: 'contract', icon: <FileTextOutlined />, label: '合同管理', children: [
    { key: '/contracts', icon: <FileSearchOutlined />, label: '合同列表' },
    { key: '/contracts/create', icon: <FileTextOutlined />, label: '新建合同' },
    { key: '/number-pool', icon: <NumberOutlined />, label: '编号管理' },
  ]},
  { key: '/approval-tasks', icon: <AuditOutlined />, label: '审批任务' },
  { key: '/conflicts', icon: <WarningOutlined />, label: '资源冲突' },
  { key: '/notifications', icon: <BellOutlined />, label: '通知管理' },
  { key: '/callbacks', icon: <SwapOutlined />, label: '回调日志' },
  { key: '/resources', icon: <DatabaseOutlined />, label: '资源占用' },
  { key: '/permissions', icon: <SafetyOutlined />, label: '权限管理' },
];

export default function DesktopLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, fetchUnread, unreadCount } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedKeys = [location.pathname.startsWith('/contract/') || location.pathname === '/contracts/create' ? '/contracts' : location.pathname === '/contracts' ? '/contracts' : location.pathname === '/number-pool' ? '/number-pool' : location.pathname];

  return (
    <div className="app-layout">
      <Sider
        className="app-sider"
        width={240}
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0 }}
      >
        <div className="app-sider-header">
          ⚖️ {!collapsed && <span>法务归档系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={['contract']}
          style={{ borderRight: 0 }}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: (item as any).children?.map((c: any) => ({ key: c.key, icon: c.icon, label: c.label })),
          }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <div className="app-main" style={{ marginLeft: collapsed ? 80 : 240 }}>
        <Header className="app-header">
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {menuItems.find((m) => location.pathname.startsWith(m.key) && typeof m.label === 'string')?.label
              || (menuItems.find((m) => (m as any).children?.some((c: any) => location.pathname.startsWith(c.key)))?.label
                || '系统')}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/notifications')} />
            </Badge>
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
                  { type: 'divider' as any },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout },
                ],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: '#1677ff' }}>
                  {user?.realName?.[0]}
                </Avatar>
                <span>{user?.realName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="app-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/contracts" element={<ContractListPage />} />
            <Route path="/contracts/create" element={<ContractCreatePage />} />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route path="/number-pool" element={<NumberPoolPage />} />
            <Route path="/approval-tasks" element={<ApprovalTasksPage />} />
            <Route path="/conflicts" element={<ConflictListPage />} />
            <Route path="/conflicts/:id" element={<ConflictDetailPage />} />
            <Route path="/notifications" element={<NotificationListPage />} />
            <Route path="/permissions" element={<PermissionManagePage />} />
            <Route path="/callbacks" element={<CallbackLogsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
          </Routes>
        </Content>
      </div>
    </div>
  );
}
