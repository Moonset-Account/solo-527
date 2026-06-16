'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store';
import { roleLabel, cn } from '@/lib/utils';
import { UserCog, Plus, Edit2, Mail, Shield, Phone } from 'lucide-react';

export default function UsersPage() {
  const { users, createUser, updateUser } = useAppStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales_consultant');
  const [isActive, setIsActive] = useState(true);

  const handleOpen = (user?: typeof users[0]) => {
    if (user) {
      setEditingId(user.id);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.is_active);
    } else {
      setEditingId(null);
      setName('');
      setEmail('');
      setRole('sales_consultant');
      setIsActive(true);
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    if (editingId) {
      updateUser(editingId, { name, email, role: role as any, is_active: isActive });
    } else {
      createUser({ name, email, role: role as any, is_active: isActive });
    }
    setOpen(false);
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-50 text-red-700 border-red-200',
    sales_manager: 'bg-purple-50 text-purple-700 border-purple-200',
    sales_consultant: 'bg-blue-50 text-blue-700 border-blue-200',
    analyst: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary-500" />
                用户账号管理
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">管理系统用户账号，分配角色和权限</p>
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => handleOpen()}>
              新增用户
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-3.5 font-medium">用户信息</th>
                    <th className="px-5 py-3.5 font-medium">邮箱</th>
                    <th className="px-5 py-3.5 font-medium">角色</th>
                    <th className="px-5 py-3.5 font-medium">状态</th>
                    <th className="px-5 py-3.5 font-medium">创建时间</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold',
                              u.role === 'super_admin'
                                ? 'bg-gradient-to-br from-red-500 to-red-600'
                                : u.role === 'sales_manager'
                                ? 'gradient-card-purple'
                                : u.role === 'analyst'
                                ? 'gradient-card-green'
                                : 'gradient-card-blue'
                            )}
                          >
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', roleColors[u.role])}>
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.is_active ? (
                          <Badge variant="success" dot>在职</Badge>
                        ) : (
                          <Badge variant="default" dot>已停用</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{u.created_at.slice(0, 10)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpen(u)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={editingId ? '编辑用户' : '新增用户'}
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button onClick={handleSubmit}>保存</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none text-sm"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">角色权限</label>
              <Select
                options={[
                  { value: 'super_admin', label: '超级管理员' },
                  { value: 'sales_manager', label: '销售经理' },
                  { value: 'sales_consultant', label: '销售顾问' },
                  { value: 'analyst', label: '数据分析员' },
                ]}
                value={role}
                onChange={setRole}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">账号状态</label>
              <div className="flex items-center h-10 gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={isActive} onChange={() => setIsActive(true)} className="accent-primary-500" />
                  <span className="text-sm text-gray-700">启用</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={!isActive} onChange={() => setIsActive(false)} className="accent-primary-500" />
                  <span className="text-sm text-gray-700">停用</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
