import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Search } from 'lucide-react';
import { useAuditStore } from '@/store/audit.store';

const actionIcons: Record<string, string> = {
  CREATE: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️',
  LOGIN: '🔑',
  ASSIGN: '👤',
  APPROVE: '✅',
  REJECT: '❌',
};

export default function AuditLogPage() {
  const { logs, total, loading, fetchAuditLogs } = useAuditStore();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [action, setAction] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAuditLogs({
      page,
      limit: 20,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      action: action || undefined,
      failedOnly,
    });
  }, [page, failedOnly, fetchAuditLogs]);

  const handleFilter = () => {
    setPage(1);
    fetchAuditLogs({
      page: 1,
      limit: 20,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      action: action || undefined,
      failedOnly,
    });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>审计日志</h2>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">开始日期</label>
          <input type="date" className="input-field w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-text-secondary)]">结束日期</label>
          <input type="date" className="input-field w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <select className="select-field w-32" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">全部操作</option>
          <option value="CREATE">创建</option>
          <option value="UPDATE">更新</option>
          <option value="DELETE">删除</option>
          <option value="LOGIN">登录</option>
          <option value="ASSIGN">分配</option>
          <option value="APPROVE">审批</option>
          <option value="REJECT">驳回</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} className="rounded" />
          仅显示失败
        </label>
        <button onClick={handleFilter} className="btn-primary px-3 py-2">
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">暂无审计日志</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {logs.map((log) => (
              <div key={log.id}>
                <div
                  className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !log.isSuccess ? 'border-l-4 border-l-[var(--color-danger)]' : ''
                  }`}
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="shrink-0">
                    {expandedId === log.id ? (
                      <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0">
                    {actionIcons[log.action] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{log.operatorName}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">{log.action}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {log.targetType} #{log.targetId}
                      </span>
                      {!log.isSuccess && <span className="badge badge-danger">失败</span>}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{log.detail}</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                {expandedId === log.id && (log.beforeData || log.afterData) && (
                  <div className="px-5 pb-4 ml-12">
                    <div className="grid grid-cols-2 gap-4">
                      {log.beforeData && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">变更前</p>
                          <pre className="text-xs bg-red-50 p-3 rounded-lg overflow-x-auto max-h-40">
                            {JSON.stringify(log.beforeData, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.afterData && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">变更后</p>
                          <pre className="text-xs bg-green-50 p-3 rounded-lg overflow-x-auto max-h-40">
                            {JSON.stringify(log.afterData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-secondary)]">共 {total} 条</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm px-3 py-1">上一页</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="btn-secondary text-sm px-3 py-1">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
