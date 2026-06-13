'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import { UserRole } from '@/types';
import { formatDate } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  UserCog,
  User,
  Building2,
  Mail,
  Save,
  X,
} from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '部门主管',
  user: '普通用户',
};

const roleIcons: Record<UserRole, any> = {
  admin: Shield,
  manager: UserCog,
  user: User,
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-danger-100 text-danger-700',
  manager: 'bg-primary-100 text-primary-700',
  user: 'bg-gray-100 text-gray-700',
};

export default function UserManagementPage() {
  const users = useStore((state) => state.users);
  const departments = useStore((state) => state.departments);
  const updateUser = useStore((state) => state.updateUser);
  const createUser = useStore((state) => state.createUser);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'user' as UserRole,
    department_id: '',
  });

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'user' as UserRole,
    department_id: '',
  });

  const handleEdit = (user: typeof users[0]) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    });
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;
    setIsSaving(true);
    try {
      await updateUser(editingUserId, editForm);
      setEditingUserId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.department_id) return;
    setIsSaving(true);
    try {
      await createUser(newUserForm);
      setNewUserForm({ name: '', email: '', role: 'user', department_id: '' });
      setIsCreating(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Users className="w-7 h-7 text-primary-900" />
              用户管理
            </h1>
            <p className="text-gray-500">管理系统用户、角色和部门归属</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加用户
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-900" />
              添加新用户
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input
                type="text"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="input"
                placeholder="请输入用户姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
              <input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="input"
                placeholder="请输入用户邮箱"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                className="select"
              >
                <option value="user">普通用户</option>
                <option value="manager">部门主管</option>
                <option value="admin">系统管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门 *</label>
              <select
                value={newUserForm.department_id}
                onChange={(e) => setNewUserForm({ ...newUserForm, department_id: e.target.value })}
                className="select"
              >
                <option value="">请选择部门</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setIsCreating(false)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={isSaving || !newUserForm.name || !newUserForm.email || !newUserForm.department_id}
              className="btn-primary"
            >
              {isSaving ? '创建中...' : '创建用户'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">邮箱</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">角色</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">部门</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const RoleIcon = roleIcons[user.role];
                const isEditing = editingUserId === user.id;
                const department = departments.find(d => d.id === user.department_id);

                if (isEditing) {
                  return (
                    <tr key={user.id} className="border-b border-gray-100 bg-primary-50/30">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="input"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="input"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                          className="select"
                        >
                          <option value="user">普通用户</option>
                          <option value="manager">部门主管</option>
                          <option value="admin">系统管理员</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.department_id}
                          onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                          className="select"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="p-2 hover:bg-success-50 rounded-lg text-success-600"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {department?.name || '未分配'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-danger-50 rounded-lg text-danger-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
