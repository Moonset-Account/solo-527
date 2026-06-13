import { useEffect, useState } from 'react';
import { Plus, Edit3, AlertTriangle, PieChart, Users, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store';
import type { QuotaConfig } from '@/types';

const buildings = Array.from({ length: 10 }, (_, i) => `${i + 1}号楼`);
const repairTypes = ['水电维修', '电器维修', '家具维修', '门窗维修', '网络维修', '其他'];
const periods = ['daily', 'weekly', 'monthly'];

function ProgressBar({ used, max }: { used: number; max: number }) {
  const rate = max > 0 ? (used / max) * 100 : 0;
  const color = rate > 90 ? 'bg-red-500' : rate > 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-600">{rate.toFixed(1)}%</span>
    </div>
  );
}

export default function QuotaManagement() {
  const { quotas, quotasLoading, fetchQuotas, createQuota, updateQuota } = useAppStore();
  const [editModal, setEditModal] = useState<QuotaConfig | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ building: '', repairType: '', maxQuota: 0, period: 'monthly' });
  const [editForm, setEditForm] = useState({ maxQuota: 0, period: '' });

  useEffect(() => { fetchQuotas(); }, [fetchQuotas]);

  const totalMax = quotas.reduce((s, q) => s + q.maxQuota, 0);
  const totalUsed = quotas.reduce((s, q) => s + q.currentUsed, 0);
  const available = totalMax - totalUsed;
  const rate = totalMax > 0 ? ((totalUsed / totalMax) * 100).toFixed(1) : '0.0';

  const openEdit = (q: QuotaConfig) => {
    setEditModal(q);
    setEditForm({ maxQuota: q.maxQuota, period: q.period });
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    await updateQuota(editModal.id, { maxQuota: editForm.maxQuota, period: editForm.period });
    setEditModal(null);
  };

  const handleCreate = async () => {
    await createQuota(form);
    setCreateModal(false);
    setForm({ building: '', repairType: '', maxQuota: 0, period: 'monthly' });
  };

  const overviewCards = [
    { label: '总名额', value: totalMax, icon: PieChart, color: 'bg-blue-500' },
    { label: '已使用', value: totalUsed, icon: Users, color: 'bg-orange-500' },
    { label: '可用名额', value: available, icon: BarChart3, color: 'bg-green-500' },
    { label: '使用率', value: `${rate}%`, icon: AlertTriangle, color: Number(rate) > 80 ? 'bg-red-500' : 'bg-slate-600' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">名额管理</h1>
        <button onClick={() => setCreateModal(true)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={16} /> 新建名额
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color} text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-xl font-bold text-slate-800">{c.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {quotasLoading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3">楼栋</th>
                <th className="px-4 py-3">报修类型</th>
                <th className="px-4 py-3">名额上限</th>
                <th className="px-4 py-3">已使用</th>
                <th className="px-4 py-3">使用率</th>
                <th className="px-4 py-3">周期</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {quotas.map((q) => {
                const usageRate = q.maxQuota > 0 ? (q.currentUsed / q.maxQuota) * 100 : 0;
                return (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{q.building}</td>
                    <td className="px-4 py-3 text-slate-700">{q.repairType}</td>
                    <td className="px-4 py-3 text-slate-700">{q.maxQuota}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700">{q.currentUsed}</span>
                      {usageRate > 80 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <AlertTriangle size={10} /> 警告
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><ProgressBar used={q.currentUsed} max={q.maxQuota} /></td>
                    <td className="px-4 py-3 text-slate-700">{q.period === 'daily' ? '每日' : q.period === 'weekly' ? '每周' : '每月'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(q)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <Edit3 size={14} /> 编辑
                      </button>
                    </td>
                  </tr>
                );
              })}
              {quotas.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">编辑名额</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">名额上限</label>
                <input type="number" value={editForm.maxQuota} onChange={(e) => setEditForm({ ...editForm, maxQuota: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">周期</label>
                <select value={editForm.period} onChange={(e) => setEditForm({ ...editForm, period: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {periods.map((p) => <option key={p} value={p}>{p === 'daily' ? '每日' : p === 'weekly' ? '每周' : '每月'}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={handleEditSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">新建名额</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">楼栋</label>
                <select value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">请选择</option>
                  {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">报修类型</label>
                <select value={form.repairType} onChange={(e) => setForm({ ...form, repairType: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">请选择</option>
                  {repairTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">名额上限</label>
                <input type="number" value={form.maxQuota || ''} onChange={(e) => setForm({ ...form, maxQuota: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">周期</label>
                <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {periods.map((p) => <option key={p} value={p}>{p === 'daily' ? '每日' : p === 'weekly' ? '每周' : '每月'}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreateModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={handleCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
