import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import {
  formatMoney, formatDate, SettlementStatusText, UserRole, userRoleText,
} from '../utils/constants';

export default function Settlements() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', settlementPeriod: '', startDate: '', endDate: '' });
  const [summary, setSummary] = useState<any>({});
  const [showMonthly, setShowMonthly] = useState(false);
  const [monthlyForm, setMonthlyForm] = useState({ photographerId: '', period: '' });
  const [photographers, setPhotographers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    const [res, sum]: any = await Promise.all([
      api.get('/settlements', { params: { ...filter, page, pageSize: 10 } }),
      api.get('/settlements/summary', { params: filter }),
    ]);
    setList(res.list || []);
    setTotal(res.total || 0);
    setSummary(sum);
    if (user?.role === UserRole.ADMIN) {
      const ps: any = await api.get('/users/photographers');
      setPhotographers(ps);
    }
  };

  const handleConfirm = async (id: string) => {
    try { await api.put(`/settlements/${id}/confirm`, {}); loadData(); }
    catch (e: any) { alert(e.message); }
  };

  const handlePay = async (id: string) => {
    const proofUrl = prompt('请输入付款凭证URL:') || '';
    if (!proofUrl) return;
    const info = prompt('银行账户信息（选填）:') || '';
    try { await api.put(`/settlements/${id}/pay`, { paymentProofUrl: proofUrl, bankAccountInfo: info }); loadData(); }
    catch (e: any) { alert(e.message); }
  };

  const handleCancel = async (id: string) => {
    const remark = prompt('取消原因:') || '';
    if (!confirm('确认取消该结算？')) return;
    try { await api.put(`/settlements/${id}/cancel`, { remark }); loadData(); }
    catch (e: any) { alert(e.message); }
  };

  const handleCreateMonthly = async () => {
    if (!monthlyForm.photographerId) { alert('请选择摄影师'); return; }
    if (!monthlyForm.period) { alert('请选择月份'); return; }
    try {
      await api.post('/settlements/monthly', monthlyForm);
      setShowMonthly(false);
      setMonthlyForm({ photographerId: '', period: '' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="累计结算单" value={summary.totalCount || 0} icon="📄" color="text-blue-600" />
        <StatCard label="订单总金额" value={`¥${formatMoney(summary.totalOrderAmount)}`} icon="📦" color="text-slate-600" />
        <StatCard label="累计毛收入" value={`¥${formatMoney(summary.totalGrossAmount)}`} icon="💰" color="text-amber-600" />
        <StatCard label="已结算净额" value={`¥${formatMoney(summary.totalNetAmount)}`} icon="✅" color="text-emerald-600" />
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm outline-none">
            <option value="">全部状态</option>
            {Object.entries(SettlementStatusText).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={filter.settlementPeriod} onChange={(e) => setFilter({ ...filter, settlementPeriod: e.target.value })}
            type="month" className="px-3 py-2 border rounded-lg text-sm outline-none" />
          <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm outline-none" />
          <span className="text-slate-400">至</span>
          <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm outline-none" />
          <button onClick={() => setFilter({ status: '', settlementPeriod: '', startDate: '', endDate: '' })}
            className="px-3 py-2 text-sm text-slate-500 hover:text-primary-600">重置</button>
        </div>
        {user?.role === UserRole.ADMIN && (
          <button onClick={() => setShowMonthly(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            + 生成月度结算
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">结算单号</th>
                <th className="px-5 py-3 text-left font-medium">摄影师</th>
                <th className="px-5 py-3 text-left font-medium">周期</th>
                <th className="px-5 py-3 text-right font-medium">订单金额</th>
                <th className="px-5 py-3 text-right font-medium">净收入</th>
                <th className="px-5 py-3 text-center font-medium">状态</th>
                <th className="px-5 py-3 text-left font-medium">创建/付款时间</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8} className="text-center py-16 text-slate-400">暂无结算记录</td></tr>}
              {list.map((s) => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-xs">{s.settlementNo}</td>
                  <td className="px-5 py-4">
                    {s.photographer ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">
                          {s.photographer.name?.charAt(0)}
                        </div>
                        <span>{s.photographer.name}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4">{s.settlementPeriod} ({s.orderCount}单)</td>
                  <td className="px-5 py-4 text-right">¥{formatMoney(s.orderAmount)}</td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-600">¥{formatMoney(s.netAmount)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${statusColor[s.status]}`}>
                      {SettlementStatusText[s.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                    <div>创建: {formatDate(s.createdAt, 'MM-DD')}</div>
                    {s.paidAt && <div className="text-green-600">付款: {formatDate(s.paidAt, 'MM-DD')}</div>}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                    {s.status === 'pending' && user?.role === UserRole.ADMIN && (
                      <button onClick={() => handleConfirm(s.id)}
                        className="text-blue-600 hover:underline text-xs">确认</button>
                    )}
                    {['confirmed', 'processing'].includes(s.status) && user?.role === UserRole.ADMIN && (
                      <button onClick={() => handlePay(s.id)}
                        className="text-green-600 hover:underline text-xs">付款</button>
                    )}
                    {!['paid', 'cancelled'].includes(s.status) && user?.role === UserRole.ADMIN && (
                      <button onClick={() => handleCancel(s.id)}
                        className="text-red-500 hover:underline text-xs">取消</button>
                    )}
                    {s.paymentProofUrl && (
                      <a href={s.paymentProofUrl} target="_blank" className="text-slate-500 hover:underline text-xs">凭证</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 10 && (
          <div className="px-5 py-4 border-t flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">上一页</button>
            <span className="text-sm text-slate-500">第 {page} 页 / 共 {Math.ceil(total / 10)} 页</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 10 >= total}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">下一页</button>
          </div>
        )}
      </div>

      {showMonthly && (
        <Modal title="生成月度结算" onClose={() => setShowMonthly(false)} onConfirm={handleCreateMonthly} confirmText="生成">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">选择摄影师 *</label>
              <select value={monthlyForm.photographerId}
                onChange={(e) => setMonthlyForm({ ...monthlyForm, photographerId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="">请选择</option>
                {photographers.map((p) => <option key={p.id} value={p.id}>{p.name} (分成{(p.settlementRatio * 100).toFixed(0)}%)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">结算月份 *</label>
              <input type="month" value={monthlyForm.period}
                onChange={(e) => setMonthlyForm({ ...monthlyForm, period: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" />
            </div>
            <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
              💡 将自动统计该摄影师该月份所有已完成订单，生成结算单
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500 mb-1">{label}</div>
          <div className={`text-xl font-bold ${color}`}>{value}</div>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, onConfirm, confirmText = '确认' }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 border rounded-lg hover:bg-slate-50">取消</button>
          <button onClick={onConfirm} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
