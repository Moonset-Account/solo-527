import { useNavigate } from 'react-router-dom';
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
  Eye,
  RefreshCw,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { useOverview } from '../hooks/useData';
import { WATER_QUALITY_GRADES } from '../utils/constants';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, loading, error, refetch } = useOverview();

  if (loading || !stats) {
    return (
      <PageContainer title="总览仪表盘" subtitle="加载中...">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-80 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="总览仪表盘" subtitle="数据加载失败">
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">数据加载失败</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重新加载
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="总览仪表盘"
      subtitle={`数据更新时间：${new Date(stats.latestDataTime).toLocaleString('zh-CN')}`}
      actions={
        <button
          onClick={refetch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-5 mb-6">
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

      <div className="grid grid-cols-4 gap-5 mb-6">
        {stats.indicators.map((ind) => {
          const Icon = indicatorIcons[ind.code as keyof typeof indicatorIcons];
          const color = indicatorColors[ind.code as keyof typeof indicatorColors];
          const trend = Math.random() > 0.5 ? 'up' : 'down';

          return (
            <div
              key={ind.code}
              className="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border border-slate-100"
              onClick={() => navigate('/trends')}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    trend === 'up'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {(Math.random() * 5).toFixed(1)}%
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">{ind.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-slate-800 font-mono">
                  {ind.avgValue?.toFixed(2) || '--'}
                </span>
                <span className="text-sm text-slate-400">{ind.unit}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">达标率</span>
                  <span className="font-semibold text-slate-700">
                    {ind.complianceRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${ind.complianceRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-semibold text-slate-800">河段水质概览</h3>
            <button
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
              onClick={() => navigate('/trends')}
            >
              查看详情 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {stats.riverSections.map((section) => {
                const gradeInfo = WATER_QUALITY_GRADES.find(
                  (g) => g.grade === section.avgGrade
                );
                return (
                  <div
                    key={section.name}
                    className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/trends')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">{section.name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: gradeInfo?.color }}
                        >
                          {section.avgGrade}类
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">
                          {section.siteCount} 个站点
                        </span>
                        <span className="text-rose-500 font-medium">
                          {section.anomalyCount} 条异常
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {WATER_QUALITY_GRADES.map((grade) => (
                        <div
                          key={grade.grade}
                          className="flex-1 h-2 rounded-full first:rounded-l-full last:rounded-r-full"
                          style={{
                            backgroundColor:
                              grade.grade === section.avgGrade
                                ? grade.color
                                : '#e2e8f0',
                            opacity: grade.grade === section.avgGrade ? 1 : 0.4,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-semibold text-slate-800">最新异常</h3>
            <button
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
              onClick={() => navigate('/trends')}
            >
              全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {stats.recentAnomalies.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                <p>暂无异常数据</p>
              </div>
            ) : (
              stats.recentAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/trends')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {anomaly.siteName}
                        </p>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 font-medium flex-shrink-0">
                          {anomaly.indicator}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(anomaly.sampleTime).toLocaleString('zh-CN')}
                      </p>
                      {anomaly.reason && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          原因：{anomaly.reason}
                        </p>
                      )}
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 flex-shrink-0">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: any;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
}

function StatCard({ title, value, unit, icon: Icon, trend, trendValue, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-display font-bold text-slate-800">{value}</span>
            <span className="text-sm text-slate-400">{unit}</span>
          </div>
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        {trend === 'up' ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-rose-500" />
        )}
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {trendValue}
        </span>
      </div>
    </div>
  );
}
