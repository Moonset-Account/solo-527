import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getReconciliation, getDifferences, confirmReconciliation, rejectReconciliation } from '@/api/reconciliation';
import type { Reconciliation, Difference } from '@/types';
import useAuthStore from '@/stores/auth';

const statusConfig: Record<Reconciliation['status'], { label: string; className: string }> = {
  pending: { label: '待对比', className: 'bg-gray-100 text-gray-600' },
  compared: { label: '已对比', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已驳回', className: 'bg-rose-100 text-rose-700' },
};

const itemTypeConfig: Record<Difference['item_type'], { label: string; className: string }> = {
  amount: { label: '金额差异', className: 'bg-amber-100 text-amber-700' },
  date: { label: '日期差异', className: 'bg-blue-100 text-blue-700' },
  missing: { label: '数据缺失', className: 'bg-rose-100 text-rose-700' },
};

export default function ReconciliationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [diffs, setDiffs] = useState<Difference[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getReconciliation(Number(id)), getDifferences(Number(id))])
      .then(([rRes, dRes]) => {
        setRecon(rRes.data);
        setDiffs(dRes.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const canOperate = recon?.status === 'compared' && (user?.role === 'admin' || user?.role === 'project_manager');

  const handleConfirm = async () => {
    if (!id || acting) return;
    setActing(true);
    try {
      const res = await confirmReconciliation(Number(id));
      setRecon(res.data);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!id || acting) return;
    setActing(true);
    try {
      const res = await rejectReconciliation(Number(id));
      setRecon(res.data);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recon) {
    return <div className="p-6 text-center text-gray-400">未找到对账单</div>;
  }

  const stCfg = statusConfig[recon.status];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">差异对比详情</h1>
        <button
          onClick={() => navigate('/reconciliation')}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          返回列表
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <p className="text-xs text-slate-400 mb-1">项目名称</p>
            <p className="text-sm font-medium text-slate-800">{recon.project_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">客户名称</p>
            <p className="text-sm font-medium text-slate-800">{recon.client_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">金额</p>
            <p className="text-sm font-medium text-slate-800">¥{recon.total_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">差异金额</p>
            <p className="text-sm font-medium text-rose-600">¥{recon.difference_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">状态</p>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${stCfg.className}`}>
              {stCfg.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">上传人</p>
            <p className="text-sm font-medium text-slate-800">{recon.uploaded_by}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">上传时间</p>
            <p className="text-sm font-medium text-slate-800">{new Date(recon.uploaded_at).toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-slate-800">差异对比</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-slate-600 font-medium w-28">差异类型</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">系统记录</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">上传数据</th>
                <th className="text-center px-4 py-3 text-slate-600 font-medium w-24">确认状态</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((d) => {
                const itCfg = itemTypeConfig[d.item_type];
                const hasDiff = d.item_type === 'missing' || d.system_value !== d.uploaded_value;
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-gray-100 ${hasDiff ? 'bg-amber-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${itCfg.className}`}>
                        {itCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{d.system_value}</td>
                    <td className="px-4 py-3 text-slate-700">{d.uploaded_value}</td>
                    <td className="px-4 py-3 text-center">
                      {d.is_confirmed === true && <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />}
                      {d.is_confirmed === false && <XCircle className="w-5 h-5 text-rose-500 mx-auto" />}
                      {d.is_confirmed === null && <span className="text-xs text-gray-400">待确认</span>}
                    </td>
                  </tr>
                );
              })}
              {diffs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">暂无差异记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canOperate && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={acting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            确认差异
          </button>
          <button
            onClick={handleReject}
            disabled={acting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            驳回
          </button>
        </div>
      )}
    </div>
  );
}
