import React from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  MoneyCollectOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import DispatchPage from './pages/DispatchPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import ExportHistoryPage from './pages/ExportHistoryPage.jsx';
import StrategyPage from './pages/StrategyPage.jsx';
import PricePage from './pages/PricePage.jsx';
import ValidatePage from './pages/ValidatePage.jsx';

const { Header, Sider, Content } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '调度台' },
    { key: '/validate', icon: <CheckCircleOutlined />, label: '采集校验' },
    { key: '/statistics', icon: <BarChartOutlined />, label: '统计分析' },
    { key: '/strategy', icon: <SafetyOutlined />, label: '策略版本' },
    { key: '/price', icon: <MoneyCollectOutlined />, label: '电价规则' },
    { key: '/export-history', icon: <FileSearchOutlined />, label: '导出历史' }
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="logo">
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          园区电表告警调度台
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout>
          <Content className="app-content">
            <Routes>
              <Route path="/" element={<DispatchPage />} />
              <Route path="/validate" element={<ValidatePage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/strategy" element={<StrategyPage />} />
              <Route path="/price" element={<PricePage />} />
              <Route path="/export-history" element={<ExportHistoryPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
