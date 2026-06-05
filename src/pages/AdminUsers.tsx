import { useEffect, useState } from 'react';
import { Plus, Edit, User as UserIcon } from 'lucide-react';
import { adminApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import type { User, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '场馆管理',
  guide: '讲解员',
  school_contact: '学校联系人',
  parent: '家长',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  guide: 'bg-green-100 text-green-700',
  school_contact: 'bg-yellow-100 text-yellow-700',
  parent: 'bg-orange-100 text-orange-700',
};

const roleDotColors: Record<UserRole, string> = {
  admin: 'bg-purple-500',
  manager: 'bg-blue-500',
  guide: 'bg-green-500',
  school_contact: 'bg-yellow-500',
  parent: 'bg-orange-500',
};

const roleAvatarColors: Record<UserRole, string> = {
  admin: 'bg-purple-500',
  manager: 'bg-blue-500',
  guide: 'bg-green-500',
  school_contact: 'bg-yellow-500',
  parent: 'bg-orange-500',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'parent' as UserRole,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  const openCreateModal = () => {
    setEditUser(null);
    setForm({ username: '', email: '', password: '', name: '', phone: '', role: 'parent' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditUser(user);
    setForm({ username: user.username, email: user.email, password: '', name: user.name, phone: user.phone || '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editUser) {
        const updateData: any = { ...form };
        if (!updateData.password) delete updateData.password;
        await adminApi.updateUser(editUser.id, updateData);
      } else {
        await adminApi.createUser(form);
      }
      setShowModal(false);
      loadUsers();
    } catch {}
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="page-title">用户管理</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          创建用户
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: '全部' },
          { key: 'admin', label: '管理员' },
          { key: 'manager', label: '管理者' },
          { key: 'guide', label: '讲解员' },
          { key: 'school_contact', label: '学校' },
          { key: 'parent', label: '家长' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={roleFilter === tab.key ? 'btn-primary' : 'btn-secondary'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="暂无用户" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${roleAvatarColors[user.role]} flex items-center justify-center text-white text-sm font-medium shrink-0`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-slate-700 font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-600">{user.username}</td>
                  <td className="text-slate-500 text-xs">{user.email}</td>
                  <td>
                    <span className={`status-badge ${roleColors[user.role]} gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${roleDotColors[user.role]}`} />
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="text-slate-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td>
                    <button
                      onClick={() => openEditModal(user)}
                      className="btn-ghost flex items-center gap-1 text-museum"
                    >
                      <Edit size={14} />
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-museum/10 flex items-center justify-center">
                <UserIcon size={20} className="text-museum" />
              </div>
              <h2 className="section-title">
                {editUser ? '编辑用户' : '创建用户'}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-field"
                  disabled={!!editUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  密码{editUser && '（留空不修改）'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">角色</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="select-field"
                >
                  <option value="admin">系统管理员</option>
                  <option value="manager">场馆管理</option>
                  <option value="guide">讲解员</option>
                  <option value="school_contact">学校联系人</option>
                  <option value="parent">家长</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
              >
                {editUser ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
