import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useTicketStore } from '@/store/ticket.store';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import DataTable from '@/components/DataTable';

export default function TicketListPage() {
  const { tickets, total, loading, fetchTickets } = useTicketStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchTickets({ page, limit: 10, type: typeFilter || undefined, status: statusFilter || undefined, keyword: keyword || undefined });
  }, [page, typeFilter, statusFilter, fetchTickets]);

  const handleSearch = () => {
    setPage(1);
    fetchTickets({ page: 1, limit: 10, type: typeFilter || undefined, status: statusFilter || undefined, keyword: keyword || undefined });
  };

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const inProgressCount = tickets.filter((t) => ['assigned', 'in-progress'].includes(t.status)).length;
  const doneCount = tickets.filter((t) => ['approved', 'closed'].includes(t.status)).length;

  const columns = [
    { key: 'id', title: 'ID', render: (row: Record<string, unknown>) => (
      <span className="text-[var(--color-primary)] cursor-pointer hover:underline" onClick={() => navigate(`/tickets/${row.id}`)}>
        #{row.id as number}
      </span>
    )},
    { key: 'title', title: '标题', render: (row: Record<string, unknown>) => (
      <span className="cursor-pointer hover:text-[var(--color-primary)]" onClick={() => navigate(`/tickets/${row.id}`)}>
        {row.title as string}
      </span>
    )},
    { key: 'type', title: '类型', render: (row: Record<string, unknown>) => row.type === 'request' ? '申请' : '故障' },
    { key: 'priority', title: '优先级', render: (row: Record<string, unknown>) => <PriorityBadge priority={row.priority as string} /> },
    { key: 'status', title: '状态', render: (row: Record<string, unknown>) => <StatusBadge status={row.status as string} /> },
    { key: 'creatorName', title: '创建人' },
    { key: 'assigneeName', title: '处理人', render: (row: Record<string, unknown>) => (row.assigneeName as string) || '-' },
    { key: 'createdAt', title: '创建时间', render: (row: Record<string, unknown>) => new Date(row.createdAt as string).toLocaleString('zh-CN') },
    { key: 'actions', title: '操作', render: (row: Record<string, unknown>) => (
      <button
        className="text-sm text-[var(--color-primary)] hover:underline"
        onClick={() => navigate(`/tickets/${row.id}`)}
      >
        查看
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>工单管理</h2>
        <button onClick={() => navigate('/tickets/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4 flex items-center gap-4 flex-wrap">
        <select className="select-field w-32" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">全部类型</option>
          <option value="request">申请</option>
          <option value="incident">故障</option>
        </select>
        <select className="select-field w-32" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="assigned">已分配</option>
          <option value="in-progress">处理中</option>
          <option value="approved">已审批</option>
          <option value="rejected">已驳回</option>
          <option value="closed">已关闭</option>
        </select>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            className="input-field"
            placeholder="搜索工单标题..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="btn-primary px-3 py-2">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">总数</p>
          <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">待处理</p>
          <p className="text-xl font-bold mt-1 text-[var(--color-warning)]" style={{ fontFamily: 'var(--font-heading)' }}>{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">进行中</p>
          <p className="text-xl font-bold mt-1 text-[var(--color-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">已完成</p>
          <p className="text-xl font-bold mt-1 text-[var(--color-success)]" style={{ fontFamily: 'var(--font-heading)' }}>{doneCount}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tickets as unknown as Record<string, unknown>[]}
        total={total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
