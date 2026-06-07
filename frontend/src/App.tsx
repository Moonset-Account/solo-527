import React from 'react';
import { Layout, Typography } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import FilterBar from '@/components/FilterBar';
import AnomalySummary from '@/components/AnomalySummary';
import RetentionCohort from '@/components/RetentionCohort';
import CourseHeatmap from '@/components/CourseHeatmap';
import CoachLoad from '@/components/CoachLoad';
import ChurnWarningList from '@/components/ChurnWarningList';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LineChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>健身房会员训练留存分析</Title>
        </div>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
          <FilterBar />
          <AnomalySummary />
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 24,
            marginBottom: 24 
          }}>
            <RetentionCohort />
            <CourseHeatmap />
          </div>
          
          <CoachLoad />
          <ChurnWarningList />
        </div>
      </Content>
    </Layout>
  );
};

export default App;
