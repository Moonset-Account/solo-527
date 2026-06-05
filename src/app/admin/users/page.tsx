import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Users, Shield, UserPlus, Edit, History } from 'lucide-react';
import Link from 'next/link';
import { formatDate, hasPermission } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const session = await auth();

  if (!hasPermission(session?.user?.role || 'USER', ['SUPER_ADMIN'])) {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          productions: true,
          characters: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const roleConfig: Record<string, { label: string; className: string }> = {
    SUPER_ADMIN: { label: '超级管理员', className: 'bg-purple-100 text-purple-700' },
    COMMITTEE: { label: '社团干事', className: 'bg-blue-100 text-blue-700' },
    DIRECTOR: { label: '导演', className: 'bg-green-100 text-green-700' },
    ACTOR: { label: '演员', className: 'bg-yellow-100 text-yellow-700' },
    TICKET_STAFF: { label: '票务人员', className: 'bg-orange-100 text-orange-700' },
    USER: { label: '普通用户', className: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            用户管理
          </h1>
          <p className="text-gray-500 mt-1">管理系统用户和权限分配</p>
        </div>
        <Link
          href="/admin/users/new"
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>添加用户</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                  {config.label}
                </span>
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{count}</p>
              <p className="text-xs text-gray-500 mt-1">用户数</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学号/部门
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const role = roleConfig[user.role];
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-gray-400">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.className}`}
                      >
                        {role.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {user.studentId && <p>学号：{user.studentId}</p>}
                        {user.department && <p>{user.department}</p>}
                        {!user.studentId && !user.department && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? '正常' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>剧目：{user._count.productions}</p>
                        <p>角色：{user._count.characters}</p>
                        <p>订单：{user._count.orders}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt, 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/audit-logs?userId=${user.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <History className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无用户</h3>
            <p className="text-gray-500">点击上方按钮添加第一个用户</p>
          </div>
        )}
      </div>
    </div>
  );
}
