import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatNumber } from '../lib/utils';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { FileText, Calendar, AlertTriangle, Eye, BookOpen, Share2, MessageSquare } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.dashboard.overview(),
  });

  const { data: trend } = useQuery({
    queryKey: ['dashboard', 'conversion-trend'],
    queryFn: () => api.dashboard.conversionTrend(7),
  });

  const { data: topMaterials } = useQuery({
    queryKey: ['dashboard', 'top-materials'],
    queryFn: () => api.dashboard.topMaterials(),
  });

  const { data: exceptions } = useQuery({
    queryKey: ['exceptions', 'open'],
    queryFn: () => api.exceptions.list({ status: 'open' }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">数据复盘看板</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<FileText size={20} />}
          label="素材总量"
          value={overview?.data.materialCount ?? 0}
          color="blue"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="已发布"
          value={overview?.data.publishedCount ?? 0}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="待处理异常"
          value={overview?.data.openExceptions ?? 0}
          color="red"
        />
        <StatCard
          icon={<Eye size={20} />}
          label="总阅读量"
          value={overview?.data.conversions?.totalViews ?? 0}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={<Eye size={16} />} label="浏览量" value={overview?.data.conversions?.totalViews ?? 0} />
        <MiniStat icon={<BookOpen size={16} />} label="阅读量" value={overview?.data.conversions?.totalReads ?? 0} />
        <MiniStat icon={<Share2 size={16} />} label="分享量" value={overview?.data.conversions?.totalShares ?? 0} />
        <MiniStat icon={<MessageSquare size={16} />} label="评论量" value={overview?.data.conversions?.totalComments ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4">阅读转化趋势（近7天）</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="views" name="浏览" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="reads" name="阅读" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shares" name="分享" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="comments" name="评论" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4">热门素材</h3>
          <div className="space-y-3">
            {topMaterials?.data.map((m, i) => (
              <Link
                key={m.id}
                to="/materials/$id"
                params={{ id: m.id }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                </div>
                <span className="text-xs text-amber-600 font-medium">
                  {m.reuseCount ?? 0}次
                </span>
              </Link>
            ))}
            {(!topMaterials?.data || topMaterials.data.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {exceptions && exceptions.data.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
            <AlertTriangle size={18} />
            待处理异常
          </h3>
          <div className="space-y-2">
            {exceptions.data.map((ex) => (
              <Link
                key={ex.id}
                to="/exceptions"
                className="flex items-center justify-between bg-white border border-red-100 rounded-lg p-3 hover:border-red-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-red-900">{ex.description || ex.type}</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {ex.scheduleTitle} · {ex.platform}
                  </p>
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {ex.status === 'open' ? '待处理' : '处理中'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const bgColors = { blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50', purple: 'bg-purple-50' };
  const textColors = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600', purple: 'text-purple-600' };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgColors[color]} flex items-center justify-center ${textColors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{formatNumber(value)}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900 ml-auto">{formatNumber(value)}</span>
    </div>
  );
}
