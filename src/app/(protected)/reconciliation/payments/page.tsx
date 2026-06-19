'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { Wallet, Plus, CheckCircle2, AlertTriangle, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, paymentStatusConfig } from '@/lib/config'

const schema = z.object({
  reconciliationId: z.string().min(1, '请选择对账单'),
  supplierId: z.string().min(1, '请选择供应商'),
  suggestedAmount: z.coerce.number().positive('金额必须大于0'),
  paymentDueDate: z.string().min(1, '请选择付款到期日'),
  remark: z.string().optional(),
})

export default function PaymentsPage() {
  const utils = useApiUtils()
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: payments = [] } = api.reconciliation.listPaymentSuggestions.useQuery({
    status: statusFilter || undefined,
  })
  const { data: reconciliations = [] } = api.reconciliation.listReconciliationsAvailableForPayment.useQuery()
  const { data: suppliers = [] } = api.procurement.listSuppliers.useQuery({})

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      reconciliationId: '',
      supplierId: '',
      suggestedAmount: 0,
      paymentDueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      remark: '',
    },
  })

  const create = api.reconciliation.createPaymentSuggestion.useMutation({
    onSuccess: async () => {
      await utils.reconciliation.listPaymentSuggestions.invalidate()
      setCreateOpen(false)
      form.reset()
    },
  })

  const approve = api.reconciliation.approvePayment.useMutation({
    onSuccess: async () => {
      await utils.reconciliation.listPaymentSuggestions.invalidate()
      await utils.reconciliation.listReconciliations.invalidate()
    },
  })

  const handleReconciliationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const r = reconciliations.find(x => x.id === e.target.value)
    if (r) {
      form.setValue('reconciliationId', r.id)
      form.setValue('supplierId', r.delivery.supplierId)
      form.setValue('suggestedAmount', Math.min(Number(r.actualAmount), Number(r.expectedAmount)))
    }
  }

  const totalPending = payments.filter(p => p.status === 'RECOMMENDED').reduce((s, p) => s + Number(p.suggestedAmount), 0)
  const totalApproved = payments.filter(p => p.status === 'APPROVED' || p.status === 'PAID').reduce((s, p) => s + Number(p.suggestedAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">付款建议</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">基于对账结果生成付款建议，负责人审批</p>
        </div>
        <div className="action-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
            <option value="">全部状态</option>
            <option value="PENDING">待建议</option>
            <option value="RECOMMENDED">建议中</option>
            <option value="APPROVED">已批准</option>
            <option value="PAID">已支付</option>
            <option value="DISPUTED">有争议</option>
          </select>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 新建付款建议
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">建议总数</div>
          <div className="text-2xl font-bold">{payments.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">待审批</div>
          <div className="text-2xl font-bold text-amber-600">{payments.filter(p => p.status === 'RECOMMENDED').length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">待审批金额</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalPending)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">已批准金额</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>建议编号</th>
                <th>供应商</th>
                <th>关联对账</th>
                <th>建议付款</th>
                <th>付款到期日</th>
                <th>状态</th>
                <th>审批人</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id}>
                  <td className="font-mono font-medium">PAY{String(i + 1).padStart(4, '0')}</td>
                  <td className="font-medium">{p.supplier.name}</td>
                  <td className="font-mono text-xs text-slate-500">{p.reconciliation.period}</td>
                  <td className="font-medium text-primary whitespace-nowrap">{formatCurrency(Number(p.suggestedAmount))}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(p.paymentDueDate)}
                    </div>
                  </td>
                  <td><span className={`badge ${paymentStatusConfig[p.status as keyof typeof paymentStatusConfig].className}`}>{paymentStatusConfig[p.status as keyof typeof paymentStatusConfig].label}</span></td>
                  <td className="text-slate-500 dark:text-slate-400">{p.approver?.name || '-'}</td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td>
                    {p.status === 'RECOMMENDED' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => approve.mutate({ id: p.id, status: 'APPROVED' as 'APPROVED'|'DISPUTED' })}
                          disabled={approve.isPending}
                          className="btn-success py-1.5 px-2.5 text-xs"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> 通过
                        </button>
                        <button
                          onClick={() => approve.mutate({ id: p.id, status: 'DISPUTED' as 'APPROVED'|'DISPUTED' })}
                          disabled={approve.isPending}
                          className="btn-danger py-1.5 px-2.5 text-xs"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> 争议
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无付款建议
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建付款建议">
        <form onSubmit={form.handleSubmit(d => create.mutate({ ...d, paymentDueDate: new Date(d.paymentDueDate) }))} className="space-y-4">
          <div className="form-grid">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">选择对账单</label>
              <select {...form.register('reconciliationId')} className="input" onChange={handleReconciliationChange}>
                <option value="">请选择对账单</option>
                {reconciliations.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.period} - {r.delivery.supplier.name} (实际 {formatCurrency(Number(r.actualAmount))})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">供应商（自动）</label>
              <select {...form.register('supplierId')} className="input opacity-70" disabled>
                <option value="">自动选择</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">建议付款金额</label>
              <input type="number" step="0.01" min="0" {...form.register('suggestedAmount')} className="input" />
            </div>
            <div>
              <label className="label">付款到期日</label>
              <input type="date" {...form.register('paymentDueDate')} className="input" />
            </div>
            <div className="form-grid-full">
              <label className="label">备注（选填）</label>
              <textarea {...form.register('remark')} className="input min-h-[80px]" rows={3} />
            </div>
          </div>
          <div className="action-group pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? '提交中...' : '提交建议'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
