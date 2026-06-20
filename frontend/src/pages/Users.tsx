import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import { UserRole, userRoleText, formatDate } from '../utils/constants';

export default function Users() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ role: '', keyword: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ username: '', password: '', name: '', email: '', phone: '', role: UserRole.PHOTOGRAPHER, settlementRatio: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '', settlementRatio: '', password: '' });

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    const res: any = await api.get('/users', { params: { ...filter, page, pageSize: 20 } });
    setList(res.list || []);
    setTotal(res.total || 0);
  };

  const handleCreate = async () => {
    if (!createForm.username || !createForm.password || !createForm.name) {
      alert('请填写必填项');
      return;
    }
    const body: any = {
      username: createForm.username,
      password: createForm.password,
      name: createForm.name,
      role: createForm.role,
    };
    if (createForm.email) body.email = createForm.email;
    if (createForm.phone) body.phone = createForm.phone;
    if (createForm.role === UserRole.PHOTOGRAPHER && createForm.settlementRatio) {
      body.settlementRatio = parseFloat(createForm.settlementRatio) / 100;
    }
    try {
      await api.post('/users', body);
      setShowCreate(false);
      setCreateForm({ username: '', password: '', name: '', email: '', phone: '', role: UserRole.PHOTOGRAPHER, settlementRatio: '' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleEdit = async () => {
    if (!editForm.name) {
      alert('请填写姓名');
      return;
    }
    const body: any = { name: editForm.name, role: editForm.role };
    if (editForm.email) body.email = editForm.email;
    if (editForm.phone) body.phone = editForm.phone;
    if (editForm.role === UserRole.PHOTOGRAPHER && editForm.settlementRatio !== '') {
      body.settlementRatio = parseFloat(editForm.settlementRatio) / 100;
    }
    if (editForm.password) body.password = editForm.password;
    try {
      await api.put(`/users/${showEdit.id}`, body);
      setShowEdit(null);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggleStatus = async (u: any) => {
    const action = u.status === 'suspended' ? '激活' : '停用';
    if (!confirm(`确认${action}用户 ${u.name}？`)) return;
    try {
      await api.put(`/users/${u.id}`, { status: u.status === 'suspended' ? 'active' : 'suspended' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`确认删除用户 ${u.name}？此操作不可恢复。`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const openEdit = (u: any) => {
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || '',
      settlementRatio: u.settlementRatio != null ? (u.settlementRatio * 100).toFixed(0) : '',
      password: '',
    });
    setShowEdit(u);
  };

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
  };

  const statusText: Record<string, string> = {
    active: '正常',
    suspended: '已停用',
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-50 text-red-600',
    photographer: 'bg-blue-50 text-blue-600',
    blogger: 'bg-purple-50 text-purple-600',
    client: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={filter.role} onChange={(e) => { setFilter({ ...filter, role: e.target.value }); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm outline-none">
            <option value="">全部角色</option>
            {Object.entries(UserRole).map(([, v]) => <option key={v} value={v}>{userRoleText(v)}</option>)}
          </select>
          <input value={filter.keyword} onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            placeholder="搜索姓名/用户名" className="px-3 py-2 border rounded-lg text-sm outline-none w-48"
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadData(); } }} />
          <button onClick={() => { setPage(1); loadData(); }}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">搜索</button>
          <button onClick={() => setFilter({ role: '', keyword: '' })}
            className="px-3 py-2 text-sm text-slate-500 hover:text-primary-600">重置</button>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
          + 新建用户
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">用户</th>
                <th className="px-5 py-3 text-left font-medium">用户名</th>
                <th className="px-5 py-3 text-center font-medium">角色</th>
                <th className="px-5 py-3 text-left font-medium">邮箱</th>
                <th className="px-5 py-3 text-left font-medium">手机</th>
                <th className="px-5 py-3 text-center font-medium">分成比例</th>
                <th className="px-5 py-3 text-center font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8} className="text-center py-16 text-slate-400">暂无用户数据</td></tr>}
              {list.map((u) => (
                <tr key={u.id} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm flex items-center justify-center font-bold">
                        {u.name?.charAt(0)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{u.username}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${roleColors[u.role] || 'bg-slate-50 text-slate-600'}`}>
                      {userRoleText(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{u.email || '-'}</td>
                  <td className="px-5 py-4 text-slate-500">{u.phone || '-'}</td>
                  <td className="px-5 py-4 text-center">
                    {u.role === UserRole.PHOTOGRAPHER && u.settlementRatio != null
                      ? `${(u.settlementRatio * 100).toFixed(0)}%`
                      : '-'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${statusColor[u.status] || ''}`}>
                      {statusText[u.status] || u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                    <button onClick={() => openEdit(u)}
                      className="text-blue-600 hover:underline text-xs">编辑</button>
                    <button onClick={() => handleToggleStatus(u)}
                      className={`hover:underline text-xs ${u.status === 'suspended' ? 'text-green-600' : 'text-amber-600'}`}>
                      {u.status === 'suspended' ? '激活' : '停用'}
                    </button>
                    <button onClick={() => handleDelete(u)}
                      className="text-red-500 hover:underline text-xs">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="px-5 py-4 border-t flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">上一页</button>
            <span className="text-sm text-slate-500">第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-30">下一页</button>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="新建用户" onClose={() => setShowCreate(false)} onConfirm={handleCreate}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">用户名 *</label>
              <input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="登录用户名" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">密码 *</label>
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="登录密码" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">姓名 *</label>
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="真实姓名" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">角色 *</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg outline-none">
                {Object.entries(UserRole).map(([, v]) => <option key={v} value={v}>{userRoleText(v)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="选填" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">手机</label>
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="选填" />
            </div>
            {createForm.role === UserRole.PHOTOGRAPHER && (
              <div>
                <label className="block text-sm font-medium mb-1">分成比例 (%)</label>
                <input type="number" value={createForm.settlementRatio} onChange={(e) => setCreateForm({ ...createForm, settlementRatio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="如 70 表示 70%" min="0" max="100" />
              </div>
            )}
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title="编辑用户" onClose={() => setShowEdit(null)} onConfirm={handleEdit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">姓名 *</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">角色 *</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none">
                {Object.entries(UserRole).map(([, v]) => <option key={v} value={v}>{userRoleText(v)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">手机</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" />
            </div>
            {editForm.role === UserRole.PHOTOGRAPHER && (
              <div>
                <label className="block text-sm font-medium mb-1">分成比例 (%)</label>
                <input type="number" value={editForm.settlementRatio} onChange={(e) => setEditForm({ ...editForm, settlementRatio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none" min="0" max="100" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">重置密码</label>
              <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="留空则不修改" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, onConfirm }: any) {
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
          <button onClick={onConfirm} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">确认</button>
        </div>
      </div>
    </div>
  );
}
