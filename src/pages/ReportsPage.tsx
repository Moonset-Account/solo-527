import { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  UserCheck,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star,
  Trophy,
  Medal,
  Award,
  PieChart,
  LineChart,
  ShoppingCart,
  Eye,
  ArrowRight,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  conversionReports,
  technicianPerformances,
  servicePackages,
  appointments,
} from '@/data/mockData';
import { TechnicianPerformance } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'conversion' | 'performance' | 'revenue';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'primary' | 'accent' | 'success' | 'info';
}

function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendLabel,
  color,
}: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-green-50 text-green-600',
    info: 'bg-blue-50 text-blue-600',
  };

  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
        <div className={cn('p-3 rounded-xl', colorClasses[color])}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-4">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            className={cn(
              'text-sm font-medium',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isPositive ? '+' : ''}
            {trend}%
          </span>
          {trendLabel && (
            <span className="text-sm text-gray-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

function FunnelChart() {
  const stages = [
    { name: '浏览', value: 1000, rate: 100, color: 'from-primary-400 to-primary-500' },
    { name: '预约', value: 350, rate: 35, color: 'from-primary-500 to-primary-600' },
    { name: '到店', value: 298, rate: 85.1, color: 'from-accent-400 to-accent-500' },
    { name: '加购', value: 178, rate: 59.7, color: 'from-accent-500 to-accent-600' },
    { name: '完成', value: 156, rate: 87.6, color: 'from-green-400 to-green-500' },
  ];

  const maxWidth = 100;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary-500" />
        转化漏斗
      </h3>
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPercent = (stage.value / stages[0].value) * maxWidth;
          const prevValue = index > 0 ? stages[index - 1].value : stage.value;
          const conversionRate =
            index > 0
              ? ((stage.value / prevValue) * 100).toFixed(1)
              : '100';

          return (
            <div key={stage.name} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {stage.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {stage.value}
                  </span>
                  <span className="text-xs text-gray-400">
                    {index > 0 ? `转化率 ${conversionRate}%` : `${stage.rate}%`}
                  </span>
                </div>
              </div>
              <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={cn(
                    'h-full bg-gradient-to-r rounded-lg transition-all duration-500',
                    stage.color
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyTrendChart() {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const data = [32, 45, 38, 52, 60, 78, 65];
  const maxValue = Math.max(...data);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <LineChart className="w-5 h-5 text-primary-500" />
        日趋势
      </h3>
      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((value, index) => {
          const heightPercent = (value / maxValue) * 100;
          return (
            <div key={days[index]} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-2">{value}</span>
              <div
                className="w-full bg-gradient-to-t from-primary-500 to-accent-400 rounded-t-lg transition-all duration-300 hover:opacity-80"
                style={{ height: `${heightPercent}%` }}
              />
              <span className="text-xs text-gray-400 mt-2">
                {days[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RankRowProps {
  tech: TechnicianPerformance;
  rank: number;
}

function RankRow({ tech, rank }: RankRowProps) {
  const getRankIcon = () => {
    if (rank === 1) {
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    }
    if (rank === 2) {
      return <Medal className="w-5 h-5 text-gray-400" />;
    }
    if (rank === 3) {
      return <Award className="w-5 h-5 text-amber-600" />;
    }
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-gray-500">
        {rank}
      </span>
    );
  };

  const getRankBg = () => {
    if (rank === 1) return 'bg-yellow-50 border-l-yellow-500';
    if (rank === 2) return 'bg-gray-50 border-l-gray-400';
    if (rank === 3) return 'bg-amber-50 border-l-amber-600';
    return '';
  };

  return (
    <tr className={cn('border-l-4 transition-colors hover:bg-gray-50', getRankBg())}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {getRankIcon()}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {tech.technicianName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{tech.serviceCount} 单</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-accent-600">
          ¥{tech.revenue.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-gray-700">
            {tech.rating}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          status={tech.rating >= 4.8 ? 'success' : tech.rating >= 4.6 ? 'info' : 'warning'}
          text={tech.rating >= 4.8 ? '优秀' : tech.rating >= 4.6 ? '良好' : '待提升'}
        />
      </td>
    </tr>
  );
}

function PerformanceRanking() {
  const sortedTechs = useMemo(() => {
    return [...technicianPerformances].sort((a, b) => b.revenue - a.revenue);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent-500" />
          技师绩效排行榜
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">按营收排名</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">
                排名
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                技师姓名
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                服务量
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                营收
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                满意度
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                评价
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTechs.map((tech, index) => (
              <RankRow key={tech.technicianId} tech={tech} rank={index + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyRevenueChart() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const data = [85000, 92000, 78000, 105000, 118000, 95000];
  const maxValue = Math.max(...data);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary-500" />
        月度营收
      </h3>
      <div className="flex items-end justify-between h-56 gap-3">
        {data.map((value, index) => {
          const heightPercent = (value / maxValue) * 100;
          const isCurrent = index === 5;
          return (
            <div key={months[index]} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-2">
                ¥{(value / 1000).toFixed(0)}k
              </span>
              <div
                className={cn(
                  'w-full rounded-t-lg transition-all duration-300',
                  isCurrent
                    ? 'bg-gradient-to-t from-primary-600 to-accent-400'
                    : 'bg-gradient-to-t from-primary-400 to-primary-300'
                )}
                style={{ height: `${heightPercent}%` }}
              />
              <span
                className={cn(
                  'text-xs mt-2',
                  isCurrent ? 'text-primary-600 font-semibold' : 'text-gray-400'
                )}
              >
                {months[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceCategoryPie() {
  const categories = [
    { name: '洗车服务', value: 45, color: 'bg-primary-500' },
    { name: '精洗服务', value: 25, color: 'bg-accent-500' },
    { name: '内饰服务', value: 15, color: 'bg-green-500' },
    { name: '养护服务', value: 10, color: 'bg-yellow-500' },
    { name: '镀晶镀膜', value: 5, color: 'bg-purple-500' },
  ];

  const total = categories.reduce((sum, c) => sum + c.value, 0);
  let cumulative = 0;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-primary-500" />
        服务项目占比
      </h3>
      <div className="flex items-center gap-8">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-gray-100" />
          <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">总服务量</p>
            </div>
          </div>
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
            {categories.map((cat, index) => {
              const startAngle = cumulative * 3.6;
              const endAngle = (cumulative + cat.value) * 3.6;
              cumulative += cat.value;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 50 + 50 * Math.cos(startRad);
              const y1 = 50 + 50 * Math.sin(startRad);
              const x2 = 50 + 50 * Math.cos(endRad);
              const y2 = 50 + 50 * Math.sin(endRad);

              const largeArc = cat.value > 50 ? 1 : 0;

              const colorMap: Record<string, string> = {
                'bg-primary-500': '#1991B9',
                'bg-accent-500': '#FF8241',
                'bg-green-500': '#22C55E',
                'bg-yellow-500': '#EAB308',
                'bg-purple-500': '#A855F7',
              };

              return (
                <path
                  key={cat.name}
                  d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colorMap[cat.color]}
                  className="transition-opacity hover:opacity-80"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-sm', cat.color)} />
                <span className="text-sm text-gray-600">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {cat.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConversionTab() {
  const report = conversionReports[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-card">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">本周</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">至今</span>
          </div>
          <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            自定义日期
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="预约量"
          value={report?.totalAppointments || 28}
          unit="单"
          icon={<ShoppingCart className="w-6 h-6" />}
          trend={12.5}
          trendLabel="较上周"
          color="primary"
        />
        <MetricCard
          title="到店率"
          value={((report?.arrivalRate || 0) * 100).toFixed(1)}
          unit="%"
          icon={<UserCheck className="w-6 h-6" />}
          trend={3.2}
          trendLabel="较上周"
          color="success"
        />
        <MetricCard
          title="完成率"
          value={((report?.completionRate || 0) * 100).toFixed(1)}
          unit="%"
          icon={<CheckCircle className="w-6 h-6" />}
          trend={-1.5}
          trendLabel="较上周"
          color="accent"
        />
        <MetricCard
          title="平均客单价"
          value={report?.avgRevenue || 125.5}
          unit="元"
          icon={<DollarSign className="w-6 h-6" />}
          trend={8.7}
          trendLabel="较上周"
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart />
        <DailyTrendChart />
      </div>
    </div>
  );
}

function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="总服务量"
          value={technicianPerformances.reduce((sum, t) => sum + t.serviceCount, 0)}
          unit="单"
          icon={<Users className="w-6 h-6" />}
          color="primary"
        />
        <MetricCard
          title="总营收"
          value={technicianPerformances.reduce((sum, t) => sum + t.revenue, 0).toLocaleString()}
          unit="元"
          icon={<DollarSign className="w-6 h-6" />}
          color="accent"
        />
        <MetricCard
          title="平均满意度"
          value={(technicianPerformances.reduce((sum, t) => sum + t.rating, 0) / technicianPerformances.length).toFixed(1)}
          unit="分"
          icon={<Star className="w-6 h-6" />}
          color="success"
        />
      </div>
      <PerformanceRanking />
    </div>
  );
}

function RevenueTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="本月营收"
          value="118,000"
          unit="元"
          icon={<DollarSign className="w-6 h-6" />}
          trend={15.3}
          trendLabel="较上月"
          color="primary"
        />
        <MetricCard
          title="服务单数"
          value="328"
          unit="单"
          icon={<ShoppingCart className="w-6 h-6" />}
          trend={8.2}
          trendLabel="较上月"
          color="accent"
        />
        <MetricCard
          title="客单价"
          value="359.8"
          unit="元"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={6.5}
          trendLabel="较上月"
          color="success"
        />
        <MetricCard
          title="新增会员"
          value="42"
          unit="人"
          icon={<Users className="w-6 h-6" />}
          trend={12.0}
          trendLabel="较上月"
          color="info"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyRevenueChart />
        <ServiceCategoryPie />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('conversion');

  const tabs = [
    { key: 'conversion', label: '转化报表', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'performance', label: '技师绩效', icon: <Trophy className="w-4 h-4" /> },
    { key: 'revenue', label: '营收分析', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <AdminLayout title="到店转化报表" className="bg-gray-50">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-card p-1 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'conversion' && <ConversionTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </div>
    </AdminLayout>
  );
}
