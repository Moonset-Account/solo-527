import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type AuditLog } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Clock, User, Search, Filter } from 'lucide-react';

export const Route = createFileRoute('/history')({
  component: HistoryPage,
});

function HistoryPage() {
  const [entityType, setEntityType] = useState('');
  const [operator, setOperator] = useState('');
  const [searchOperator, setSearchOperator] = useState('');

  const { data: logs } = useQuery({
    queryKey: ['history', entityType, operator],
    queryFn: () =>
      api.history.list({
        ...(entityType ? { entityType } : {}),
        ...(operator ? { operator } : {}),
      }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">操作历史</h2>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value="material">素材</option>
            <option value="script">脚本</option>
            <option value="schedule">排期</option>
            <option value="exception">异常</option>
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="按操作人搜索..."
            value={searchOperator}
            onChange={(e) => setSearchOperator(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setOperator(searchOperator)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="divide-y divide-slate-100">
          {logs?.data.map((log) => (
            <HistoryItem key={log.id} log={log} />
          ))}
          {logs?.data.length === 0 && (
            <div className="text-center py-12 text-slate-400">暂无操作历史</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ log }: { log: AuditLog }) {
  const actionLabels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    close: '关闭',
  };

  const entityLabels: Record<string, string> = {
    material: '素材',
    script: '脚本',
    schedule: '排期',
    exception: '异常',
  };

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    close: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <User size={14} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-slate-900">{log.operator}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${actionColors[log.action] || 'bg-slate-100 text-slate-700'}`}>
            {actionLabels[log.action] || log.action}
          </span>
          <span className="text-xs text-slate-400">了</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {entityLabels[log.entityType] || log.entityType}
          </span>
        </div>
        {log.details && Object.keys(log.details).length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            {Object.entries(log.details)
              .filter(([k]) => k !== 'tagIds')
              .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
              .join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
        <Clock size={12} />
        {formatDate(log.createdAt)}
      </div>
    </div>
  );
}
