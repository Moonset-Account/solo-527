'use client'

import { useState } from 'react'
import { Shield, Plus, Check, X, Clock, User } from 'lucide-react'
import type { PermissionRequest, UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'

type TabKey = 'roles' | 'requests'

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  researcher: { 预约: true, 归档: false, 审核: false, 看板: true, 停用管理: false },
  archivist: { 预约: false, 归档: true, 审核: false, 看板: true, 停用管理: false },
  admin: { 预约: true, 归档: true, 审核: true, 看板: true, 停用管理: true },
  equipment_teacher: { 预约: true, 归档: false, 审核: false, 看板: true, 停用管理: true },
}

const PERMISSION_COLUMNS = ['预约', '归档', '审核', '看板', '停用管理']

const MOCK_REQUESTS: PermissionRequest[] = [
  { id: '1', user_id: 'u1', requested_role: 'archivist', status: 'pending', reason: '需要归档实验数据', reviewed_by: null, created_at: '2024-03-15T10:00:00Z', reviewed_at: null, user: { id: 'u1', email: 'zhangsan@lab.edu', role: 'researcher', display_name: '张三', lab_id: 'lab1' } },
  { id: '2', user_id: 'u2', requested_role: 'equipment_teacher', status: 'pending', reason: '负责XRD设备管理', reviewed_by: null, created_at: '2024-03-14T14:30:00Z', reviewed_at: null, user: { id: 'u2', email: 'lisi@lab.edu', role: 'researcher', display_name: '李四', lab_id: 'lab1' } },
  { id: '3', user_id: 'u3', requested_role: 'admin', status: 'approved', reason: '接任实验室管理', reviewed_by: 'admin1', created_at: '2024-03-10T09:00:00Z', reviewed_at: '2024-03-11T11:00:00Z', user: { id: 'u3', email: 'wangwu@lab.edu', role: 'equipment_teacher', display_name: '王五', lab_id: 'lab1' } },
  { id: '4', user_id: 'u4', requested_role: 'archivist', status: 'rejected', reason: '协助项目归档工作', reviewed_by: 'admin1', created_at: '2024-03-08T16:00:00Z', reviewed_at: '2024-03-09T10:00:00Z', user: { id: 'u4', email: 'zhaoliu@lab.edu', role: 'researcher', display_name: '赵六', lab_id: 'lab1' } },
  { id: '5', user_id: 'u5', requested_role: 'equipment_teacher', status: 'pending', reason: '新增SEM设备负责人', reviewed_by: null, created_at: '2024-03-16T08:30:00Z', reviewed_at: null, user: { id: 'u5', email: 'sunqi@lab.edu', role: 'researcher', display_name: '孙七', lab_id: 'lab1' } },
]

const statusLabel: Record<string, string> = { pending: '待审批', approved: '已通过', rejected: '已驳回' }

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roles')
  const [showModal, setShowModal] = useState(false)
  const [requests, setRequests] = useState(MOCK_REQUESTS)

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as const, reviewed_at: new Date().toISOString() } : r))
  }

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const, reviewed_at: new Date().toISOString() } : r))
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="page-title mb-4">权限控制中心</h1>
        <div className="flex gap-2 border-b border-slate-200">
          {([['roles', '角色管理'], ['requests', '权限申请']] as [TabKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'roles' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">角色权限矩阵</h2>
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">角色</th>
                  {PERMISSION_COLUMNS.map(col => (
                    <th key={col} className="text-center py-3 px-4 font-medium text-slate-600">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                  <tr key={role} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{ROLE_LABELS[role as UserRole]}</td>
                    {PERMISSION_COLUMNS.map(col => (
                      <td key={col} className="text-center py-3 px-4">
                        {perms[col] ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              申请新权限
            </button>
          </div>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{req.user?.display_name}</p>
                    <p className="text-sm text-slate-500">{req.user?.email} · 申请角色: {ROLE_LABELS[req.requested_role]}</p>
                    {req.reason && <p className="text-sm text-slate-500 mt-1">原因: {req.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={req.status} label={statusLabel[req.status]} />
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(req.id)} className="btn-primary text-xs px-3 py-1.5">通过</button>
                      <button onClick={() => handleReject(req.id)} className="btn-danger text-xs px-3 py-1.5">驳回</button>
                    </div>
                  )}
                  <span className="text-xs text-slate-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(req.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="section-title mb-4">申请新权限</h2>
            <div className="space-y-4">
              <div>
                <label className="label">申请角色</label>
                <select className="input-field">
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">申请原因</label>
                <textarea className="input-field min-h-[80px] resize-none" placeholder="请说明申请原因..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button onClick={() => setShowModal(false)} className="btn-primary">提交申请</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
