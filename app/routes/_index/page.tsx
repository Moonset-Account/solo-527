import { useState, useEffect, useCallback } from 'react';
import { FilterProvider, useFilters } from '~/contexts/FilterContext';
import Header from '~/components/Header';
import FilterBar from '~/components/FilterBar';
import AnomalyCard from '~/components/AnomalyCard';
import FunnelChart from '~/components/charts/FunnelChart';
import ParetoChart from '~/components/charts/ParetoChart';
import PromotionChart from '~/components/charts/PromotionChart';
import SupplierRanking from '~/components/charts/SupplierRanking';
import WeatherTrafficChart from '~/components/charts/WeatherTrafficChart';
import { api } from '~/utils/api';
import type { 
  OverviewResponse, 
  FunnelResponse, 
  ParetoResponse, 
  PromotionResponse, 
  SupplierResponse,
  WeatherTrafficResponse
} from '@shared/types';
import { formatCurrency, formatPercent } from '~/utils/format';
import { TrendingDown, Package, AlertTriangle, Sparkles } from 'lucide-react';

function DashboardContent() {
  const { filters } = useFilters();
  
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [pareto, setPareto] = useState<ParetoResponse | null>(null);
  const [promotion, setPromotion] = useState<PromotionResponse | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierResponse | null>(null);
  const [weatherTraffic, setWeatherTraffic] = useState<WeatherTrafficResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, f, p, pr, s, wt] = await Promise.all([
        api.getOverview(filters),
        api.getFunnel(filters),
        api.getPareto(filters),
        api.getPromotion(filters),
        api.getSuppliers(filters),
        api.getWeatherTraffic(filters),
      ]);
      setOverview(o);
      setFunnel(f);
      setPareto(p);
      setPromotion(pr);
      setSuppliers(s);
      setWeatherTraffic(wt);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await api.createExport({
        filters,
        format: 'xlsx',
        includeCharts: true,
      });
      alert(`导出任务已创建！任务ID: ${result.id}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const kpiCards = overview ? [
    {
      label: '总损耗金额',
      value: formatCurrency(overview.summary.totalLoss),
      change: '-12.5%',
      isPositive: true,
      icon: TrendingDown,
      color: 'from-red-500 to-orange-500',
    },
    {
      label: '综合损耗率',
      value: overview.summary.lossRate + '%',
      change: '-2.1%',
      isPositive: true,
      icon: Package,
      color: 'from-amber-500 to-yellow-500',
    },
    {
      label: '临期预警批次',
      value: String(overview.summary.nearExpiryCount),
      change: '+5',
      isPositive: false,
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: '促销有效率',
      value: (overview.summary.promotionEffectiveness * 100).toFixed(0) + '%',
      change: '+8.3%',
      isPositive: true,
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-deep-blue">
      <Header onExport={handleExport} />
      <FilterBar />

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-fresh-green rounded-full" />
            核心指标
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${kpi.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">{kpi.label}</span>
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${kpi.color} bg-opacity-20`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-display font-bold text-white">{kpi.value}</p>
                    <p className={`text-xs mt-1 font-medium ${kpi.isPositive ? 'text-fresh-green' : 'text-loss-red'}`}>
                      {kpi.change} 较上期
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-loss-red rounded-full" />
            异常摘要
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-slate-800/50 skeleton" />
              ))
            ) : overview ? (
              overview.anomalies.map((anomaly) => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
              ))
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full" />
            分析视图
          </h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FunnelChart data={funnel} loading={loading} />
            <ParetoChart data={pareto} loading={loading} />
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PromotionChart data={promotion} loading={loading} />
            <SupplierRanking data={suppliers} loading={loading} />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <WeatherTrafficChart data={weatherTraffic} loading={loading} />
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-slate-500 pb-8">
          <p>数据更新时间: {new Date().toLocaleString('zh-CN')} | 生鲜损耗分析仪表盘 v1.0</p>
        </footer>
      </main>

      {exporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-fresh-green rounded-full animate-spin" />
              <span className="text-white">正在生成报告...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
}
