import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TicketCheck, Loader2, Server, AlertTriangle } from 'lucide-react';
import { useTicketStore } from '@/store/ticket.store';
import { useAssetStore } from '@/store/asset.store';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-lg ${bgColor} flex items-center justify-center`}>
          <div className={color}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { tickets, total, fetchTickets } = useTicketStore();
  const { assets, fetchAssets } = useAssetStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchTickets({ limit: 5 });
    fetchAssets({ limit: 1 });
  }, [fetchTickets, fetchAssets]);

  useEffect(() => {
    const pending = tickets.filter((t) => t.status === 'pending').length;
    const inProgress = tickets.filter((t) => t.status === 'in-progress' || t.status === 'assigned').length;
    setStats({
      pending,
      inProgress,
      overdue: 0,
    });
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          label="待处理工单"
          value={stats.pending}
          icon={<TicketCheck className="w-5 h-5" />}
          color="text-[var(--color-warning)]"
          bgColor="bg-amber-50"
        />
        <StatCard
          label="进行中工单"
          value={stats.inProgress}
          icon={<Loader2 className="w-5 h-5" />}
          color="text-[var(--color-primary)]"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="资产总数"
          value={total || 0}
          icon={<Server className="w-5 h-5" />}
          color="text-[var(--color-success)]"
          bgColor="bg-green-50"
        />
        <StatCard
          label="超时工单"
          value={stats.overdue}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-[var(--color-danger)]"
          bgColor="bg-red-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
            最近工单
          </h3>
          <button
            onClick={() => navigate('/tickets')}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            查看全部
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3 font-semibold text-[var(--color-text-secondary)]">ID</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--color-text-secondary)]">标题</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--color-text-secondary)]">类型</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--color-text-secondary)]">优先级</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--color-text-secondary)]">状态</th>
              <th className="text-left px-5 py-3 font-semibold text-[var(--color-text-secondary)]">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--color-text-secondary)]">
                  暂无工单
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#f8fafc] cursor-pointer"
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  <td className="px-5 py-3 text-[var(--color-primary)]">#{t.id}</td>
                  <td className="px-5 py-3">{t.title}</td>
                  <td className="px-5 py-3">{t.type === 'request' ? '申请' : '故障'}</td>
                  <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                    {new Date(t.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/tickets/create')}
          className="btn-primary flex items-center gap-2"
        >
          <TicketCheck className="w-4 h-4" />
          创建工单
        </button>
        <button
          onClick={() => navigate('/assets')}
          className="btn-secondary flex items-center gap-2"
        >
          <Server className="w-4 h-4" />
          资产管理
        </button>
      </div>
    </div>
  );
}
