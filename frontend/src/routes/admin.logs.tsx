import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { FileText, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLog, PaginatedResponse } from '@shared/types';
import { formatDate, getRoleText } from '@/utils';

export const Route = createFileRoute('/admin/logs')({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const { role } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchLogs();
  }, [page, action, startDate, endDate]);

  const fetchLogs = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', {
        page,
        pageSize,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      'product.create': '创建商品',
      'product.update': '更新商品',
      'product.status': '商品上下架',
      'order.redeem': '订单核销',
      'member.points.adjust': '积分调整',
      'reach.create': '创建触达任务',
      'reach.execute': '执行触达',
      'reach.retry': '重试触达',
      'admin.create': '创建管理员',
      'admin.update': '更新管理员',
      'level.create': '创建等级',
      'level.update': '更新等级',
      'level.delete': '删除等级',
    };
    return map[action] || action;
  };

  const getResourceText = (type?: string) => {
    const map: Record<string, string> = {
      'product': '商品',
      'order': '订单',
      'member': '会员',
      'reach_task': '触达任务',
      'admin_user': '管理员',
      'level': '会员等级',
    };
    return type ? (map[type] || type) : '-';
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">操作日志</h1>
          <p className="text-gray-500 mt-1">共 {total} 条记录</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              placeholder="搜索操作类型..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">操作时间</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">操作人</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">操作类型</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">资源类型</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">IP地址</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">暂无日志数据</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {(log as any).user?.username || '-'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(log as any).user?.role ? getRoleText((log as any).user.role) : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-brand-600 font-medium">
                        {getActionText(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {getResourceText(log.resourceType)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {log.details ? (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-brand-600">查看详情</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded-lg overflow-x-auto text-gray-600">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
