import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';

interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}

export const Route = createFileRoute('/users')({
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phone: '',
    email: '',
    role: 'consultant' as 'admin' | 'consultant',
    password: '',
  });

  const fetchUsers = () => {
    setLoading(true);
    apiClient
      .get('/users', { params: { page, pageSize } })
      .then((res) => {
        setUsers(res.data.list || res.data);
        setTotal(res.data.total || (res.data.list ? res.data.list.length : res.data.length));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const handleSubmit = () => {
    const data = { ...formData };
    if (!editingUser && !data.password) {
      alert('请输入密码');
      return;
    }
    if (editingUser && !data.password) {
      delete (data as { password?: string }).password;
    }
    
    const promise = editingUser
      ? apiClient.put(`/users/${editingUser.id}`, data)
      : apiClient.post('/users', data);
    
    promise.then(() => {
      setModalOpen(false);
      fetchUsers();
    });
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (confirm(`确定要${newStatus === 'active' ? '启用' : '禁用'}用户 "${user.name}" 吗？`)) {
      apiClient.patch(`/users/${user.id}/status`, { status: newStatus }).then(fetchUsers);
    }
  };

  const handleResetPassword = (user: User) => {
    const newPassword = prompt('请输入新密码：');
    if (newPassword && newPassword.length >= 6) {
      apiClient.patch(`/users/${user.id}/password`, { password: newPassword }).then(() => {
        alert('密码重置成功');
      });
    } else if (newPassword) {
      alert('密码长度至少6位');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role as 'admin' | 'consultant',
      password: '',
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      phone: '',
      email: '',
      role: 'consultant',
      password: '',
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      title: '姓名',
      render: (r: User) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
            {r.name?.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-800">{r.name}</div>
            <div className="text-xs text-gray-500">@{r.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: '联系电话',
      render: (r: User) => r.phone || '-',
    },
    {
      key: 'email',
      title: '邮箱',
      render: (r: User) => r.email || '-',
    },
    {
      key: 'role',
      title: '角色',
      render: (r: User) => (
        <span className={`px-2 py-1 rounded text-xs ${r.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          {r.role === 'admin' ? '管理员' : '顾问'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (r: User) => (
        <span className={`px-2 py-1 rounded text-xs ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {r.status === 'active' ? '正常' : '禁用'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      title: '最后登录',
      render: (r: User) => r.lastLogin ? dayjs(r.lastLogin).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (r: User) => dayjs(r.createdAt).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增用户
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
        actions={(r) => (
          <>
            <button
              onClick={() => openEditModal(r)}
              className="text-blue-600 hover:text-blue-800"
            >
              编辑
            </button>
            <button
              onClick={() => handleResetPassword(r)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              重置密码
            </button>
            <button
              onClick={() => handleToggleStatus(r)}
              className={r.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
            >
              {r.status === 'active' ? '禁用' : '启用'}
            </button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        title={editingUser ? '编辑用户' : '新增用户'}
        onClose={() => setModalOpen(false)}
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="登录账号"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="真实姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'consultant' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="consultant">顾问</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 {!editingUser && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={editingUser ? '不修改请留空' : '至少6位'}
            />
            {editingUser && (
              <p className="mt-1 text-xs text-gray-500">不修改密码请留空</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="手机号码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="电子邮箱"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
