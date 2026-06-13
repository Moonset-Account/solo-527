import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ClipboardCheck, CheckCircle, XCircle, Eye, Bell, Send, Layers, Download } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, getRepairTypeLabel } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';

const statCards = [
  { key: 'pending', label: '待审核', icon: Clock, color: 'bg-yellow-500' },
  { key: 'processing', label: '处理中', icon: ClipboardCheck, color: 'bg-blue-500' },
  { key: 'completed', label: '已完成', icon: CheckCircle, color: 'bg-green-500' },
  { key: 'rejected', label: '被驳回', icon: XCircle, color: 'bg-red-500' },
] as const;

const quickActions = [
  { label: '提交报修', icon: Send, path: '/repair/submit' },
  { label: '批量处理', icon: Layers, path: '/batch' },
  { label: '导出数据', icon: Download, path: '/details' },
];

export default function Dashboard() {
  const { repairs, repairsLoading, fetchRepairs, notifications, notificationsLoading, fetchNotifications } = useAppStore();

  useEffect(() => {
    fetchRepairs();
    fetchNotifications();
  }, [fetchRepairs, fetchNotifications]);

  const counts = {
    pending: repairs.filter((r) => r.status === 'pending' || r.status === 'identity_verifying' || r.status === 'quota_checking').length,
    processing: repairs.filter((r) => r.status === 'assigned' || r.status === 'processing').length,
    completed: repairs.filter((r) => r.status === 'completed').length,
    rejected: repairs.filter((r) => r.status === 'rejected').length,
  };

  const recentRepairs = repairs.slice(0, 10);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">仪表盘</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color} text-white`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{counts[card.key]}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">最近报修</h2>
          {repairsLoading ? (
            <div className="py-12 text-center text-slate-400">加载中...</div>
          ) : recentRepairs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4 font-medium">申请单号</th>
                    <th className="pb-3 pr-4 font-medium">申请人</th>
                    <th className="pb-3 pr-4 font-medium">楼栋</th>
                    <th className="pb-3 pr-4 font-medium">类型</th>
                    <th className="pb-3 pr-4 font-medium">紧急度</th>
                    <th className="pb-3 pr-4 font-medium">状态</th>
                    <th className="pb-3 pr-4 font-medium">提交时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRepairs.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">{r.id.slice(0, 8)}...</td>
                      <td className="py-3 pr-4 text-slate-700">{r.studentName}</td>
                      <td className="py-3 pr-4 text-slate-700">{r.building}</td>
                      <td className="py-3 pr-4 text-slate-700">{getRepairTypeLabel(r.repairType)}</td>
                      <td className="py-3 pr-4"><UrgencyBadge urgency={r.urgency} /></td>
                      <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(r.createdAt)}</td>
                      <td className="py-3">
                        <Link to={`/review/${r.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <Eye size={14} /> 查看
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">效率通知</h2>
            {notificationsLoading ? (
              <div className="py-8 text-center text-slate-400">加载中...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">暂无通知</div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-3 ${n.isRead ? 'border-slate-200 bg-slate-50' : 'border-blue-200 bg-blue-50'}`}>
                    <Bell size={16} className={n.isRead ? 'mt-0.5 text-slate-400' : 'mt-0.5 text-blue-500'} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">快捷操作</h2>
            <div className="flex flex-col gap-3">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Icon size={20} className="text-blue-600" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
