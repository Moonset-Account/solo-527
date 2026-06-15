import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import Pagination from '@/components/Pagination';

const moduleColors: Record<string, string> = {
  '排班管理': 'bg-primary/10 text-primary',
  '预约管理': 'bg-blue-50 text-blue-700',
  '数据导出': 'bg-amber-50 text-amber-700',
};

const defaultModuleColor = 'bg-zinc-100 text-zinc-600';

const PAGE_SIZE = 10;

export default function AuditLog() {
  const { auditLogs } = useStore();
  const [filterModule, setFilterModule] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const modules = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.module));
    return Array.from(set);
  }, [auditLogs]);

  const operators = useMemo(() => {
    const map = new Map<string, string>();
    auditLogs.forEach((l) => map.set(l.operatorId, l.operatorName));
    return Array.from(map.entries());
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filterModule && log.module !== filterModule) return false;
      if (filterOperator && log.operatorId !== filterOperator) return false;
      if (filterDateRange) {
        const [start, end] = filterDateRange.split('~');
        if (start && end) {
          const logDate = log.createdAt.split('T')[0];
          if (logDate < start || logDate > end) return false;
        }
      }
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [auditLogs, filterModule, filterOperator, filterDateRange]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900">操作留痕</h2>

      <div className="bg-white rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={filterModule}
            onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">全部模块</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterOperator}
            onChange={(e) => { setFilterOperator(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">全部操作者</option>
            {operators.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <input
            type="text"
            placeholder="日期范围: 2024-01-01~2024-01-31"
            value={filterDateRange}
            onChange={(e) => { setFilterDateRange(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">时间</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">操作者</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">模块</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">操作</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">目标ID</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">详情</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-600">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-700">{log.operatorName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${moduleColors[log.module] || defaultModuleColor}`}>
                    {log.module}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">{log.action}</td>
                <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{log.targetId}</td>
                <td className="px-4 py-3 text-zinc-600 max-w-xs truncate">{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedLogs.length === 0 && (
          <p className="text-center text-zinc-400 py-8 text-sm">暂无操作日志</p>
        )}
        <div className="px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={filteredLogs.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
