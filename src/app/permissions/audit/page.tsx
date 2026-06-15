'use client'

import { useState } from 'react'
import { ClipboardCheck, CheckCircle, XCircle, User, Mail, Calendar, MessageSquare } from 'lucide-react'
import type { PermissionRequest } from '@/types'
import { ROLE_LABELS } from '@/types'
import AppShell from '@/components/layout/AppShell'

const MOCK_PENDING: PermissionRequest[] = [
  { id: '1', user_id: 'u1', requested_role: 'archivist', status: 'pending', reason: '需要归档近三个月的实验数据，原归档人员已离岗', reviewed_by: null, created_at: '2024-03-15T10:00:00Z', reviewed_at: null, user: { id: 'u1', email: 'zhangsan@lab.edu', role: 'researcher', display_name: '张三', lab_id: 'lab1' } },
  { id: '2', user_id: 'u2', requested_role: 'equipment_teacher', status: 'pending', reason: '负责XRD设备日常维护与管理', reviewed_by: null, created_at: '2024-03-14T14:30:00Z', reviewed_at: null, user: { id: 'u2', email: 'lisi@lab.edu', role: 'researcher', display_name: '李四', lab_id: 'lab1' } },
  { id: '5', user_id: 'u5', requested_role: 'equipment_teacher', status: 'pending', reason: '新增SEM设备负责人，需管理权限', reviewed_by: null, created_at: '2024-03-16T08:30:00Z', reviewed_at: null, user: { id: 'u5', email: 'sunqi@lab.edu', role: 'researcher', display_name: '孙七', lab_id: 'lab1' } },
  { id: '6', user_id: 'u6', requested_role: 'admin', status: 'pending', reason: '实验室换届，需要管理员权限进行系统配置', reviewed_by: null, created_at: '2024-03-16T11:00:00Z', reviewed_at: null, user: { id: 'u6', email: 'zhouba@lab.edu', role: 'equipment_teacher', display_name: '周八', lab_id: 'lab1' } },
]

export default function AuditPage() {
  const [requests, setRequests] = useState(MOCK_PENDING)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setRequests(prev => prev.filter(r => r.id !== id))
    setConfirmAction(null)
  }

  const handleBatch = (action: 'approve' | 'reject') => {
    setRequests([])
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="page-title mb-4">审批队列</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
            <span className="text-slate-600">待审批: <strong className="text-slate-900">{requests.length}</strong> 条</span>
          </div>
          {requests.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => handleBatch('approve')} className="btn-primary text-sm">
                <CheckCircle className="w-4 h-4" />
                批量通过
              </button>
              <button onClick={() => handleBatch('reject')} className="btn-danger text-sm">
                <XCircle className="w-4 h-4" />
                批量驳回
              </button>
            </div>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500">所有申请已处理完毕</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{req.user?.display_name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {req.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="ml-13 space-y-2 pl-13">
                    <p className="text-sm">
                      <span className="text-slate-500">申请角色:</span>{' '}
                      <span className="font-medium text-teal-700">{ROLE_LABELS[req.requested_role]}</span>
                    </p>
                    {req.reason && (
                      <p className="text-sm flex items-start gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-600">{req.reason}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      申请时间: {new Date(req.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => setConfirmAction({ id: req.id, action: 'approve' })}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => setConfirmAction({ id: req.id, action: 'reject' })}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    驳回
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmAction.action === 'approve' ? '确认通过' : '确认驳回'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {confirmAction.action === 'approve' ? '确定通过该权限申请？通过后将赋予对应角色权限。' : '确定驳回该权限申请？驳回后申请人需重新提交。'}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary">取消</button>
              <button
                onClick={() => handleAction(confirmAction.id, confirmAction.action)}
                className={confirmAction.action === 'approve' ? 'btn-primary' : 'btn-danger'}
              >
                确认{confirmAction.action === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
