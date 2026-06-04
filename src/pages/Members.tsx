import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { useMemberStore } from '@/stores/memberStore';
import StatusBadge from '@/components/StatusBadge';
import type { Member } from '../../shared/types';

const statusTabs = ['', 'active', 'frozen', 'expired'];
const statusLabels = ['全部', '正常', '冻结', '已过期'];
const PAGE_SIZE = 10;

export default function Members() {
  const navigate = useNavigate();
  const { members, loading, fetchMembers, createMember, updateMember, deleteMember } = useMemberStore();
  const [search, setSearch] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', gender: 'male', birthday: '', notes: '' });

  useEffect(() => {
    fetchMembers(statusTabs[statusIdx] || undefined);
  }, [statusIdx, fetchMembers]);

  const filtered = members.filter((m) =>
    m.name.includes(search) || m.phone.includes(search)
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openCreate = () => {
    setEditMember(null);
    setForm({ name: '', phone: '', email: '', gender: 'male', birthday: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (m: Member) => {
    setEditMember(m);
    setForm({ name: m.name, phone: m.phone, email: m.email || '', gender: m.gender || 'male', birthday: m.birthday || '', notes: m.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editMember) {
      await updateMember(editMember.id, form);
    } else {
      await createMember(form);
    }
    setShowModal(false);
    fetchMembers(statusTabs[statusIdx] || undefined);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确认删除该会员？')) {
      await deleteMember(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索姓名/手机号"
              className="input-field pl-10 w-64"
            />
          </div>
          <div className="flex gap-1">
            {statusLabels.map((label, idx) => (
              <button
                key={label}
                onClick={() => { setStatusIdx(idx); setPage(1); }}
                className={`px-3 py-1.5 text-sm rounded-btn transition-colors ${statusIdx === idx ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 添加会员
        </button>
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
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">注册时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{m.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/members/${m.id}`)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(m)} className="p-1.5 text-accent hover:bg-orange-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 text-danger hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-secondary text-sm disabled:opacity-50">上一页</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-secondary text-sm disabled:opacity-50">下一页</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editMember ? '编辑会员' : '添加会员'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="姓名" className="input-field" required />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="手机号" className="input-field" required />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="邮箱" type="email" className="input-field" />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
              <input value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} placeholder="生日" type="date" className="input-field" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="备注" className="input-field" rows={2} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editMember ? '保存' : '创建'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
