import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Eye } from 'lucide-react';
import { useCoachStore } from '@/stores/coachStore';
import StatusBadge from '@/components/StatusBadge';
import type { Coach, CoachStatus } from '../../shared/types';

export default function Coaches() {
  const navigate = useNavigate();
  const { coaches, loading, fetchCoaches, createCoach, updateCoach } = useCoachStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoach, setEditCoach] = useState<Coach | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; email: string; specialties: string; certifications: string; bio: string; status: CoachStatus }>({ name: '', phone: '', email: '', specialties: '', certifications: '', bio: '', status: 'active' });

  useEffect(() => { fetchCoaches(); }, [fetchCoaches]);

  const filtered = coaches.filter((c) => c.name.includes(search) || c.phone.includes(search));

  const openCreate = () => {
    setEditCoach(null);
    setForm({ name: '', phone: '', email: '', specialties: '', certifications: '', bio: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (c: Coach) => {
    setEditCoach(c);
    setForm({ name: c.name, phone: c.phone, email: c.email || '', specialties: c.specialties || '', certifications: c.certifications || '', bio: c.bio || '', status: c.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCoach) {
      await updateCoach(editCoach.id, form);
    } else {
      await createCoach(form);
    }
    setShowModal(false);
    fetchCoaches();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索教练" className="input-field pl-10 w-64" />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />添加教练</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">手机号</th>
                <th className="px-4 py-3">专长</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{c.specialties || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/coaches/${c.id}`)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 text-accent hover:bg-orange-50 rounded"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">暂无数据</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editCoach ? '编辑教练' : '添加教练'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="姓名" className="input-field" required />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="手机号" className="input-field" required />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="邮箱" type="email" className="input-field" />
              <input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="专长(逗号分隔)" className="input-field" />
              <input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} placeholder="认证(逗号分隔)" className="input-field" />
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="简介" className="input-field" rows={2} />
              {editCoach && (
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CoachStatus })} className="input-field">
                  <option value="active">在职</option><option value="inactive">停职</option>
                </select>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editCoach ? '保存' : '创建'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
