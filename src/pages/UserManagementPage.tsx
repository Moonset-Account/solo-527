import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';

interface UserRow {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: '', displayName: '', role: 'engineer', password: '' });

  const fetchUsers = async (p?: number) => {
    setLoading(true);
    try {
      const res = await api.get<{ items: UserRow[]; total: number }>('/users', { page: p || page, limit: 10 });
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const openCreate = () => {
    setEditId(null);
    setForm({ username: '', displayName: '', role: 'engineer', password: '' });
    setShowModal(true);
  };

  const openEdit = (user: UserRow) => {
    setEditId(user.id);
    setForm({ username: user.username, displayName: user.displayName, role: user.role, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (editId) {
      await api.put(`/users/${editId}`, form);
    } else {
      await api.post('/users', form);
    }
    setShowModal(false);
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定删除该用户吗？')) {
      await api.delete(`/users/${id}`);
      fetchUsers();
    }
  };

  const roleLabels: Record<string, string> = { admin: '管理员', manager: 'IT主管', engineer: '值班工程师' };

  const columns = [
    { key: 'username', title: '用户名' },
    { key: 'displayName', title: '显示名称' },
    { key: 'role', title: '角色', render: (row: Record<string, unknown>) => (
      <span className="badge badge-assigned">{roleLabels[row.role as string] || row.role}</span>
    )},
    { key: 'createdAt', title: '创建时间', render: (row: Record<string, unknown>) => new Date(row.createdAt as string).toLocaleString('zh-CN') },
    { key: 'actions', title: '操作', render: (row: Record<string, unknown>) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(row as unknown as UserRow)} className="text-[var(--color-primary)] text-sm">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(row.id as number)} className="text-[var(--color-danger)] text-sm">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>用户管理</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          添加用户
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users as unknown as Record<string, unknown>[]}
        total={total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={loading}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl card-shadow-md w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {editId ? '编辑用户' : '添加用户'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">用户名</label>
                <input className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">显示名称</label>
                <input className="input-field" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">角色</label>
                <select className="select-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">管理员</option>
                  <option value="manager">IT主管</option>
                  <option value="engineer">值班工程师</option>
                </select>
              </div>
              {!editId && (
                <div>
                  <label className="block text-sm font-medium mb-1">密码</label>
                  <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSubmit} className="btn-primary">确定</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
