import { useState, useEffect } from 'react'
import { Plus, Shield, Edit2, Check, X } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface Role {
  id: string
  name: string
  permissions: string[]
}

const permissionGroups = [
  { label: '地块管理', perms: ['plots:view', 'plots:edit'] },
  { label: '品种管理', perms: ['varieties:view', 'varieties:edit'] },
  { label: '农事记录', perms: ['farm-records:view', 'farm-records:edit', 'farm-records:review'] },
  { label: '采收记录', perms: ['harvests:view', 'harvests:edit'] },
  { label: '分拣订单', perms: ['sorting:view', 'sorting:edit'] },
  { label: '订单管理', perms: ['orders:view', 'orders:edit'] },
  { label: '申报材料', perms: ['declarations:view', 'declarations:edit'] },
  { label: '系统管理', perms: ['admin:roles', 'admin:logs', 'admin:export', 'admin:alerts'] },
]

const permLabel: Record<string, string> = {
  'plots:view': '查看', 'plots:edit': '编辑',
  'varieties:view': '查看', 'varieties:edit': '编辑',
  'farm-records:view': '查看', 'farm-records:edit': '编辑', 'farm-records:review': '审核',
  'harvests:view': '查看', 'harvests:edit': '编辑',
  'sorting:view': '查看', 'sorting:edit': '编辑',
  'orders:view': '查看', 'orders:edit': '编辑',
  'declarations:view': '查看', 'declarations:edit': '编辑',
  'admin:roles': '角色权限', 'admin:logs': '操作日志', 'admin:export': '数据导出', 'admin:alerts': '异常提醒',
}

const allPermissions = permissionGroups.flatMap((g) => g.perms)

function PermissionBadge({ perm }: { perm: string }) {
  const [module, action] = perm.split(':')
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      action === 'view' ? 'bg-blue-50 text-blue-600' :
      action === 'edit' ? 'bg-green-50 text-green-600' :
      action === 'review' ? 'bg-purple-50 text-purple-600' :
      'bg-amber-50 text-amber-600'
    )}>
      {permLabel[perm]}
    </span>
  )
}

function RoleModal({ isOpen, onClose, role, onSave }: {
  isOpen: boolean
  onClose: () => void
  role: Role | null
  onSave: (data: { name: string; permissions: string[] }) => void
}) {
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    if (role) {
      setName(role.name)
      setPermissions(role.permissions)
    } else {
      setName('')
      setPermissions([])
    }
  }, [role, isOpen])

  const togglePerm = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const toggleGroup = (groupPerms: string[]) => {
    const allSelected = groupPerms.every((p) => permissions.includes(p))
    if (allSelected) {
      setPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)))
    } else {
      setPermissions((prev) => [...new Set([...prev, ...groupPerms])])
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), permissions })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={role ? '编辑角色' : '新增角色'} size="lg">
      <div className="space-y-4">
        <FormField label="角色名称" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="请输入角色名称"
          />
        </FormField>
        <FormField label="权限配置" required>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {permissionGroups.map((group) => {
              const allSelected = group.perms.every((p) => permissions.includes(p))
              return (
                <div key={group.label} className="flex items-start border-b border-gray-100 last:border-0 px-4 py-3">
                  <label className="flex items-center gap-2 w-24 flex-shrink-0 pt-0.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleGroup(group.perms)}
                      className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{group.label}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {group.perms.map((perm) => (
                      <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm)}
                          onChange={() => togglePerm(perm)}
                          className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                        />
                        <PermissionBadge perm={perm} />
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={!name.trim()}>
            {role ? '保存修改' : '创建角色'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Roles() {
  const { execute, data, loading } = useApi<Role[]>()
  const saveApi = useApi<Role>()
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    execute('/api/admin/roles').then((res) => {
      if (res) setRoles(Array.isArray(res) ? res : [])
    })
  }, [])

  const handleSave = async (formData: { name: string; permissions: string[] }) => {
    const loadAll = async () => {
      const fresh = await execute('/api/admin/roles')
      if (fresh) setRoles(Array.isArray(fresh) ? fresh : [])
    }
    if (editingRole) {
      const res = await saveApi.execute(`/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      if (res) await loadAll()
    } else {
      const res = await saveApi.execute('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      if (res) await loadAll()
    }
    setModalOpen(false)
    setEditingRole(null)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setEditingRole(null)
    setModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="角色权限"
        subtitle="管理系统角色及权限配置"
        action={
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增角色
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-24 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const isExpanded = expandedId === role.id
            const displayPerms = isExpanded ? role.permissions : role.permissions.slice(0, 6)
            return (
              <div key={role.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary-700" />
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  </div>
                  <button
                    onClick={() => handleEdit(role)}
                    className="p-1.5 text-gray-400 hover:text-primary-700 rounded-lg hover:bg-primary-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {displayPerms.map((perm) => (
                    <PermissionBadge key={perm} perm={perm} />
                  ))}
                  {!isExpanded && role.permissions.length > 6 && (
                    <button
                      onClick={() => setExpandedId(role.id)}
                      className="text-xs text-primary-600 hover:underline px-1.5 py-0.5"
                    >
                      +{role.permissions.length - 6} 更多
                    </button>
                  )}
                  {isExpanded && role.permissions.length > 6 && (
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-gray-500 hover:underline px-1.5 py-0.5 flex items-center gap-0.5"
                    >
                      收起 <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  共 {role.permissions.length} 项权限
                </div>
              </div>
            )
          })}
          {roles.length === 0 && (
            <div className="col-span-full card p-8 text-center text-gray-400">暂无角色数据</div>
          )}
        </div>
      )}

      <RoleModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRole(null) }}
        role={editingRole}
        onSave={handleSave}
      />
    </div>
  )
}
