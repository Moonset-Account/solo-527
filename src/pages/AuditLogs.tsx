import { useEffect, useState } from 'react';
import { Search, FileText, ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, LogIn } from 'lucide-react';
import { auditLogsApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import type { AuditLog } from '@/types';

const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  create: { label: '创建', color: 'bg-green-100 text-green-700', icon: <Plus size={12} /> },
  update: { label: '更新', color: 'bg-blue-100 text-blue-700', icon: <RefreshCw size={12} /> },
  delete: { label: '删除', color: 'bg-red-100 text-red-700', icon: <Trash2 size={12} /> },
  login: { label: '登录', color: 'bg-purple-100 text-purple-700', icon: <LogIn size={12} /> },
};

const PAGE_SIZE = 10;

function formatValue(val: any) {
  if (!val) return '-';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const params: Record<string, string> = {};
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      const data = await auditLogsApi.list(params);
      setLogs(data);
      setPage(1);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setLoading(true);
    loadLogs();
  };

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 page-enter">
      <h1 className="page-title">审计日志</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">操作类型</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="select-field"
            >
              <option value="">全部</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="login">登录</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">实体类型</label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="select-field"
            >
              <option value="">全部</option>
              <option value="booking">报名</option>
              <option value="session">场次</option>
              <option value="course">课程</option>
              <option value="user">用户</option>
              <option value="scheduling">排班</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">用户ID</label>
            <input
              type="number"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="input-field"
              placeholder="输入用户ID"
            />
          </div>
          <button onClick={applyFilters} className="btn-primary flex items-center justify-center gap-2">
            <Search size={14} />
            筛选
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState message="暂无审计日志" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>用户ID</th>
                <th>操作</th>
                <th>实体</th>
                <th>变更详情</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const actionCfg = actionConfig[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700', icon: <FileText size={12} /> };
                return (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-slate-600 text-xs">
                      {new Date(log.created_at).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="text-slate-700 font-medium">#{log.user_id}</td>
                    <td>
                      <span className={`status-badge ${actionCfg.color} gap-1`}>
                        {actionCfg.icon}
                        {actionCfg.label}
                      </span>
                    </td>
                    <td className="text-slate-700">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {log.entity_type}#{log.entity_id}
                      </span>
                    </td>
                    <td className="max-w-[260px]">
                      {log.old_value || log.new_value ? (
                        <div className="flex flex-col gap-1">
                          {log.old_value && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-red-400 font-medium shrink-0">旧值</span>
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded line-through truncate">
                                {formatValue(log.old_value)}
                              </span>
                            </div>
                          )}
                          {log.new_value && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-green-500 font-medium shrink-0">新值</span>
                              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded truncate">
                                {formatValue(log.new_value)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="text-slate-400 text-xs font-mono">{log.ip_address}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <span className="text-xs text-slate-500">
                共 {logs.length} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary flex items-center gap-1 py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                  上一页
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary flex items-center gap-1 py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
