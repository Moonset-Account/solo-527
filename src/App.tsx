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
import { Loader2, Database, Zap } from 'lucide-react';

const App: React.FC = () => {
  const {
    activeView,
    aggregatedResult,
    isLoading,
    fetchData,
    cacheStats,
  } = useAnalyticsStore();

  const [showChurn, setShowChurn] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderActiveView = () => {
    if (isLoading || !aggregatedResult) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">正在聚合数据...</p>
            <p className="text-xs text-gray-400 mt-2">ETL 管道正在处理原始事件</p>
          </div>
        </div>
      );
    }

    if (showChurn) {
      return <ChurnReasons data={aggregatedResult.churn} />;
    }

    switch (activeView) {
      case 'funnel':
        return <FunnelChart data={aggregatedResult.funnel} />;
      case 'cohort':
        return <CohortChart data={aggregatedResult.cohort} />;
      case 'features':
        return <FeatureHeatmap data={aggregatedResult.features} />;
      case 'paths':
        return <PathAnalysis data={aggregatedResult.paths} />;
      default:
        return <FunnelChart data={aggregatedResult.funnel} />;
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
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500">
                  基于当前筛选条件的数据分析结果
                </p>
                {aggregatedResult && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Database className="w-3 h-3" />
                    查询ID: {aggregatedResult.queryId}
                  </span>
                )}
                {cacheStats.hits > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <Zap className="w-3 h-3" />
                    缓存命中率: {cacheStats.hitRate}%
                  </span>
                )}
              </div>
            </div>
            <ViewTabs showChurn={showChurn} onShowChurn={() => setShowChurn(!showChurn)} />
          </div>

          {renderActiveView()}

          <div className="mt-6 grid grid-cols-5 gap-4">
            {aggregatedResult && !showChurn && activeView === 'funnel' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">总用户数</div>
                  <div className="text-xl font-bold text-gray-800">
                    {aggregatedResult.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">去重 UV</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">激活率</div>
                  <div className="text-xl font-bold text-blue-600">
                    {aggregatedResult.summary.activationRate}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">注册 → 激活</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">付费转化率</div>
                  <div className="text-xl font-bold text-green-600">
                    {aggregatedResult.summary.payConversionRate}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">使用 → 付费</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">7日平均留存</div>
                  <div className="text-xl font-bold text-purple-600">
                    {aggregatedResult.summary.avgRetention7d}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Cohort 均值</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">平均会话时长</div>
                  <div className="text-xl font-bold text-orange-600">
                    {Math.round(aggregatedResult.summary.avgSessionDuration / 60)} 分钟
                  </div>
                  <div className="text-xs text-gray-400 mt-1">共 {aggregatedResult.summary.totalSessions.toLocaleString()} 次会话</div>
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
            <span>统一聚合数据模型，所有视图共享同一查询结果</span>
            <span>·</span>
            <span>注册/激活/邀请/付费/使用/流失 全链路 ETL 清洗</span>
          </div>
          <div className="flex items-center gap-4">
            <span>缓存大小: {cacheStats.size} 条目 (5分钟 TTL)</span>
            <span>·</span>
            <span>标准导出: CSV / Excel (.xlsx) / PDF</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
