import React from 'react';
import { Layout, Typography } from 'antd';
import { FilterProvider } from './context/FilterContext';
import FilterBar from './components/FilterBar';
import AnomalyPanel from './components/AnomalyPanel';
import SummaryCards from './components/SummaryCards';
import SeatHeatmap from './components/SeatHeatmap';
import NoShowTrend from './components/NoShowTrend';
import AreaComparison from './components/AreaComparison';
import WaitFunnel from './components/WaitFunnel';
import ExamWeekComparison from './components/ExamWeekComparison';
import { Row, Col } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  return (
    <FilterProvider>
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Header style={{ background: '#001529', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              📚 高校图书馆自习位利用率分析平台
            </Title>
          </div>
        </Header>
        <Content className="page-layout">
          <div className="page-header">
            <div className="page-title">数据工作台</div>
            <div className="page-subtitle">
              从异常发现到多维下钻，全面掌握图书馆自习位使用情况
            </div>
          </div>

          <FilterBar />
          
          <div style={{ marginBottom: 24 }}>
            <AnomalyPanel />
          </div>

          <SummaryCards />

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={16}>
              <div style={{ marginBottom: 16 }}>
                <SeatHeatmap />
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ marginBottom: 16 }}>
                <WaitFunnel />
              </div>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={14}>
              <div style={{ marginBottom: 16 }}>
                <NoShowTrend />
              </div>
            </Col>
            <Col xs={24} lg={10}>
              <div style={{ marginBottom: 16 }}>
                <ExamWeekComparison />
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <AreaComparison />
            </Col>
          </Row>
        </Content>
      </Layout>
    </FilterProvider>
  );
}

export default App;
