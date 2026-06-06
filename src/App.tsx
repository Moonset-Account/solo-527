import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ViewTabs from './components/ViewTabs';
import FunnelChart from './components/charts/FunnelChart';
import CohortChart from './components/charts/CohortChart';
import FeatureHeatmap from './components/charts/FeatureHeatmap';
import PathAnalysis from './components/charts/PathAnalysis';
import ChurnReasons from './components/charts/ChurnReasons';
import { useAnalyticsStore } from './store/useAnalyticsStore';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const {
    activeView,
    funnelData,
    cohortData,
    featureData,
    pathData,
    churnReasons,
    isLoading,
    fetchData,
  } = useAnalyticsStore();

  const [showChurn, setShowChurn] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderActiveView = () => {
    if (isLoading || !funnelData || !cohortData || !featureData || !pathData || !churnReasons) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">正在加载数据...</p>
          </div>
        </div>
      );
    }

    if (showChurn) {
      return <ChurnReasons data={churnReasons} />;
    }

    switch (activeView) {
      case 'funnel':
        return <FunnelChart data={funnelData} />;
      case 'cohort':
        return <CohortChart data={cohortData} />;
      case 'features':
        return <FeatureHeatmap data={featureData} />;
      case 'paths':
        return <PathAnalysis data={pathData} />;
      default:
        return <FunnelChart data={funnelData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FilterBar />
      
      <main className="p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {showChurn ? '流失原因分析' : 
                  activeView === 'funnel' ? '转化漏斗分析' :
                  activeView === 'cohort' ? 'Cohort 留存分析' :
                  activeView === 'features' ? '功能热度分析' : '用户路径分析'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                基于当前筛选条件的数据分析结果
              </p>
            </div>
            <ViewTabs showChurn={showChurn} onShowChurn={() => setShowChurn(!showChurn)} />
          </div>

          {renderActiveView()}

          <div className="mt-6 grid grid-cols-4 gap-4">
            {funnelData && !showChurn && activeView === 'funnel' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">激活率</div>
                  <div className="text-xl font-bold text-blue-600">
                    {funnelData.steps[1]?.conversionRate || 0}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">注册 → 激活</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">邀请率</div>
                  <div className="text-xl font-bold text-purple-600">
                    {((funnelData.steps[2]?.count || 0) / (funnelData.steps[1]?.count || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">激活 → 邀请</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">付费转化率</div>
                  <div className="text-xl font-bold text-green-600">
                    {((funnelData.steps[4]?.count || 0) / (funnelData.steps[3]?.count || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">使用 → 付费</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">续费率</div>
                  <div className="text-xl font-bold text-orange-600">
                    {((funnelData.steps[5]?.count || 0) / (funnelData.steps[4]?.count || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">首次付费 → 续费</div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>© 2024 SaaS Analytics Platform</span>
            <span>·</span>
            <span>数据统一接入，多渠道注册定义已标准化</span>
            <span>·</span>
            <span>实验组与自然流量已分离统计</span>
          </div>
          <div className="flex items-center gap-4">
            <span>数据缓存有效期: 5分钟</span>
            <span>·</span>
            <span>支持 CSV / Excel / PDF 导出</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
