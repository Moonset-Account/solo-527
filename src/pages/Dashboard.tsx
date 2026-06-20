import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getReminders } from '@/api/reminders';
import { getOverdueDetails } from '@/api/reports';
import type { Reminder, OverdueDetail, DashboardStats } from '@/types';

const mockTrendData: DashboardStats['overdue_trend'] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    amount: Math.round(120000 + Math.sin(i / 3) * 30000 + Math.random() * 15000),
  };
});

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  trend,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center gap-0.5 text-xs font-medium" style={{ color: trend === 'up' ? '#ef4444' : '#10b981' }}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend === 'up' ? '12%' : '8%'}
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-200 rounded" />;
}

const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const priorityLabels: Record<string, string> = {
  high: '紧急',
  medium: '中等',
  low: '低',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdueDetails, setOverdueDetails] = useState<OverdueDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [remindersRes, overdueRes] = await Promise.all([
          getReminders({ status: 'pending', page_size: 10 }),
          getOverdueDetails(),
        ]);
        setReminders(remindersRes.data.results);
        setOverdueDetails(overdueRes.data);
      } catch {
        // silently fail, show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalOverdue = overdueDetails.reduce((sum, d) => sum + d.difference_amount, 0);
    const pendingCount = reminders.length;
    const handledCount = overdueDetails.filter((d) => d.status === 'handled').length;
    const total = overdueDetails.length || 1;
    const recoveryRate = Math.round((handledCount / total) * 100);
    const escalationCount = overdueDetails.filter((d) => d.escalation_level > 0).length;

    return {
      totalOverdue,
      pendingCount,
      recoveryRate,
      escalationCount,
    };
  }, [reminders, overdueDetails]);

  const formatAmount = (n: number) => {
    if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
    return `¥${n.toLocaleString()}`;
  };

  const getRemainingTime = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `逾期${Math.abs(days)}天`;
    if (days === 0) return '今天到期';
    return `剩余${days}天`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-24 mt-3" />
              <Skeleton className="h-4 w-16 mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          icon={AlertTriangle}
          value={formatAmount(stats.totalOverdue)}
          label="逾期总额"
          color="#ef4444"
          trend="up"
        />
        <StatCard
          icon={Bell}
          value={String(stats.pendingCount)}
          label="待处理提醒"
          color="#f59e0b"
          trend="up"
        />
        <StatCard
          icon={TrendingUp}
          value={`${stats.recoveryRate}%`}
          label="本月回收率"
          color="#10b981"
          trend="down"
        />
        <StatCard
          icon={AlertTriangle}
          value={String(stats.escalationCount)}
          label="超时升级数"
          color="#ef4444"
          trend="up"
        />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 mb-4">待处理提醒</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium w-12">#</th>
                <th className="pb-3 font-medium">项目</th>
                <th className="pb-3 font-medium">客户</th>
                <th className="pb-3 font-medium">负责人</th>
                <th className="pb-3 font-medium">优先级</th>
                <th className="pb-3 font-medium">剩余时间</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {overdueDetails.slice(0, 10).map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-400">{idx + 1}</td>
                  <td className="py-3 font-medium text-gray-900">{item.project_name}</td>
                  <td className="py-3 text-gray-600">{item.client_name}</td>
                  <td className="py-3 text-gray-600">{item.assignee_name}</td>
                  <td className="py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: priorityColors[item.priority] || '#6b7280' }}
                    >
                      {priorityLabels[item.priority] || item.priority}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{getRemainingTime(item.due_date)}</td>
                  <td className="py-3">
                    <button
                      onClick={() => navigate('/reminders')}
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#f59e0b' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#d97706')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#f59e0b')}
                    >
                      处理
                    </button>
                  </td>
                </tr>
              ))}
              {overdueDetails.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    暂无待处理提醒
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 mb-4">逾期趋势</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mockTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="overdueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
            />
            <Tooltip
              formatter={(value: number) => [`¥${value.toLocaleString()}`, '逾期金额']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#overdueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
