'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Droplets,
  Thermometer,
  Beaker,
  Activity,
  MapPin,
  ChevronRight,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/utils/apiClient';
import { useAuthStore } from '@/lib/store/useAuthStore';
import type { OverviewStats } from '@/types';
import { WATER_QUALITY_GRADES } from '@/lib/utils/constants';

const indicatorIcons = {
  temperature: Thermometer,
  ph: Beaker,
  dissolvedOxygen: Droplets,
  ammoniaNitrogen: Activity,
};

const indicatorColors = {
  temperature: 'from-orange-400 to-orange-600',
  ph: 'from-purple-400 to-purple-600',
  dissolvedOxygen: 'from-cyan-400 to-blue-600',
  ammoniaNitrogen: 'from-red-400 to-red-600',
};

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: string;
  unit: string;
  icon: any;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendValue}
        </div>
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-sm text-slate-400 ml-1">{unit}</span>
      </div>
      <p className="text-sm text-slate-500">{title}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const org = user?.role === 'admin' ? undefined : user?.organization;
      const data = await apiClient.getOverview(org) as OverviewStats;
      setStats(data);
    } catch (err: any) {
      setError(err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">总览仪表盘</h1>
            <p className="text-slate-500 mt-1">加载中...</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">总览仪表盘</h1>
            <p className="text-slate-500 mt-1">数据加载失败</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">数据加载失败</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">总览仪表盘</h1>
          <p className="text-slate-500 mt-1">
            数据更新时间：{new Date(stats.latestDataTime).toLocaleString('zh-CN')}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="监测站点"
          value={stats.totalSites.toString()}
          unit="个"
          icon={MapPin}
          trend="up"
          trendValue="全部正常运行"
          color="from-cyan-500 to-blue-600"
        />
        <StatCard
          title="监测记录"
          value={stats.totalRecords.toLocaleString()}
          unit="条"
          icon={Activity}
          trend="up"
          trendValue="实时更新"
          color="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="异常数据"
          value={stats.anomalyCount.toString()}
          unit="条"
          icon={AlertTriangle}
          trend="down"
          trendValue="待处理"
          color="from-amber-500 to-orange-600"
        />
        <StatCard
          title="整体达标率"
          value={stats.complianceRate.toFixed(1)}
          unit="%"
          icon={TrendingUp}
          trend="up"
          trendValue="持续改善"
          color="from-violet-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-4 gap-5">
        {stats.indicators.map((ind) => {
          const Icon = indicatorIcons[ind.code as keyof typeof indicatorIcons];
          const color = indicatorColors[ind.code as keyof typeof indicatorColors];

          return (
            <div
              key={ind.code}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100"
              onClick={() => router.push('/trends')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  {ind.complianceRate}% 达标
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-slate-800">
                  {ind.avgValue !== null ? ind.avgValue.toFixed(2) : '-'}
                </span>
                <span className="text-sm text-slate-400 ml-1">{ind.unit}</span>
              </div>
              <p className="text-sm text-slate-500">{ind.name}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">河段概况</h3>
          <div className="space-y-3">
            {stats.riverSections.map((section) => {
              const gradeInfo = WATER_QUALITY_GRADES.find(g => g.grade === section.avgGrade);
              return (
                <div
                  key={section.name}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => router.push('/map')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: gradeInfo?.color || '#64748b' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{section.name}</p>
                      <p className="text-xs text-slate-500">{section.siteCount} 个监测站点</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {section.anomalyCount > 0 && (
                      <span className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-full">
                        {section.anomalyCount} 条异常
                      </span>
                    )}
                    <span className={`text-sm font-medium px-2 py-1 rounded`} style={{ backgroundColor: `${gradeInfo?.color}20`, color: gradeInfo?.color }}>
                      {section.avgGrade}类
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">最近异常</h3>
          <div className="space-y-3">
            {stats.recentAnomalies.length > 0 ? (
              stats.recentAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="p-3 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors"
                  onClick={() => router.push('/trends')}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700">{anomaly.siteName}</p>
                    <span className="text-xs text-rose-600 font-medium">{anomaly.indicator}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(anomaly.sampleTime).toLocaleString('zh-CN')}
                  </p>
                  {anomaly.reason && (
                    <p className="text-xs text-slate-400 mt-1">原因: {anomaly.reason}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">暂无异常数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
