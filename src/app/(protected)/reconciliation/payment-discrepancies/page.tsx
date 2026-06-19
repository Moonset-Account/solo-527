'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { AlertTriangle, Plus, ShieldCheck, Eye, UserCheck, FileWarning } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDateTime, discrepancyStatusConfig, riskLevelConfig } from '@/lib/config'

const createSchema = z.object({
  paymentId: z.string().min(1, '请选择付款单'),
  expectedAmount: z.coerce.number(),
  actualAmount: z.coerce.number(),
  differenceAmount: z.coerce.number(),
  reason: z.string().min(1, '请输入差异原因'),
  coordinatorNote: z.string().optional(),
})

const reviewSchema = z.object({
  status: z.enum(['INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED']),
  reviewNote: z.string().min(1, '请填写审批结论'),
  syncToRiskBoard: z.boolean().default(true),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
})

export default function PaymentDiscrepanciesPage() {
  const utils = useApiUtils()
  const [createOpen, setCreateOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: discrepancies = [] } = api.reconciliation.listPaymentDiscrepancies.useQuery({
    status: statusFilter || undefined,
  })
  const { data: payments = [] } = api.reconciliation.listPaymentSuggestions.useQuery({})

  const createForm = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      paymentId: '',
      expectedAmount: 0,
      actualAmount: 0,
      differenceAmount: 0,
      reason: '',
      coordinatorNote: '',
    },
  })

  const reviewForm = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: 'CONFIRMED',
      reviewNote: '',
      syncToRiskBoard: true,
      riskLevel: 'MEDIUM',
    },
  })

  const create = api.reconciliation.createPaymentDiscrepancy.useMutation({
    onSuccess: async () => {
      await utils.reconciliation.listPaymentDiscrepancies.invalidate()
      setCreateOpen(false)
      createForm.reset()
    },
  })

  const review = api.reconciliation.reviewPaymentDiscrepancy.useMutation({
    onSuccess: async () => {
      await utils.reconciliation.listPaymentDiscrepancies.invalidate()
      await utils.risk.listRisks.invalidate()
      await utils.risk.listBoardEntries.invalidate()
      setReviewOpen(false)
      setSelected(null)
      reviewForm.reset()
    },
  })

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = payments.find(x => x.id === e.target.value)
    if (p) {
      createForm.setValue('paymentId', p.id)
      createForm.setValue('expectedAmount', Number(p.suggestedAmount))
      createForm.setValue('actualAmount', Number(p.suggestedAmount))
      createForm.setValue('differenceAmount', 0)
    }
  }

  const updateDiff = () => {
    const exp = Number(createForm.watch('expectedAmount') || 0)
    const act = Number(createForm.watch('actualAmount') || 0)
    createForm.setValue('differenceAmount', Math.abs(exp - act))
  }

  const stats = {
    open: discrepancies.filter(d => d.status === 'OPEN').length,
    investigating: discrepancies.filter(d => d.status === 'INVESTIGATING').length,
    confirmed: discrepancies.filter(d => d.status === 'CONFIRMED').length,
    synced: discrepancies.filter(d => d.syncedToRiskBoard).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">付款差异处理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">供应商协同员发现差异、提交原因，负责人确认后同步风险看板</p>
        </div>
        <div className="action-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
            <option value="">全部状态</option>
            <option value="OPEN">待处理</option>
            <option value="INVESTIGATING">调查中</option>
            <option value="CONFIRMED">已确认</option>
            <option value="RESOLVED">已解决</option>
            <option value="CLOSED">已关闭</option>
          </select>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 登记差异
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <FileWarning className="w-4 h-4" /> 待处理
          </div>
          <div className="text-2xl font-bold text-danger">{stats.open}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Eye className="w-4 h-4" /> 调查中
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.investigating}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <UserCheck className="w-4 h-4" /> 已确认
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <ShieldCheck className="w-4 h-4" /> 已同步风险
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>供应商</th>
                <th>预期付款</th>
                <th>实际付款</th>
                <th>差异金额</th>
                <th>原因</th>
                <th>状态</th>
                <th>风险同步</th>
                <th>登记时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.map(d => (
                <tr key={d.id}>
                  <td className="font-medium">{d.payment?.supplier?.name || '-'}</td>
                  <td>{formatCurrency(Number(d.expectedAmount))}</td>
                  <td>{formatCurrency(Number(d.actualAmount))}</td>
                  <td className="font-medium text-danger whitespace-nowrap">{formatCurrency(Number(d.differenceAmount))}</td>
                  <td className="text-sm max-w-[180px] truncate" title={d.reason}>{d.reason}</td>
                  <td><span className={`badge ${discrepancyStatusConfig[d.status as keyof typeof discrepancyStatusConfig].className}`}>{discrepancyStatusConfig[d.status as keyof typeof discrepancyStatusConfig].label}</span></td>
                  <td>
                    {d.syncedToRiskBoard ? (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex gap-1">
                        <ShieldCheck className="w-3 h-3" /> 已同步
                      </span>
                    ) : <span className="text-slate-400 text-sm">未同步</span>}
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                  <td>
                    {(d.status === 'OPEN' || d.status === 'INVESTIGATING' || d.status === 'CONFIRMED') && (
                      <button
                        onClick={() => { setSelected(d); setReviewOpen(true) }}
                        className="btn-primary py-1.5 px-2.5 text-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> 审批
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {discrepancies.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无付款差异记录
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="登记付款差异">
        <form onSubmit={createForm.handleSubmit(d => create.mutate(d))} className="space-y-4">
          <div className="form-grid">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">选择付款建议单</label>
              <select {...createForm.register('paymentId')} className="input" onChange={handlePaymentChange}>
                <option value="">请选择付款单</option>
                {payments.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    PAY{String(i + 1).padStart(4, '0')} - {p.supplier.name} ({formatCurrency(Number(p.suggestedAmount))})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">预期付款金额</label>
              <input type="number" step="0.01" {...createForm.register('expectedAmount')} className="input" onChange={updateDiff} />
            </div>
            <div>
              <label className="label">实际付款金额</label>
              <input type="number" step="0.01" {...createForm.register('actualAmount')} className="input" onChange={updateDiff} onBlur={updateDiff} />
            </div>
            <div>
              <label className="label">差异金额（自动）</label>
              <input type="number" step="0.01" {...createForm.register('differenceAmount')} className="input font-medium text-danger bg-red-50 dark:bg-red-900/10" readOnly />
            </div>
            <div className="form-grid-full">
              <label className="label">差异原因描述</label>
              <textarea {...createForm.register('reason')} className="input min-h-[80px]" rows={3} placeholder="请详细描述付款差异原因，如：发票信息错误、扣减质量罚款、部分退货等..." />
              {createForm.formState.errors.reason && <p className="text-sm text-danger mt-1">{createForm.formState.errors.reason.message}</p>}
            </div>
            <div className="form-grid-full">
              <label className="label">协同员备注（选填）</label>
              <textarea {...createForm.register('coordinatorNote')} className="input min-h-[60px]" rows={2} placeholder="协同员补充说明..." />
            </div>
          </div>
          <div className="action-group pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? '提交中...' : '提交差异'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={reviewOpen} onClose={() => { setReviewOpen(false); setSelected(null) }} title="付款差异审批" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 sm:grid-cols-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">供应商</div>
                <div className="font-medium">{selected.payment?.supplier?.name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">差异金额</div>
                <div className="font-bold text-danger text-lg">{formatCurrency(Number(selected.differenceAmount))}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">当前状态</div>
                <span className={`badge ${discrepancyStatusConfig[selected.status as keyof typeof discrepancyStatusConfig].className}`}>{discrepancyStatusConfig[selected.status as keyof typeof discrepancyStatusConfig].label}</span>
              </div>
              <div className="sm:col-span-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">差异原因</div>
                <p className="text-sm">{selected.reason}</p>
              </div>
              {selected.coordinatorNote && (
                <div className="sm:col-span-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">协同员备注</div>
                  <p className="text-sm">{selected.coordinatorNote}</p>
                </div>
              )}
            </div>

            <form onSubmit={reviewForm.handleSubmit(d => review.mutate({ id: selected.id, status: d.status as 'RESOLVED'|'INVESTIGATING'|'CONFIRMED'|'CLOSED', reviewNote: d.reviewNote, syncToRiskBoard: d.syncToRiskBoard, riskLevel: d.riskLevel as 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' }))} className="space-y-4">
              <div className="form-grid">
                <div>
                  <label className="label">审批后状态</label>
                  <select {...reviewForm.register('status')} className="input">
                    <option value="INVESTIGATING">调查中</option>
                    <option value="CONFIRMED">确认差异</option>
                    <option value="RESOLVED">已解决</option>
                    <option value="CLOSED">关闭</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...reviewForm.register('syncToRiskBoard')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm font-medium">同步到供应商风险看板</span>
                  </label>
                </div>
                {reviewForm.watch('syncToRiskBoard') && (
                  <div>
                    <label className="label">风险等级</label>
                    <select {...reviewForm.register('riskLevel')} className="input">
                      {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(l => (
                        <option key={l} value={l}>{riskLevelConfig[l as keyof typeof riskLevelConfig].label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="label">审批结论 / 意见</label>
                <textarea {...reviewForm.register('reviewNote')} className="input min-h-[100px]" rows={4} placeholder="请填写详细审批意见，该内容将同步至供应商风险档案..." />
                {reviewForm.formState.errors.reviewNote && <p className="text-sm text-danger mt-1">{reviewForm.formState.errors.reviewNote.message}</p>}
              </div>
              <div className="action-group pt-2">
                <button type="button" onClick={() => { setReviewOpen(false); setSelected(null) }} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary" disabled={review.isPending}>
                  <ShieldCheck className="w-4 h-4" />
                  {review.isPending ? '提交中...' : '确认审批'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
