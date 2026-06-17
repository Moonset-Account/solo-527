import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { Users, Plus, Edit, Shield, UserCheck, Eye, EyeOff } from 'lucide-react';
import type { AdminUser } from '@shared/types';
import { formatDate, getRoleText } from '@/utils';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { role } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'ecommerce' as 'ecommerce' | 'admin',
    status: 'active' as 'active' | 'inactive',
  });

  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await api.get<AdminUser[]>('/admin/users');
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'ecommerce', status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role as 'ecommerce' | 'admin',
      status: user.status as 'active' | 'inactive',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser && !formData.password) {
      alert('请设置密码');
      return;
    }
    if (!formData.username) {
      alert('请输入用户名');
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, {
          role: formData.role,
          status: formData.status,
          password: formData.password || undefined,
        });
      } else {
        await api.post('/admin/users', formData);
      }
      alert('保存成功！');
      setModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`确定要${newStatus === 'active' ? '启用' : '禁用'}该用户吗？`)) return;

    try {
      await api.put(`/admin/users/${user.id}`, { status: newStatus });
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 mt-1">共 {users.length} 个管理员账号</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建用户
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">用户名</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">角色</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">创建时间</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">暂无用户数据</p>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-brand-600" />
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.status === 'active' ? '正常' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStatus(user)}
                          className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title={user.status === 'active' ? '禁用' : '启用'}
                        >
                          {user.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fadeInUp">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingUser ? '编辑用户' : '新建用户'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? '新密码（不修改留空）' : '密码 *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="ecommerce">电商负责人</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="active">正常</option>
                    <option value="inactive">已禁用</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
