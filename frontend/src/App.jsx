import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import ClientBooking from './pages/client/ClientBooking.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminCounselors from './pages/admin/AdminCounselors.jsx';
import AdminTimeSlots from './pages/admin/AdminTimeSlots.jsx';
import AdminCheckIn from './pages/admin/AdminCheckIn.jsx';
import AdminNoShow from './pages/admin/AdminNoShow.jsx';
import AdminExport from './pages/admin/AdminExport.jsx';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/booking', label: <Link to="/booking">预约咨询</Link> },
  { key: '/admin/dashboard', label: <Link to="/admin/dashboard">管理端</Link> },
];

const adminMenuItems = [
  { key: '/admin/dashboard', icon: null, label: <Link to="/admin/dashboard">总览</Link> },
  { key: '/admin/counselors', icon: null, label: <Link to="/admin/counselors">咨询师管理</Link> },
  { key: '/admin/timeslots', icon: null, label: <Link to="/admin/timeslots">可约时段</Link> },
  { key: '/admin/checkin', icon: null, label: <Link to="/admin/checkin">到店核销</Link> },
  { key: '/admin/noshow', icon: null, label: <Link to="/admin/noshow">爽约名单</Link> },
  { key: '/admin/export', icon: null, label: <Link to="/admin/export">查询下载</Link> },
  { key: 'back', icon: null, label: <Link to="/booking">返回客户端</Link> },
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/booking" replace />} />
      <Route
        path="/booking"
        element={
          <Layout className="admin-layout">
            <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>心理咨询预约系统</div>
              <Menu mode="horizontal" selectedKeys={['/booking']} items={menuItems} style={{ position: 'absolute', top: 0, right: 0, border: 'none' }} />
            </Header>
            <Content>
              <ClientBooking />
            </Content>
          </Layout>
        }
      />
      <Route
        path="/admin/*"
        element={
          <Layout className="admin-layout">
            <Sider width={220} style={{ background: '#001529' }}>
              <div style={{ color: '#fff', padding: 20, fontSize: 16, fontWeight: 600, textAlign: 'center' }}>心理咨询管理端</div>
              <Menu theme="dark" mode="inline" defaultSelectedKeys={['/admin/dashboard']} items={adminMenuItems} />
            </Sider>
            <Layout>
              <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>服务调度工作台</span>
              </Header>
              <Content style={{ padding: 24, background: '#f5f7fa' }}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="counselors" element={<AdminCounselors />} />
                  <Route path="timeslots" element={<AdminTimeSlots />} />
                  <Route path="checkin" element={<AdminCheckIn />} />
                  <Route path="noshow" element={<AdminNoShow />} />
                  <Route path="export" element={<AdminExport />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
