'use client'

import { api, useApiUtils } from '@/trpc/react'
import { Users, Shield, UserCheck } from 'lucide-react'
import { userRoleConfig, formatDate } from '@/lib/config'
import type { UserRole } from '@prisma/client'

const allRoles: UserRole[] = ['EMPLOYEE', 'PROCUREMENT_MANAGER', 'SUPPLIER_COORDINATOR', 'APPROVER', 'ADMIN']

export default function UsersPage() {
  const utils = useApiUtils()
  const { data: users = [] } = api.risk.listUsers.useQuery()

  const update = api.risk.updateUserRole.useMutation({
    onSuccess: async () => await utils.risk.listUsers.invalidate(),
  })

  const roleStats = Object.fromEntries(allRoles.map(r => [r, users.filter(u => u.role === r).length]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">用户管理</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">管理系统用户角色权限，控制访问范围</p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {allRoles.map(r => (
          <div key={r} className="card p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {userRoleConfig[r as keyof typeof userRoleConfig].label}
            </div>
            <div className="text-2xl font-bold">{roleStats[r]}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>邮箱</th>
                <th>部门</th>
                <th>角色</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                        {u.name?.[0] || u.email?.[0] || 'U'}
                      </div>
                      <div className="font-medium">{u.name || '-'}</div>
                    </div>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 font-mono text-sm">{u.email}</td>
                  <td>{u.department || '-'}</td>
                  <td>
                    <span className={`badge ${userRoleConfig[u.role as keyof typeof userRoleConfig].className}`}>
                      <Shield className="w-3 h-3" /> {userRoleConfig[u.role as keyof typeof userRoleConfig].label}
                    </span>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap text-sm">{formatDate(u.createdAt)}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => update.mutate({ id: u.id, role: e.target.value as UserRole })}
                      className="input text-sm py-1.5 min-h-0"
                      disabled={update.isPending}
                    >
                      {allRoles.map(r => <option key={r} value={r}>{userRoleConfig[r].label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无用户数据，登录后自动创建
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
