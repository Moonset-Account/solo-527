import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type PublishSchedule } from '../lib/api';
import { formatDate, formatNumber } from '../lib/utils';
import { Plus, X, Eye, BookOpen, Share2, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';

export const Route = createFileRoute('/conversions')({
  component: ConversionsPage,
});

function ConversionsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: conversions } = useQuery({
    queryKey: ['conversions'],
    queryFn: () => api.conversions.list(),
  });

  const { data: summary } = useQuery({
    queryKey: ['conversions', 'summary'],
    queryFn: () => api.conversions.summary(),
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules-all'],
    queryFn: () => api.schedules.list({ status: 'published' }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">阅读转化数据</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          录入数据
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Eye size={18} />} label="总浏览" value={summary?.data?.totalViews ?? 0} color="blue" />
        <StatCard icon={<BookOpen size={18} />} label="总阅读" value={summary?.data?.totalReads ?? 0} color="green" />
        <StatCard icon={<Share2 size={18} />} label="总分享" value={summary?.data?.totalShares ?? 0} color="amber" />
        <StatCard icon={<MessageSquare size={18} />} label="总评论" value={summary?.data?.totalComments ?? 0} color="purple" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">排期/文章</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">平台</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">浏览</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">阅读</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">分享</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">评论</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">转化率</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">统计时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversions?.data.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-slate-400" />
                      {conv.scheduleTitle || conv.scheduleId?.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{conv.platform || '-'}</td>
                  <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatNumber(conv.views)}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-mono font-medium">{formatNumber(conv.reads)}</td>
                  <td className="px-4 py-3 text-right text-amber-700 font-mono">{formatNumber(conv.shares)}</td>
                  <td className="px-4 py-3 text-right text-purple-700 font-mono">{formatNumber(conv.comments)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      <TrendingUp size={10} />
                      {conv.conversionRate || '0'}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDate(conv.recordedAt)}</td>
                </tr>
              ))}
              {conversions?.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    暂无转化数据，点击上方按钮录入
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <ConversionModal
          schedules={schedules?.data || []}
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
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
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const bgColors = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50', purple: 'bg-purple-50' };
  const textColors = { blue: 'text-blue-600', green: 'text-green-600', amber: 'text-amber-600', purple: 'text-purple-600' };

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

function ConversionModal({
  schedules,
  onClose,
  onSuccess,
}: {
  schedules: PublishSchedule[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [scheduleId, setScheduleId] = useState('');
  const [views, setViews] = useState('');
  const [reads, setReads] = useState('');
  const [shares, setShares] = useState('');
  const [comments, setComments] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: api.conversions.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const viewsNum = Number(views) || 0;
    const readsNum = Number(reads) || 0;
    let rate = conversionRate;
    if (!rate && viewsNum > 0) {
      rate = ((readsNum / viewsNum) * 100).toFixed(2);
    }
    mutation.mutate({
      scheduleId,
      views: viewsNum,
      reads: readsNum,
      shares: Number(shares) || 0,
      comments: Number(comments) || 0,
      conversionRate: rate || '0',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">录入阅读转化数据</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">关联排期 *</label>
            <select
              value={scheduleId}
              onChange={(e) => setScheduleId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择已发布的排期</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{s.title} ({s.platform})</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">只显示状态为「已发布」的排期</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Eye size={12} className="inline mr-1" />浏览量
              </label>
              <input
                type="number"
                min="0"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <BookOpen size={12} className="inline mr-1" />阅读量
              </label>
              <input
                type="number"
                min="0"
                value={reads}
                onChange={(e) => setReads(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Share2 size={12} className="inline mr-1" />分享数
              </label>
              <input
                type="number"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <MessageSquare size={12} className="inline mr-1" />评论数
              </label>
              <input
                type="number"
                min="0"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <TrendingUp size={12} className="inline mr-1" />
              转化率 (%)
            </label>
            <input
              type="text"
              value={conversionRate}
              onChange={(e) => setConversionRate(e.target.value)}
              placeholder="留空则自动按 阅读/浏览 计算"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !scheduleId}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? '保存中...' : '录入数据'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
