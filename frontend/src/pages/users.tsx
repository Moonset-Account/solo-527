import { useState } from 'react';
import { useApiQuery, apiPost, apiPut, apiDelete } from '@/lib/hooks';
import { useAuthStore, roleLabels, roleColors, UserRole } from '@/store/auth';
import { formatDate } from '@/lib/format';
import { clsx } from 'clsx';
import { Users, Plus, Search, UserCog, ShieldCheck, Phone, Mail, Building, Edit3, X, Check } from 'lucide-react';

export default function UsersPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const listQ = useApiQuery<any>(
    ['users-list', page, roleFilter],
    '/users',
    { page, pageSize: 20, role: roleFilter || undefined }
  );

  const items = listQ.data?.data || [];
  const total = listQ.data?.total || 0;

  const resetForm = () => {
    setFormData({ username: '', password: '', realName: '', role: 'planner', department: '', phone: '', email: '' });
  };
  const openAdd = () => { resetForm(); setShowAddModal(true); };
  const openEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({ realName: u.realName, role: u.role, department: u.department || '', phone: u.phone || '', email: u.email || '', isActive: u.isActive });
  };

  const handleCreate = async () => {
    if (!formData.username || !formData.password || !formData.realName) return;
    await apiPost('/users', formData);
    setShowAddModal(false);
    listQ.refetch();
  };
  const handleUpdate = async () => {
    if (!editingId) return;
    await apiPut(`/users/${editingId}`, formData);
    setEditingId(null);
    listQ.refetch();
  };
  const handleToggleActive = async (u: any) => {
    await apiPut(`/users/${u.id}`, { isActive: !u.isActive });
    listQ.refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={26} className="text-brand-600" /> 用户与权限
          </h1>
          <p className="text-slate-500 text-sm mt-1">系统用户管理 · 角色权限区分</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> 新增用户
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center"><ShieldCheck size={22} /></div>
            <div>
              <div className="text-xs text-slate-500">系统管理员</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">
                {items.filter((u: any) => u.role === 'admin').length}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 leading-relaxed">拥有所有权限：用户管理、超时审批、所有操作</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center"><UserCog size={22} /></div>
            <div>
              <div className="text-xs text-slate-500">设备主管</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">
                {items.filter((u: any) => u.role === 'equipment_supervisor').length}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 leading-relaxed">可执行返工超时审批，查看和处理工序</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Users size={22} /></div>
            <div>
              <div className="text-xs text-slate-500">计划员</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">
                {items.filter((u: any) => u.role === 'planner').length}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 leading-relaxed">日常操作：工单查看、排程、导出、物料跟踪</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-800">用户列表</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9 w-64" placeholder="搜索用户名/姓名..." />
            </div>
            <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">全部角色</option>
              <option value="admin">系统管理员</option>
              <option value="equipment_supervisor">设备主管</option>
              <option value="planner">计划员</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr>
              <th>用户</th><th>角色</th><th>部门</th><th>手机</th><th>邮箱</th>
              <th>账号状态</th><th>创建时间</th><th>操作</th>
            </tr></thead>
            <tbody>
              {listQ.isLoading && <tr><td colSpan={8} className="py-8 text-center text-slate-400">加载中...</td></tr>}
              {items.map((u: any) => (
                <tr key={u.id} className={editingId === u.id ? 'bg-amber-50/40' : ''}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white text-sm', roleColors[u.role])}>
                        {u.realName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{u.realName}</div>
                        <div className="text-xs text-slate-500">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <select className="input text-xs py-1.5" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                        <option value="admin">系统管理员</option>
                        <option value="equipment_supervisor">设备主管</option>
                        <option value="planner">计划员</option>
                      </select>
                    ) : (
                      <span className={clsx('badge', roleColors[u.role])}>{roleLabels[u.role]}</span>
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <input className="input text-xs py-1.5" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                    ) : (
                      <span className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Building size={13} className="text-slate-400" /> {u.department || '-'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <input className="input text-xs py-1.5" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    ) : (
                      <span className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" /> {u.phone || '-'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <input className="input text-xs py-1.5" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    ) : (
                      <span className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400" /> {u.email || '-'}
                      </span>
                    )}
                  </td>
                  <td>
                    {u.isActive ? (
                      <span className="badge bg-brand-100 text-brand-700">正常</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-500">已禁用</span>
                    )}
                  </td>
                  <td className="text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {editingId === u.id ? (
                        <>
                          <button className="btn-ghost text-xs py-1 text-brand-600 hover:bg-brand-50" onClick={handleUpdate}>
                            <Check size={14} /> 保存
                          </button>
                          <button className="btn-ghost text-xs py-1 text-slate-500 hover:bg-slate-50" onClick={() => setEditingId(null)}>
                            <X size={14} /> 取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-ghost text-xs py-1 text-slate-600 hover:bg-slate-50" onClick={() => openEdit(u)}>
                            <Edit3 size={14} /> 编辑
                          </button>
                          <button className={clsx('btn-ghost text-xs py-1 hover:bg-red-50',
                            u.isActive ? 'text-red-600' : 'text-brand-600 hover:bg-brand-50')}
                            onClick={() => handleToggleActive(u)}>
                            {u.isActive ? '禁用' : '启用'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="card-header flex items-center justify-between border-t border-slate-200">
            <div className="text-xs text-slate-500">共 {total} 条记录</div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
              <button className="btn-secondary text-xs py-1.5" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>下一页</button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Plus size={20} /> 新增用户</h3>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">用户名 *</label>
                  <input className="input" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="label">初始密码 *</label>
                  <input className="input" type="password" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">真实姓名 *</label>
                  <input className="input" value={formData.realName || ''} onChange={e => setFormData({ ...formData, realName: e.target.value })} />
                </div>
                <div>
                  <label className="label">角色</label>
                  <select className="input" value={formData.role || 'planner'} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="admin">系统管理员</option>
                    <option value="equipment_supervisor">设备主管</option>
                    <option value="planner">计划员</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">部门</label>
                <input className="input" value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">手机</label>
                  <input className="input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">邮箱</label>
                  <input className="input" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn-primary" disabled={!formData.username || !formData.password || !formData.realName} onClick={handleCreate}>
                <Check size={14} /> 确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
