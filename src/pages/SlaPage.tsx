import { useEffect, useState } from 'react';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSlaStore } from '@/store/sla.store';
import DataTable from '@/components/DataTable';

interface StatCardProps {
  label: string;
  value: string;
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

export default function SlaPage() {
  const { stats, details, total, loading, fetchSlaStats, fetchSlaDetails } = useSlaStore();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSlaStats({ startDate: startDate || undefined, endDate: endDate || undefined });
    fetchSlaDetails({ page, limit: 20, startDate: startDate || undefined, endDate: endDate || undefined });
  }, [page, fetchSlaStats, fetchSlaDetails]);

  const handleFilter = () => {
    setPage(1);
    fetchSlaStats({ startDate: startDate || undefined, endDate: endDate || undefined });
    fetchSlaDetails({ page: 1, limit: 20, startDate: startDate || undefined, endDate: endDate || undefined });
  };

  const columns = [
    { key: 'ticketId', title: '工单ID', render: (row: Record<string, unknown>) => (
      <span className="text-[var(--color-primary)]">#{row.ticketId as number}</span>
    )},
    { key: 'ticketTitle', title: '工单标题' },
    { key: 'stage', title: '阶段' },
    { key: 'startedAt', title: '开始时间', render: (row: Record<string, unknown>) =>
      (row.startedAt as string) ? new Date(row.startedAt as string).toLocaleString('zh-CN') : '-'
    },
    { key: 'completedAt', title: '完成时间', render: (row: Record<string, unknown>) =>
      (row.completedAt as string) ? new Date(row.completedAt as string).toLocaleString('zh-CN') : '-'
    },
    { key: 'durationMinutes', title: '耗时(分钟)', render: (row: Record<string, unknown>) =>
      (row.durationMinutes as number) ?? '-'
    },
    { key: 'isOverdue', title: '是否超时', render: (row: Record<string, unknown>) =>
      (row.isOverdue as boolean) ? (
        <span className="badge badge-danger">超时</span>
      ) : (
        <span className="badge badge-success">正常</span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>SLA 统计</h2>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="平均处理时间"
          value={stats ? `${stats.avgHandlingMinutes} 分钟` : '-'}
          icon={<Clock className="w-5 h-5" />}
          color="text-[var(--color-primary)]"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="SLA达标率"
          value={stats ? `${stats.complianceRate}%` : '-'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-[var(--color-success)]"
          bgColor="bg-green-50"
        />
        <StatCard
          label="超时工单数"
          value={stats?.overdueCount ?? '-'}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-[var(--color-danger)]"
          bgColor="bg-red-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">开始日期</label>
          <input type="date" className="input-field w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">结束日期</label>
          <input type="date" className="input-field w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={handleFilter} className="btn-primary text-sm">筛选</button>
      </div>

      <DataTable
        columns={columns}
        data={details as unknown as Record<string, unknown>[]}
        total={total}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
