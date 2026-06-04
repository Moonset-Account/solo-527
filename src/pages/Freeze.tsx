import { useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useFreezeStore } from '@/stores/freezeStore';
import { memberApi, packageApi } from '@/utils/api';
import StatusBadge from '@/components/StatusBadge';
import type { Member, MemberPackage } from '../../shared/types';

export default function Freeze() {
  const { freezes, loading, fetchFreezes, createFreeze, approveFreeze, rejectFreeze } = useFreezeStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberPkgs, setMemberPkgs] = useState<MemberPackage[]>([]);
  const [form, setForm] = useState({ member_id: 0, member_package_id: 0, start_date: '', end_date: '', reason: '' });

  useEffect(() => { fetchFreezes(); }, [fetchFreezes]);

  useEffect(() => {
    if (showCreate) {
      memberApi.list('active').then(setMembers);
    }
  }, [showCreate]);

  useEffect(() => {
    if (form.member_id) {
      packageApi.getMemberPackages(form.member_id).then(setMemberPkgs);
    }
  }, [form.member_id]);

  const pendingFreezes = freezes.filter((f) => f.status === 'pending');
  const filteredFreezes = statusFilter ? freezes.filter((f) => f.status === statusFilter) : freezes;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFreeze(form);
    setShowCreate(false);
    fetchFreezes();
  };

  const handleApprove = async (id: number) => {
    await approveFreeze(id);
    fetchFreezes();
  };

  const handleReject = async (id: number) => {
    await rejectFreeze(id);
    fetchFreezes();
  };

  return (
    <div className="space-y-6">
      {pendingFreezes.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">待审核冻结申请 ({pendingFreezes.length})</h3>
          <div className="space-y-2">
            {pendingFreezes.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-btn border border-amber-100">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">会员 #{f.member_id}</span>
                  <span className="text-sm text-gray-500 ml-3">套餐 #{f.member_package_id}</span>
                  <span className="text-sm text-gray-500 ml-3">{f.start_date?.slice(0, 10)} ~ {f.end_date?.slice(0, 10)}</span>
                  {f.reason && <span className="text-sm text-gray-400 ml-3">原因: {f.reason}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(f.id)} className="btn-success text-sm flex items-center gap-1"><Check className="w-4 h-4" />批准</button>
                  <button onClick={() => handleReject(f.id)} className="btn-danger text-sm flex items-center gap-1"><X className="w-4 h-4" />拒绝</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {['', 'pending', 'approved', 'rejected', 'completed'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${statusFilter === s ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === '' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已批准' : s === 'rejected' ? '已拒绝' : '已完成'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />创建冻结</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">会员ID</th>
                <th className="px-4 py-3">套餐ID</th>
                <th className="px-4 py-3">开始日期</th>
                <th className="px-4 py-3">结束日期</th>
                <th className="px-4 py-3">天数</th>
                <th className="px-4 py-3">原因</th>
                <th className="px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFreezes.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{f.member_id}</td>
                  <td className="px-4 py-3 text-sm">{f.member_package_id}</td>
                  <td className="px-4 py-3 text-sm">{f.start_date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-sm">{f.end_date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-sm">{f.extra_days}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{f.reason || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                </tr>
              ))}
              {filteredFreezes.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">暂无数据</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">创建冻结申请</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: Number(e.target.value) })} className="input-field" required>
                <option value={0}>选择会员</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name} - {m.phone}</option>)}
              </select>
              <select value={form.member_package_id} onChange={(e) => setForm({ ...form, member_package_id: Number(e.target.value) })} className="input-field" required>
                <option value={0}>选择会员套餐</option>
                {memberPkgs.filter((mp) => mp.status === 'active').map((mp) => <option key={mp.id} value={mp.id}>套餐 #{mp.id} (剩余{mp.remaining_sessions}次)</option>)}
              </select>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" required />
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" required />
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="冻结原因" className="input-field" rows={2} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">提交</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
