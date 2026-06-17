'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Button, Input, Select, Modal, Textarea } from '@/components/ui'
import { RoleBadge } from '@/components/Badges'
import { formatDate } from '@/lib/utils'

const roleOptions = [
  { value: 'RESIDENT', label: '居民' },
  { value: 'REPRESENTATIVE', label: '居民代表' },
  { value: 'ADMIN', label: '管理员' },
  { value: 'AUDITOR', label: '审计员' },
]

const adminNavItems = [
  { href: '/admin', label: '📊 仪表盘' },
  { href: '/admin/users', label: '👥 用户权限', active: true },
  { href: '/admin/voting-rules', label: '⚙️ 投票规则' },
  { href: '/admin/audit', label: '📜 审计日志' },
]

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({
    role: roleFilter as any,
    limit: 200,
  })
  const utils = trpc.useUtils()

  const [editUser, setEditUser] = useState<any>(null)
  const [editRole, setEditRole] = useState('')
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate()
      setEditUser(null)
    },
  })
  const updateProfileMutation = trpc.admin.updateUserProfile.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate()
      setEditUser(null)
    },
  })

  const openEdit = (user: any) => {
    setEditUser(user)
    setEditRole(user.role)
    setEditName(user.name || '')
    setEditPhone(user.phone || '')
    setEditAddress(user.address || '')
  }

  const handleSave = () => {
    if (!editUser) return
    if (editRole !== editUser.role) {
      updateRoleMutation.mutate({ id: editUser.id, role: editRole as any })
    }
    if (editName !== editUser.name || editPhone !== editUser.phone || editAddress !== editUser.address) {
      updateProfileMutation.mutate({
        id: editUser.id,
        name: editName || undefined,
        phone: editPhone || undefined,
        address: editAddress || undefined,
      })
    }
    if (editRole === editUser.role && editName === editUser.name && editPhone === editUser.phone && editAddress === editUser.address) {
      setEditUser(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">⚙️ 后台管理</h1>
        <p className="mt-1 text-sm text-slate-500">社区管理中心</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {adminNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              item.active
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>👥 用户与权限管理</CardTitle>
          <div className="w-full sm:w-60">
            <Select
              value={roleFilter || ''}
              onChange={e => setRoleFilter(e.target.value || undefined)}
              options={[{ value: '', label: '全部角色' }, ...roleOptions]}
            />
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState icon="👥" title="暂无用户" />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">用户</th>
                    <th className="px-5 py-3 hidden md:table-cell">联系方式</th>
                    <th className="px-5 py-3">角色</th>
                    <th className="px-5 py-3 hidden sm:table-cell">注册时间</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{u.name || '未设置'}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div className="text-sm text-slate-600">
                          {u.phone ? `📱 ${u.phone}` : <span className="text-slate-400">未绑定</span>}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                          {u.address || '未填写地址'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-500">{formatDate(u.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          编辑
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`编辑用户 - ${editUser?.name || editUser?.email}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUser(null)}>取消</Button>
            <Button onClick={handleSave} disabled={updateRoleMutation.isPending || updateProfileMutation.isPending}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="用户角色" value={editRole} onChange={e => setEditRole(e.target.value)} options={roleOptions} />
          <Input label="姓名" value={editName} onChange={e => setEditName(e.target.value)} />
          <Input label="手机号" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
          <Textarea label="地址" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
