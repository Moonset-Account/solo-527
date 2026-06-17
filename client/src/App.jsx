import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  PieChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  ExportOutlined,
  ScheduleOutlined,
  EyeOutlined,
  DollarOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard.jsx';
import Batches from './pages/Batches.jsx';
import Settings from './pages/Settings.jsx';
import LossDetails from './pages/LossDetails.jsx';
import SupervisorTrack from './pages/SupervisorTrack.jsx';
import Approvals from './pages/Approvals.jsx';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">数据概览</Link> },
  { key: '/batches', icon: <PieChartOutlined />, label: <Link to="/batches">烘焙批次与报损</Link> },
  { key: '/loss-details', icon: <ExportOutlined />, label: <Link to="/loss-details">食材损耗明细</Link> },
  { key: '/supervisor', icon: <EyeOutlined />, label: <Link to="/supervisor">督导追踪</Link> },
  { key: '/approvals', icon: <AuditOutlined />, label: <Link to="/approvals">审批管理</Link> },
  { key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">内部管理设置</Link> },
];

const supervisorSubItems = [
  { key: 'cashflow', icon: <DollarOutlined />, label: '现金流水' },
  { key: 'shifts', icon: <ScheduleOutlined />, label: '班次排班' },
  { key: 'inspections', icon: <EyeOutlined />, label: '巡店任务' },
];

function App() {
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  let selectedKey = location.pathname;
  if (location.pathname.startsWith('/supervisor')) {
    selectedKey = '/supervisor';
  }

  return (
    <Layout className="app-layout">
      <Sider theme="dark" width={220}>
        <div className="app-logo">🍞 烘焙管理系统</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['/supervisor']}
          items={[
            ...menuItems.slice(0, 3),
            {
              key: '/supervisor',
              icon: <EyeOutlined />,
              label: '督导追踪',
              children: [
                { key: '/supervisor/cashflow', icon: <DollarOutlined />, label: <Link to="/supervisor/cashflow">现金流水</Link> },
                { key: '/supervisor/shifts', icon: <ScheduleOutlined />, label: <Link to="/supervisor/shifts">班次排班</Link> },
                { key: '/supervisor/inspections', icon: <EyeOutlined />, label: <Link to="/supervisor/inspections">巡店任务</Link> },
              ],
            },
            ...menuItems.slice(4),
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer }}>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>烘焙门店库存损耗管理系统</span>
          <span style={{ float: 'right', color: '#666' }}>区域督导工作台</span>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/loss-details" element={<LossDetails />} />
            <Route path="/supervisor/cashflow" element={<SupervisorTrack activeTab="cashflow" />} />
            <Route path="/supervisor/shifts" element={<SupervisorTrack activeTab="shifts" />} />
            <Route path="/supervisor/inspections" element={<SupervisorTrack activeTab="inspections" />} />
            <Route path="/supervisor" element={<SupervisorTrack activeTab="cashflow" />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
