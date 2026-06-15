'use client'

import { useState, useEffect, useTransition } from 'react'
import { ClipboardCheck, CheckCircle, XCircle, User, Mail, Calendar, MessageSquare, Check, X } from 'lucide-react'
import type { PermissionRequest } from '@/types'
import { ROLE_LABELS } from '@/types'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import { listPermissionRequests, reviewPermissionRequest } from '@/lib/actions/permissions'

const MOCK_PENDING: PermissionRequest[] = [
  { id: '00000000-0000-0000-0000-000000000051', user_id: '00000000-0000-0000-0000-000000009001', requested_role: 'archivist', status: 'pending', reason: '需要归档近三个月的实验数据，原归档人员已离岗', reviewed_by: null, created_at: '2024-03-15T10:00:00Z', reviewed_at: null, user: { id: '00000000-0000-0000-0000-000000009001', email: 'zhangsan@lab.edu', role: 'researcher', display_name: '张三', lab_id: '00000000-0000-0000-0000-000000008001' } },
  { id: '00000000-0000-0000-0000-000000000052', user_id: '00000000-0000-0000-0000-000000009002', requested_role: 'equipment_teacher', status: 'pending', reason: '负责XRD设备日常维护与管理', reviewed_by: null, created_at: '2024-03-14T14:30:00Z', reviewed_at: null, user: { id: '00000000-0000-0000-0000-000000009002', email: 'lisi@lab.edu', role: 'researcher', display_name: '李四', lab_id: '00000000-0000-0000-0000-000000008001' } },
  { id: '00000000-0000-0000-0000-000000000055', user_id: '00000000-0000-0000-0000-000000009005', requested_role: 'equipment_teacher', status: 'pending', reason: '新增SEM设备负责人，需管理权限', reviewed_by: null, created_at: '2024-03-16T08:30:00Z', reviewed_at: null, user: { id: '00000000-0000-0000-0000-000000009005', email: 'sunqi@lab.edu', role: 'researcher', display_name: '孙七', lab_id: '00000000-0000-0000-0000-000000008001' } },
  { id: '00000000-0000-0000-0000-000000000056', user_id: '00000000-0000-0000-0000-000000009006', requested_role: 'admin', status: 'pending', reason: '实验室换届，需要管理员权限进行系统配置', reviewed_by: null, created_at: '2024-03-16T11:00:00Z', reviewed_at: null, user: { id: '00000000-0000-0000-0000-000000009006', email: 'zhouba@lab.edu', role: 'equipment_teacher', display_name: '周八', lab_id: '00000000-0000-0000-0000-000000008001' } },
]

export default function AuditPage() {
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    startTransition(async () => {
      const result = await listPermissionRequests('pending')
      if (result.requests && result.requests.length > 0) {
        setRequests(result.requests)
      } else {
        setRequests(MOCK_PENDING)
      }
    })
  }, [])

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setActionLoading(`${action}-${id}`)
    const status: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected'
    startTransition(async () => {
      const result = await reviewPermissionRequest({ id, status })
      if (result.success) {
        setRequests(prev => prev.filter(r => r.id !== id))
        showToast('success', action === 'approve' ? '已通过申请' : '已驳回申请')
      } else {
        showToast('error', result.error || '操作失败')
      }
      setActionLoading(null)
      setConfirmAction(null)
    })
  }

  const handleBatch = (action: 'approve' | 'reject') => {
    if (requests.length === 0) return
    const status: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected'
    startTransition(async () => {
      let allSuccess = true
      for (const req of requests) {
        const result = await reviewPermissionRequest({ id: req.id, status })
        if (!result.success) {
          allSuccess = false
          break
        }
      }
      if (allSuccess) {
        setRequests([])
        showToast('success', `已批量${action === 'approve' ? '通过' : '驳回'}全部申请`)
      } else {
        showToast('error', '部分操作失败，请重试')
        const result = await listPermissionRequests('pending')
        if (result.requests && result.requests.length > 0) {
          setRequests(result.requests)
        }
      }
    })
  }

  return (
    <AppShell>
      <div className="mb-6 relative">
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border',
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {toast.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        <h1 className="page-title mb-4">审批队列</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
            <span className="text-slate-600">待审批: <strong className="text-slate-900">{requests.length}</strong> 条</span>
          </div>
          {requests.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBatch('approve')}
                disabled={isPending}
                className="btn-primary text-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                批量通过
              </button>
              <button
                onClick={() => handleBatch('reject')}
                disabled={isPending}
                className="btn-danger text-sm disabled:opacity-50"
              >
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
                    disabled={actionLoading === `approve-${req.id}`}
                    className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                  >
                    {actionLoading === `approve-${req.id}` ? '处理中...' : '通过'}
                  </button>
                  <button
                    onClick={() => setConfirmAction({ id: req.id, action: 'reject' })}
                    disabled={actionLoading === `reject-${req.id}`}
                    className="btn-danger text-xs px-3 py-1.5 disabled:opacity-50"
                  >
                    {actionLoading === `reject-${req.id}` ? '处理中...' : '驳回'}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">
                {confirmAction.action === 'approve' ? '确认通过' : '确认驳回'}
              </h3>
              <button onClick={() => setConfirmAction(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {confirmAction.action === 'approve' ? '确定通过该权限申请？通过后将赋予对应角色权限。' : '确定驳回该权限申请？驳回后申请人需重新提交。'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={!!actionLoading}
                className="btn-secondary disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => handleAction(confirmAction.id, confirmAction.action)}
                disabled={!!actionLoading}
                className={cn(
                  confirmAction.action === 'approve' ? 'btn-primary' : 'btn-danger',
                  'disabled:opacity-50'
                )}
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
