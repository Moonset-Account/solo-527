'use client';

import { useState } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Edit,
  Save,
  Check,
  X,
  Settings,
  Eye,
  Upload,
  FileCheck,
  Stamp,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { db } from '@/lib/mock-db';
import { roleLabels, cn } from '@/lib/utils';
import { UserRole } from '@prisma/client';

export default function PermissionsPage() {
  const users = db.users.findMany();
  const rolePermissions = db.rolePermissions.findMany();
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [tempPerms, setTempPerms] = useState<any>(null);

  const permissionItems = [
    { key: 'canUpload', label: '上传合同', icon: Upload },
    { key: 'canReview', label: '审阅合同', icon: FileText },
    { key: 'canApprove', label: '审批通过', icon: Check },
    { key: 'canDownload', label: '下载合同', icon: FileCheck },
    { key: 'canStamp', label: '盖章操作', icon: Stamp },
    { key: 'canManageRules', label: '管理提醒规则', icon: Settings },
    { key: 'canManageUsers', label: '用户管理', icon: Users },
    { key: 'canViewDashboard', label: '查看看板', icon: Eye },
    { key: 'canViewLogs', label: '查看操作日志', icon: ClipboardList },
  ];

  function startEditRole(rolePerm: any) {
    setEditingRole(rolePerm.role);
    setTempPerms({ ...rolePerm });
  }

  function saveRolePerms() {
    if (editingRole && tempPerms) {
      db.rolePermissions.update({
        where: { role: editingRole },
        data: tempPerms,
      });
      setEditingRole(null);
      setTempPerms(null);
    }
  }

  function togglePerm(key: string) {
    if (tempPerms) {
      setTempPerms({
        ...tempPerms,
        [key]: !tempPerms[key],
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">权限设置</h1>
          <p className="mt-1 text-sm text-gray-500">管理系统角色权限和用户分配</p>
        </div>
        <button className="btn-primary">
          <UserPlus className="mr-2 h-4 w-4" />
          添加用户
        </button>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4">
            <button
              onClick={() => setActiveTab('roles')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'roles'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Shield className="h-4 w-4" />
              角色权限
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Users className="h-4 w-4" />
              用户管理
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'roles' && (
            <div className="space-y-4">
              {rolePermissions.map((rp: any) => {
                const isEditing = editingRole === rp.role;
                const perms = isEditing && tempPerms ? tempPerms : rp;

                return (
                  <div
                    key={rp.id}
                    className={cn(
                      'rounded-lg border transition-all',
                      isEditing ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200'
                    )}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {roleLabels[rp.role] || rp.role}
                          </h3>
                          <p className="text-sm text-gray-500">
                            角色代码：{rp.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveRolePerms}
                              className="btn-primary text-sm"
                            >
                              <Save className="mr-1 h-4 w-4" />
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setEditingRole(null);
                                setTempPerms(null);
                              }}
                              className="btn-secondary text-sm"
                            >
                              <X className="mr-1 h-4 w-4" />
                              取消
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditRole(rp)}
                            className="btn-secondary text-sm"
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            编辑权限
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {permissionItems.map((item) => {
                          const Icon = item.icon;
                          const hasPermission = perms[item.key];

                          return (
                            <div
                              key={item.key}
                              onClick={() => isEditing && togglePerm(item.key)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border p-3 transition-all',
                                hasPermission
                                  ? 'border-success-200 bg-success-50'
                                  : 'border-gray-200 bg-gray-50',
                                isEditing ? 'cursor-pointer hover:border-primary-300' : ''
                              )}
                            >
                              <div className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-md',
                                hasPermission
                                  ? 'bg-success-100 text-success-600'
                                  : 'bg-gray-200 text-gray-400'
                              )}>
                                {hasPermission ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className={cn(
                                  'text-sm font-medium',
                                  hasPermission ? 'text-gray-900' : 'text-gray-500'
                                )}>
                                  {item.label}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {hasPermission ? '已授权' : '未授权'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      用户
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      角色
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      邮箱
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      创建时间
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="badge badge-primary">
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                        <button className="text-primary-600 hover:text-primary-700 mr-3">
                          <Edit className="h-4 w-4 inline" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <Settings className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
