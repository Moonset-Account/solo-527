import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { bodyTestApi, memberApi } from '@/utils/api';
import type { BodyTest, Member } from '../../shared/types';

export default function BodyTests() {
  const [tests, setTests] = useState<BodyTest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ member_id: 0, coach_id: 0, height: 0, weight: 0, body_fat: 0, muscle_mass: 0, waist: 0, chest: 0, hips: 0, notes: '', test_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    memberApi.list().then(setMembers);
  }, []);

  useEffect(() => {
    if (selectedMember) {
      setLoading(true);
      bodyTestApi.getMemberBodyTests(selectedMember).then(setTests).catch(() => setTests([])).finally(() => setLoading(false));
    }
  }, [selectedMember]);

  const filteredMembers = members.filter((m) => m.name.includes(search) || m.phone.includes(search));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await bodyTestApi.create({ ...form, member_id: selectedMember || form.member_id });
    setShowCreate(false);
    if (selectedMember) {
      bodyTestApi.getMemberBodyTests(selectedMember).then(setTests);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索会员" className="input-field pl-10 w-64" />
          </div>
          <select value={selectedMember} onChange={(e) => setSelectedMember(Number(e.target.value))} className="input-field w-auto">
            <option value={0}>选择会员查看</option>
            {filteredMembers.map((m) => <option key={m.id} value={m.id}>{m.name} - {m.phone}</option>)}
          </select>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />添加体测</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
      ) : !selectedMember ? (
        <div className="card text-center text-gray-400 py-12">请选择一个会员查看体测记录</div>
      ) : tests.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">暂无体测记录</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2">身高(cm)</th>
                <th className="px-3 py-2">体重(kg)</th>
                <th className="px-3 py-2">体脂率(%)</th>
                <th className="px-3 py-2">肌肉量(kg)</th>
                <th className="px-3 py-2">腰围(cm)</th>
                <th className="px-3 py-2">胸围(cm)</th>
                <th className="px-3 py-2">臀围(cm)</th>
                <th className="px-3 py-2">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map((bt) => (
                <tr key={bt.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">{bt.test_date?.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-sm">{bt.height || '-'}</td>
                  <td className="px-3 py-2 text-sm">{bt.weight || '-'}</td>
                  <td className="px-3 py-2 text-sm">{bt.body_fat || '-'}</td>
                  <td className="px-3 py-2 text-sm">{bt.muscle_mass || '-'}</td>
                  <td className="px-3 py-2 text-sm">{bt.waist || '-'}</td>
                  <td className="px-3 py-2 text-sm">{bt.chest || '-'}</td>
                  <td className="px-3 py-2 text-sm">{bt.hips || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-400 max-w-32 truncate">{bt.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">添加体测记录</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {!selectedMember && (
                <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: Number(e.target.value) })} className="input-field" required>
                  <option value={0}>选择会员</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
              <input type="number" value={form.coach_id || ''} onChange={(e) => setForm({ ...form, coach_id: Number(e.target.value) })} placeholder="教练ID" className="input-field" required />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" step="0.1" value={form.height || ''} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} placeholder="身高(cm)" className="input-field" />
                <input type="number" step="0.1" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} placeholder="体重(kg)" className="input-field" />
                <input type="number" step="0.1" value={form.body_fat || ''} onChange={(e) => setForm({ ...form, body_fat: Number(e.target.value) })} placeholder="体脂率(%)" className="input-field" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" step="0.1" value={form.muscle_mass || ''} onChange={(e) => setForm({ ...form, muscle_mass: Number(e.target.value) })} placeholder="肌肉量(kg)" className="input-field" />
                <input type="number" step="0.1" value={form.waist || ''} onChange={(e) => setForm({ ...form, waist: Number(e.target.value) })} placeholder="腰围(cm)" className="input-field" />
                <input type="number" step="0.1" value={form.chest || ''} onChange={(e) => setForm({ ...form, chest: Number(e.target.value) })} placeholder="胸围(cm)" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.1" value={form.hips || ''} onChange={(e) => setForm({ ...form, hips: Number(e.target.value) })} placeholder="臀围(cm)" className="input-field" />
                <input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} className="input-field" required />
              </div>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="备注" className="input-field" rows={2} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">保存</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
