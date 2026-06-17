import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  FileDown,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  PageHeader,
  TagBadge,
  DataTable,
  Pagination,
  EmptyState,
} from '../../components/ui';
import { formatDateTime, buildQuery, dayjs } from '../../lib/utils';
import { endpoints } from '../../lib/api';
import { toast } from '../../store/app';

const actionColors: Record<string, string> = {
  create: 'bg-primary-100 text-primary-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-danger-100 text-danger-700',
  approve: 'bg-emerald-100 text-emerald-700',
  acknowledge: 'bg-warning-100 text-warning-700',
  resolve: 'bg-primary-100 text-primary-700',
  ignore: 'bg-slate-100 text-slate-600',
  assign: 'bg-purple-100 text-purple-700',
};

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '修改',
  delete: '删除',
  approve: '审批',
  acknowledge: '确认',
  resolve: '解决',
  ignore: '忽略',
  assign: '指派',
};

const entityLabels: Record<string, string> = {
  zone: '分区',
  meter: '表计',
  device: '设备',
  alert: '告警',
  subsidy: '补贴记录',
  target: '节能目标',
  offline: '离线记录',
  user: '用户',
};

export const Route = createLazyFileRoute('/config/audit')({
  component: AuditLogPage,
});

function AuditLogPage() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const [userId, setUserId] = useState(search.userId || '');
  const [entityType, setEntityType] = useState(search.entityType || '');
  const [action, setAction] = useState(search.action || '');
  const [from, setFrom] = useState(search.from || '');
  const [to, setTo] = useState(search.to || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 20));
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    const params: any = { page, pageSize };
    if (userId) params.userId = userId;
    if (entityType) params.entityType = entityType;
    if (action) params.action = action;
    if (from) params.from = from;
    if (to) params.to = to;
    navigate({ to: '/config/audit', search: params, replace: true });
    endpoints.audit
      .list(params)
      .then((r) => setData(r))
      .catch((e) => toast('error', e.message));
  };

  useEffect(() => {
    endpoints.users().then(setUsers);
  }, []);

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const handleExport = () => {
    const rows = data?.data || [];
    const header = [
      ['操作人', '操作类型', '对象类型', '对象ID', 'IP地址', '操作时间', '旧值', '新值'],
    ];
    const body = rows.map((r: any) => [
      r.userName,
      actionLabels[r.action] || r.action,
      entityLabels[r.entityType] || r.entityType,
      r.entityId || '',
      r.ip || '',
      formatDateTime(r.createdAt),
      r.oldValue ? JSON.stringify(r.oldValue) : '',
      r.newValue ? JSON.stringify(r.newValue) : '',
    ]);
    const csv =
      '\ufeff' + [...header, ...body].map((row: any[]) => row.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('success', '导出成功');
  };

  return (
    <div>
      <PageHeader
        title="操作日志（审计）"
        description="追踪系统所有关键操作，记录操作人、操作内容与时间，确保每笔修改可追溯"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
              <Filter size={15} /> 筛选
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <FileDown size={15} /> 导出CSV
            </button>
          </>
        }
      >
        {showFilter && (
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="label">操作人</label>
                <select
                  className="select"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">全部</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">对象类型</label>
                <select
                  className="select"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                >
                  <option value="">全部</option>
                  {Object.entries(entityLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">操作类型</label>
                <select
                  className="select"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  <option value="">全部</option>
                  {Object.entries(actionLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">开始日期</label>
                <input
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="label">结束日期</label>
                  <input
                    type="date"
                    className="input"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setPage(1);
                    load();
                  }}
                >
                  <Search size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="btn-secondary"
                onClick={() => {
                  setUserId('');
                  setEntityType('');
                  setAction('');
                  setFrom('');
                  setTo('');
                  setPage(1);
                  setTimeout(load, 0);
                }}
              >
                重置筛选
              </button>
            </div>
          </div>
        )}
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ScrollText size={15} />
            <span>
              共 <b className="text-slate-800">{data?.total || 0}</b> 条操作记录
            </span>
          </div>
          <div className="text-xs text-slate-500">
            点击行可展开查看修改前后的详细数据对比
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {data?.data?.length === 0 ? (
            <EmptyState title="暂无操作记录" desc="尝试调整筛选条件或稍后再查" />
          ) : (
            (data?.data || []).map((log: any) => {
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id}>
                  <div
                    className="flex cursor-pointer items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div className="shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {log.userName?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">{log.userName}</span>
                        <TagBadge className={actionColors[log.action] || 'bg-slate-100 text-slate-700'}>
                          {actionLabels[log.action] || log.action}
                        </TagBadge>
                        <TagBadge className="bg-slate-100 text-slate-700">
                          {entityLabels[log.entityType] || log.entityType}
                        </TagBadge>
                        {log.entityId && (
                          <span className="font-mono text-xs text-slate-500">
                            ID: {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatDateTime(log.createdAt)}
                        </span>
                        {log.ip && (
                          <span className="font-mono">IP: {log.ip}</span>
                        )}
                        {(log.oldValue || log.newValue) && (
                          <span className="text-primary-700 font-medium flex items-center gap-1">
                            点击查看修改详情 →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (log.oldValue || log.newValue) && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {log.oldValue && (
                          <div className="rounded-lg border border-danger-200 bg-danger-50/50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-danger-700">
                              <ChevronUp size={12} /> 修改前数据
                            </div>
                            <pre className="overflow-auto text-[11px] leading-relaxed text-danger-800">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary-700">
                              <ChevronDown size={12} /> 修改后数据
                            </div>
                            <pre className="overflow-auto text-[11px] leading-relaxed text-primary-800">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
        />
      </div>
    </div>
  );
}
