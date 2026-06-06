import React, { useEffect } from 'react';
import { Layout, Typography, Alert, Modal, Input, message, Button, Tag, Space } from 'antd';
import { DashboardOutlined, RollbackOutlined } from '@ant-design/icons';
import { FilterBar } from './components/filters/FilterBar';
import { OverviewCards } from './components/charts/OverviewCards';
import { ReasonTreeChart } from './components/charts/ReasonTreeChart';
import { CycleDistributionChart } from './components/charts/CycleDistributionChart';
import { ProductRankingChart } from './components/charts/ProductRankingChart';
import { ServiceDurationChart } from './components/charts/ServiceDurationChart';
import { DimensionAnalysis } from './components/charts/DimensionAnalysis';
import { useDashboardStore } from './store/dashboard';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const {
    fetchFilterOptions,
    fetchDashboardData,
    fetchSavedViews,
    saveCurrentView,
    error,
    activeDrillDown,
    setDrillDown,
    filters,
    drillDownFilters
  } = useDashboardStore();

  const effectiveFilters = activeDrillDown
    ? { ...filters, ...drillDownFilters }
    : filters;

  const filterCount = Object.keys(effectiveFilters).filter(k => {
    const v = effectiveFilters[k as keyof typeof effectiveFilters];
    return v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true);
  }).length;

  const [saveModalVisible, setSaveModalVisible] = React.useState(false);
  const [viewName, setViewName] = React.useState('');

  useEffect(() => {
    fetchFilterOptions();
    fetchSavedViews();
    fetchDashboardData();
  }, []);

  const handleSaveView = async () => {
    if (!viewName.trim()) {
      message.error('请输入视图名称');
      return;
    }
    await saveCurrentView(viewName.trim());
    message.success('视图保存成功');
    setSaveModalVisible(false);
    setViewName('');
  };

  const DRILL_DOWN_LABELS: Record<string, string> = {
    reason_level1: '退货原因',
    cycle_bucket: '退款周期',
    product: '商品',
    agent: '客服人员',
    store: '店铺',
    warehouse: '仓库',
    logistics: '物流商',
    category: '商品品类',
  };

  const handleExitDrillDown = () => {
    setDrillDown(null);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DashboardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>电商退货原因与退款周期看板</Title>
          </div>
          <Space>
            {activeDrillDown && (
              <Tag color="success" style={{ margin: 0, padding: '4px 12px' }}>
                🔍 下钻模式: {DRILL_DOWN_LABELS[activeDrillDown] || activeDrillDown}
                <Button
                  type="text"
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={handleExitDrillDown}
                  style={{ marginLeft: 8, color: '#fff' }}
                >
                  退出下钻
                </Button>
              </Tag>
            )}
          </Space>
        </div>
      </Header>

      <Content style={{ padding: '16px 24px' }}>
        {error && (
          <Alert
            message="数据加载失败"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <FilterBar onSaveView={() => setSaveModalVisible(true)} />

        <OverviewCards />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 16, marginBottom: 16 }}>
          <ReasonTreeChart />
          <CycleDistributionChart />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 16, marginBottom: 16 }}>
          <ProductRankingChart />
          <ServiceDurationChart />
        </div>

        <DimensionAnalysis />
      </Content>

      <Modal
        title="保存当前视图"
        open={saveModalVisible}
        onOk={handleSaveView}
        onCancel={() => setSaveModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="请输入视图名称，便于日会时快速加载"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          onPressEnter={handleSaveView}
          style={{ marginTop: 8 }}
        />
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            当前共 {filterCount} 个筛选条件将被保存
            {activeDrillDown && '（含下钻口径）'}
          </Typography.Text>
        </div>
      </Modal>
    </Layout>
  );
};

export default App;
