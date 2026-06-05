'use client';

import React, { useState, useEffect } from 'react';
import { ScrollText, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IAuditLog, AuditModule } from '@/types';

const moduleColors: Record<AuditModule, string> = {
  team: 'bg-blue-100 text-blue-800',
  schedule: 'bg-green-100 text-green-800',
  referee: 'bg-purple-100 text-purple-800',
  score: 'bg-yellow-100 text-yellow-800',
  appeal: 'bg-red-100 text-red-800',
  venue: 'bg-orange-100 text-orange-800',
  user: 'bg-gray-100 text-gray-800',
};

const moduleLabels: Record<string, string> = {
  team: '球队',
  schedule: '赛程',
  referee: '裁判',
  score: '比分',
  appeal: '申诉',
  venue: '场地',
  user: '用户',
};

export default function AdminAuditPage() {
  const { authHeaders } = useAuthStore();
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (moduleFilter) params.set('module', moduleFilter);
      if (actionFilter) params.set('action', actionFilter);
      if (operatorFilter) params.set('operatorId', operatorFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/audit?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setTotal(data.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, authHeaders]);

  const totalPages = Math.ceil(total / 20);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <Select
                label="模块"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                options={[
                  { value: '', label: '全部' },
                  { value: 'team', label: '球队' },
                  { value: 'schedule', label: '赛程' },
                  { value: 'referee', label: '裁判' },
                  { value: 'score', label: '比分' },
                  { value: 'appeal', label: '申诉' },
                  { value: 'venue', label: '场地' },
                  { value: 'user', label: '用户' },
                ]}
              />
            </div>
            <div className="w-36">
              <Input label="操作" placeholder="筛选操作..." value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
            </div>
            <div className="w-36">
              <Input label="操作人ID" placeholder="操作人..." value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} />
            </div>
            <div className="w-36">
              <Input label="开始日期" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="w-36">
              <Input label="结束日期" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button onClick={() => { setPage(1); fetchLogs(); }} size="md">
              <Filter size={16} className="mr-1" /> 筛选
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : logs.length === 0 ? (
          <EmptyState title="暂无审计日志" />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ScrollText size={16} className="text-gray-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${moduleColors[log.module] || 'bg-gray-100 text-gray-800'}`}>
                      {moduleLabels[log.module] || log.module}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{log.action}</span>
                  </div>
                  {log.detail && (
                    <p className="text-xs text-gray-500 truncate">
                      {JSON.stringify(log.detail).slice(0, 100)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    操作人: {log.operatorId} · {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500">共 {total} 条</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
                  <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
