import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout,
  Menu,
  Dropdown,
  Drawer,
  Avatar,
  Badge,
  Breadcrumb,
  Spin,
  Input,
  Modal,
  Form,
  List,
  Button,
  Tag,
  Tooltip,
  Space,
  App as AntdApp,
  Typography,
  Divider,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  StockOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  SendOutlined,
  ScanOutlined,
  WarningOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  LockOutlined,
  ReadOutlined,
  CheckOutlined,
  SearchOutlined,
  ReloadOutlined,
  UsergroupAddOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import { ROLE, ROLE_LABELS, getRole, hasRole, clearAuth } from '../utils/auth.js';
import { alertApi, authApi } from '../api/index.js';
import router from '../router/index.jsx';
import { ALERT_TYPE } from '../utils/constants.js';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const BREADCRUMB_MAP = {
  dashboard: '工作台',
  suppliers: '供应商管理',
  products: '商品管理',
  inventory: '库存管理',
  batches: '批次管理',
  'near-expiry': '效期预警',
  'purchase-orders': '采购订单',
  'inbound-orders': '入库单',
  scan: '扫码作业',
  'outbound-orders': '出库单',
  exceptions: '异常管理',
  'batch-ops': '批量操作',
  confirm: '确认执行',
  statistics: '数据统计',
  restock: '补货建议',
  alerts: '消息提醒',
  users: '用户管理',
  profile: '个人中心',
  inbound: '入库',
  outbound: '出库',
};

function getBreadcrumbItems(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const items = [{ title: <Link to="/dashboard">首页</Link> }];
  parts.forEach((p, idx) => {
    const label = BREADCRUMB_MAP[p] || p;
    const path = '/' + parts.slice(0, idx + 1).join('/');
    if (idx === parts.length - 1) {
      items.push({ title: label });
    } else {
      items.push({ title: <Link to={path}>{label}</Link> });
    }
  });
  return items;
}

function AlertDrawer({ open, onClose, list, loading, onRead, onReadAll, onRefresh }) {
  const navigate = useNavigate();
  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>消息提醒</span>
          <Space>
            <Button size="small" icon={<ReadOutlined />} onClick={onReadAll}>
              全部已读
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>
              刷新
            </Button>
          </Space>
        </div>
      }
      placement="right"
      width={420}
      onClose={onClose}
      open={open}
    >
      <Spin spinning={loading}>
        <List
          dataSource={list}
          locale={{ emptyText: '暂无消息' }}
          renderItem={(item) => {
            const typeCfg = ALERT_TYPE[item.type] || { label: item.type, color: 'default', icon: 'Bell' };
            const iconMap = {
              Stock: <StockOutlined />,
              ClockCircle: <ClockCircleOutlined />,
              Warning: <WarningOutlined />,
              Alert: <WarningOutlined />,
              Message: <ReadOutlined />,
              Shopping: <ShoppingCartOutlined />,
              Bell: <BellOutlined />,
            };
            const goDetail = () => {
              if (!item.isRead) onRead(item.id);
              onClose();
              if (item.relatedType === 'PURCHASE_ORDER' && item.relatedId) {
                navigate(`/purchase-orders/${item.relatedId}`);
              } else if (item.relatedType === 'INBOUND_ORDER' && item.relatedId) {
                navigate(`/inbound-orders/${item.relatedId}`);
              } else if (item.relatedType === 'EXCEPTION' && item.relatedId) {
                navigate(`/exceptions/${item.relatedId}`);
              } else {
                navigate('/alerts');
              }
            };
            return (
              <List.Item
                style={{
                  padding: '12px 0',
                  cursor: 'pointer',
                  opacity: item.isRead ? 0.65 : 1,
                  background: item.isRead ? 'transparent' : '#f6faff',
                  margin: '0 -16px',
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 6,
                }}
                onClick={goDetail}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{
                        background: typeCfg.color,
                        verticalAlign: 'middle',
                      }}
                      icon={iconMap[typeCfg.icon] || <BellOutlined />}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={typeCfg.color} style={{ margin: 0 }}>
                        {typeCfg.label}
                      </Tag>
                      {!item.isRead && <Badge status="processing" />}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>{item.title}</div>
                      {item.content && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.content.length > 80 ? item.content.slice(0, 80) + '...' : item.content}
                        </Text>
                      )}
                      <div style={{ marginTop: 6, fontSize: 12, color: '#bfbfbf' }}>
                        {dayjs(item.createdAt).fromNow()}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Spin>
    </Drawer>
  );
}

export default function MainLayout() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const unreadAlertCount = useAppStore((s) => s.unreadAlertCount);
  const setUnreadAlertCount = useAppStore((s) => s.setUnreadAlertCount);
  const decUnreadAlertCount = useAppStore((s) => s.decUnreadAlertCount);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const logoutStore = useAppStore((s) => s.logout);

  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);
  const [alertList, setAlertList] = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const [pwdLoading, setPwdLoading] = useState(false);

  const role = getRole();

  const menuItems = useMemo(() => {
    const isSupplier = role === ROLE.SUPPLIER;
    const isSuperAdmin = hasRole(ROLE.SUPER_ADMIN);

    const items = [];

    items.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    });

    if (!isSupplier) {
      items.push({
        key: 'supplier-group',
        icon: <TeamOutlined />,
        label: '供应商协作',
        children: [
          { key: '/suppliers', icon: <ShopOutlined />, label: '供应商管理' },
        ],
      });

      items.push({
        key: 'inventory-group',
        icon: <StockOutlined />,
        label: '库存中心',
        children: [
          { key: '/products', icon: <FileProtectOutlined />, label: '商品管理' },
          { key: '/inventory', icon: <DatabaseOutlined />, label: '实时库存' },
          { key: '/inventory/batches', icon: <InboxOutlined />, label: '批次管理' },
          { key: '/inventory/near-expiry', icon: <ClockCircleOutlined />, label: '效期预警' },
        ],
      });

      items.push({
        key: 'purchase-group',
        icon: <ShoppingCartOutlined />,
        label: '采购管理',
        children: [
          { key: '/purchase-orders', icon: <ShoppingCartOutlined />, label: '采购订单' },
          { key: '/restock', icon: <ReloadOutlined />, label: '补货建议' },
        ],
      });

      items.push({
        key: 'inout-group',
        icon: <InboxOutlined />,
        label: '出入库',
        children: [
          { key: '/inbound-orders', icon: <InboxOutlined />, label: '入库单' },
          { key: '/inbound/scan', icon: <ScanOutlined />, label: '入库扫码' },
          { key: '/outbound-orders', icon: <SendOutlined />, label: '出库单' },
          { key: '/outbound/scan', icon: <ScanOutlined />, label: '出库扫码' },
        ],
      });

      items.push({
        key: 'exception-group',
        icon: <WarningOutlined />,
        label: '异常处理',
        children: [
          { key: '/exceptions', icon: <WarningOutlined />, label: '异常工单' },
          { key: '/batch-ops', icon: <BarChartOutlined />, label: '批量操作' },
        ],
      });

      items.push({
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: '数据统计',
      });

      items.push({
        key: 'system-group',
        icon: <SettingOutlined />,
        label: '系统设置',
        children: [
          { key: '/alerts', icon: <BellOutlined />, label: '消息中心' },
          { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
        ],
      });

      if (isSuperAdmin) {
        const systemGroup = items.find((i) => i.key === 'system-group');
        if (systemGroup) {
          systemGroup.children.unshift({
            key: '/users',
            icon: <UsergroupAddOutlined />,
            label: '用户管理',
          });
        }
      }
    } else {
      items.push({
        key: '/suppliers',
        icon: <ShopOutlined />,
        label: '供应商资料',
      });
      items.push({
        key: '/purchase-orders',
        icon: <ShoppingCartOutlined />,
        label: '采购订单',
      });
      items.push({
        key: '/inbound-orders',
        icon: <InboxOutlined />,
        label: '入库单',
      });
      items.push({
        key: '/alerts',
        icon: <BellOutlined />,
        label: '消息提醒',
      });
      items.push({
        key: '/profile',
        icon: <UserOutlined />,
        label: '个人中心',
      });
    }

    return items;
  }, [role]);

  const fetchAlerts = async () => {
    setAlertLoading(true);
    try {
      const [countRes, listRes] = await Promise.all([
        alertApi.unreadCount(),
        alertApi.list({ page: 1, pageSize: 20 }),
      ]);
      setUnreadAlertCount(countRes.data?.count || 0);
      setAlertList(listRes.data?.list || listRes.data?.records || []);
    } catch (e) {
    } finally {
      setAlertLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRead = async (id) => {
    try {
      await alertApi.read(id);
      decUnreadAlertCount(1);
      setAlertList((l) => l.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    } catch (e) {}
  };

  const handleReadAll = async () => {
    try {
      await alertApi.readAll();
      setUnreadAlertCount(0);
      setAlertList((l) => l.map((a) => ({ ...a, isRead: true })));
      message.success('已全部标记为已读');
    } catch (e) {}
  };

  const handleLogout = () => {
    modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await authApi.logout();
        } catch (e) {}
        clearAuth();
        logoutStore();
        router.navigate('/login');
        message.success('已退出登录');
      },
    });
  };

  const handleChangePwd = async () => {
    try {
      const values = await pwdForm.validateFields();
      setPwdLoading(true);
      await authApi.changePassword(values);
      message.success('密码修改成功');
      setPwdModalOpen(false);
      pwdForm.resetFields();
    } catch (e) {
    } finally {
      setPwdLoading(false);
    }
  };

  const userMenu = {
    items: [
      {
        key: 'role',
        label: (
          <div style={{ padding: '4px 0' }}>
            <Tag color="blue" style={{ margin: 0 }}>
              {ROLE_LABELS[role] || role}
            </Tag>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile'),
      },
      {
        key: 'pwd',
        icon: <LockOutlined />,
        label: '修改密码',
        onClick: () => setPwdModalOpen(true),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  const selectedKeys = [location.pathname];
  const openKeys = useMemo(() => {
    const p = location.pathname;
    const keys = [];
    if (p.startsWith('/suppliers')) keys.push('supplier-group');
    if (p.startsWith('/products') || p.startsWith('/inventory')) keys.push('inventory-group');
    if (p.startsWith('/purchase') || p.startsWith('/restock')) keys.push('purchase-group');
    if (p.startsWith('/inbound') || p.startsWith('/outbound')) keys.push('inout-group');
    if (p.startsWith('/exceptions') || p.startsWith('/batch')) keys.push('exception-group');
    if (p.startsWith('/users') || p.startsWith('/profile') || p.startsWith('/alerts')) keys.push('system-group');
    return keys;
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={232}
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
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            paddingLeft: sidebarCollapsed ? 0 : 20,
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <DatabaseOutlined style={{ fontSize: 22, color: '#1677ff', flexShrink: 0 }} />
          {!sidebarCollapsed && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: '#fff',
              }}
            >
              生鲜仓储协作
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key);
          }}
          style={{ borderRight: 0, paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 20px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            <Title level={5} style={{ margin: 0, fontWeight: 600, color: '#262626' }}>
              生鲜仓储协作管理平台
            </Title>
          </div>

          <div style={{ flex: 1, maxWidth: 520, margin: '0 auto' }}>
            <Input
              size="large"
              placeholder="搜索订单、商品、供应商..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = e.target.value?.trim();
                  if (!v) return;
                  if (/^PO-/i.test(v)) navigate('/purchase-orders');
                  else if (/^IB-/i.test(v)) navigate('/inbound-orders');
                  else if (/^OB-/i.test(v)) navigate('/outbound-orders');
                  else if (/^EX-/i.test(v)) navigate('/exceptions');
                  else navigate('/products');
                }
              }}
              style={{ borderRadius: 8 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Tooltip title="消息提醒">
              <Badge count={unreadAlertCount} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  style={{ width: 40, height: 40, color: '#595959' }}
                  onClick={() => {
                    setAlertDrawerOpen(true);
                    fetchAlerts();
                  }}
                />
              </Badge>
            </Tooltip>

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  size={34}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 600,
                  }}
                  icon={<UserOutlined />}
                >
                  {user?.name?.charAt(0) || user?.username?.charAt(0)}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>
                    {user?.name || user?.username || '用户'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {ROLE_LABELS[role] || role}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <div style={{ padding: '14px 24px 0', background: '#f5f7fa' }}>
          <Breadcrumb items={getBreadcrumbItems(location.pathname)} />
        </div>

        <Content
          style={{
            margin: 0,
            padding: 20,
            background: '#f5f7fa',
            minHeight: 'calc(100vh - 56px - 36px)',
            overflow: 'auto',
          }}
        >
          <Spin
            spinning={false}
            tip="加载中..."
            style={{ maxHeight: 'none' }}
          >
            <Outlet />
          </Spin>
        </Content>
      </Layout>

      <AlertDrawer
        open={alertDrawerOpen}
        onClose={() => setAlertDrawerOpen(false)}
        list={alertList}
        loading={alertLoading}
        onRead={handleRead}
        onReadAll={handleReadAll}
        onRefresh={fetchAlerts}
      />

      <Modal
        title="修改密码"
        open={pwdModalOpen}
        onCancel={() => {
          setPwdModalOpen(false);
          pwdForm.resetFields();
        }}
        onOk={handleChangePwd}
        confirmLoading={pwdLoading}
        okText="确认修改"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
