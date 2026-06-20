import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getReconciliations } from '@/api/reconciliation';
import type { Reconciliation } from '@/types';

const statusConfig: Record<Reconciliation['status'], { label: string; className: string }> = {
  pending: { label: '待对比', className: 'bg-gray-100 text-gray-600' },
  compared: { label: '已对比', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已驳回', className: 'bg-rose-100 text-rose-700' },
};

export default function ReconciliationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (statusFilter) params.status = statusFilter;
    getReconciliations(params)
      .then((res) => setData(res.data.results))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleFilterChange = (value: string) => {
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">对账单管理</h1>
        <Link
          to="/reconciliation/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#1e293b' }}
        >
          <Plus className="w-4 h-4" />
          上传对账单
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">全部状态</option>
          <option value="pending">待对比</option>
          <option value="compared">已对比</option>
          <option value="confirmed">已确认</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200" style={{ backgroundColor: '#1e293b' }}>
              <th className="text-left px-4 py-3 text-slate-300 font-medium">项目名称</th>
              <th className="text-left px-4 py-3 text-slate-300 font-medium">客户名称</th>
              <th className="text-left px-4 py-3 text-slate-300 font-medium">上传时间</th>
              <th className="text-right px-4 py-3 text-slate-300 font-medium">金额</th>
              <th className="text-right px-4 py-3 text-slate-300 font-medium">差异金额</th>
              <th className="text-center px-4 py-3 text-slate-300 font-medium">状态</th>
              <th className="text-center px-4 py-3 text-slate-300 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((item) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.project_name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.client_name}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(item.uploaded_at).toLocaleString('zh-CN')}</td>
                      <td className="px-4 py-3 text-right text-slate-700">¥{item.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium">¥{item.difference_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/reconciliation/${item.id}`}
                          className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
                        >
                          查看差异
                        </Link>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && data.length === 0 && (
          <div className="text-center py-12 text-gray-400">暂无对账单数据</div>
        )}
      </div>
    </div>
  );
}
