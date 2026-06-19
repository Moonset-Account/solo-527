'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { ClipboardList, Plus, AlertTriangle, CheckCircle2, Wallet, FileText, Eye, XCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDecimal, reconciliationStatusConfig, discrepancyStatusConfig, discrepancyTypeLabels, riskLevelConfig } from '@/lib/config'

const schema = z.object({
  deliveryId: z.string().min(1, '请选择交付单'),
  period: z.string().regex(/^\d{4}-\d{2}$/, '请选择对账月份'),
  expectedAmount: z.coerce.number(),
  actualAmount: z.coerce.number(),
  differenceNote: z.string().optional(),
  remark: z.string().optional(),
})

const resolveSchema = z.object({
  status: z.enum(['INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED']),
  resolution: z.string().optional(),
  createRisk: z.boolean().default(false),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
})

export default function ReconciliationPage() {
  const utils = useApiUtils()
  const [createOpen, setCreateOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [selectedDisc, setSelectedDisc] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: reconciliations = [] } = api.reconciliation.listReconciliations.useQuery({
    status: statusFilter || undefined,
  })
  const { data: deliveries = [] } = api.procurement.listDeliveries.useQuery({})

  const unresolvedDeliveries = deliveries.filter(d => !d.reconciliations || d.reconciliations.length === 0)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryId: '',
      period: new Date().toISOString().slice(0, 7),
      expectedAmount: 0,
      actualAmount: 0,
      remark: '',
    },
  })

  const resolveForm = useForm({
    resolver: zodResolver(resolveSchema),
    defaultValues: { status: 'INVESTIGATING', resolution: '', createRisk: true, riskLevel: 'MEDIUM' },
  })

  const create = api.reconciliation.createReconciliation.useMutation({
    onSuccess: async () => {
      await utils.reconciliation.listReconciliations.invalidate()
      setCreateOpen(false)
      form.reset()
    },
  })

  const resolve = api.reconciliation.resolveDiscrepancy.useMutation({
    onSuccess: async () => {
      await utils.reconciliation.listReconciliations.invalidate()
      await utils.risk.listRisks.invalidate()
      await utils.risk.listBoardEntries.invalidate()
      setResolveOpen(false)
      setSelectedDisc(null)
      resolveForm.reset()
    },
  })

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = deliveries.find(x => x.id === e.target.value)
    if (d) {
      form.setValue('deliveryId', d.id)
      form.setValue('expectedAmount', Number(d.totalAmount))
      form.setValue('actualAmount', Number(d.totalAmount))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">对账处理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">对账匹配、差异处理、生成付款建议</p>
        </div>
        <div className="action-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
            <option value="">全部状态</option>
            <option value="PENDING">待处理</option>
            <option value="MATCHED">已匹配</option>
            <option value="DISCREPANCY">有差异</option>
            <option value="RESOLVED">已解决</option>
          </select>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 新建对账
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">对账记录</div>
          <div className="text-2xl font-bold">{reconciliations.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">已匹配</div>
          <div className="text-2xl font-bold text-green-600">{reconciliations.filter(r => r.status === 'MATCHED').length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">有差异</div>
          <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
            {reconciliations.filter(r => r.status === 'DISCREPANCY').length}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">待对账交付</div>
          <div className="text-2xl font-bold text-amber-600">{unresolvedDeliveries.length}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>对账月份</th>
                <th>供应商</th>
                <th>交货单号</th>
                <th>预期金额</th>
                <th>实际金额</th>
                <th>差异金额</th>
                <th>状态</th>
                <th>差异提醒</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map(r => (
                <tr key={r.id}>
                  <td><span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-mono">{r.period}</span></td>
                  <td className="font-medium">{r.delivery.supplier.name}</td>
                  <td className="font-mono">{r.delivery.deliveryNumber}</td>
                  <td>{formatCurrency(Number(r.expectedAmount))}</td>
                  <td>{formatCurrency(Number(r.actualAmount))}</td>
                  <td className={Number(r.differenceAmount) > 0 ? 'text-danger font-medium' : 'text-slate-500 dark:text-slate-400'}>
                    {Number(r.differenceAmount) > 0 ? formatCurrency(Number(r.differenceAmount)) : '-'}
                  </td>
                  <td><span className={`badge ${reconciliationStatusConfig[r.status as keyof typeof reconciliationStatusConfig].className}`}>{reconciliationStatusConfig[r.status as keyof typeof reconciliationStatusConfig].label}</span></td>
                  <td>
                    {r.discrepancies && r.discrepancies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {r.discrepancies.map(d => (
                          <button
                            key={d.id}
                            onClick={() => { setSelectedDisc(d); setResolveOpen(true) }}
                            className={`badge hover:ring-2 ${discrepancyStatusConfig[d.status as keyof typeof discrepancyStatusConfig].className}`}
                          >
                            {discrepancyTypeLabels[d.type as keyof typeof discrepancyTypeLabels] || d.type}
                          </button>
                        ))}
                      </div>
                    ) : <span className="text-slate-400 text-sm">-</span>}
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {reconciliations.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无对账记录
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建对账单" size="lg">
        <form onSubmit={form.handleSubmit(d => create.mutate(d))} className="space-y-4">
          <div className="form-grid">
            <div>
              <label className="label">选择交付单</label>
              <select {...form.register('deliveryId')} className="input" onChange={handleDeliveryChange}>
                <option value="">请选择交付单</option>
                {deliveries.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.deliveryNumber} - {d.supplier.name} ({formatCurrency(Number(d.totalAmount))})
                    {d.reconciliations?.length ? ' [已对账]' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">对账月份</label>
              <input type="month" {...form.register('period')} className="input" />
            </div>
            <div>
              <label className="label">预期金额</label>
              <input type="number" step="0.01" {...form.register('expectedAmount')} className="input" />
            </div>
            <div>
              <label className="label">实际金额</label>
              <input type="number" step="0.01" {...form.register('actualAmount')} className="input" />
            </div>
            <div className="form-grid-full">
              <label className="label">差异说明（选填）</label>
              <textarea {...(form.register as any)('differenceNote')} className="input min-h-[60px]" rows={2} />
            </div>
            <div className="form-grid-full">
              <label className="label">备注（选填）</label>
              <textarea {...form.register('remark')} className="input min-h-[60px]" rows={2} />
            </div>
          </div>
          <div className="action-group pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? '提交中...' : '确认对账'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={resolveOpen} onClose={() => { setResolveOpen(false); setSelectedDisc(null) }} title="处理交付差异">
        {selectedDisc && (
          <div className="space-y-5">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-danger mb-1">
                    {discrepancyTypeLabels[selectedDisc.type as keyof typeof discrepancyTypeLabels] || selectedDisc.type}
                    <span className={`badge ml-2 ${discrepancyStatusConfig[selectedDisc.status as keyof typeof discrepancyStatusConfig].className}`}>
                      {discrepancyStatusConfig[selectedDisc.status as keyof typeof discrepancyStatusConfig].label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedDisc.description}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>预期: <b>{selectedDisc.expectedValue}</b></span>
                    <span>实际: <b>{selectedDisc.actualValue}</b></span>
                    {selectedDisc.impactAmount && <span>影响金额: <b className="text-danger">{formatCurrency(Number(selectedDisc.impactAmount))}</b></span>}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={resolveForm.handleSubmit(d => resolve.mutate({ id: selectedDisc.id, status: d.status as 'RESOLVED'|'INVESTIGATING'|'CONFIRMED'|'CLOSED', resolution: d.resolution, createRisk: d.createRisk, riskLevel: d.riskLevel as 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'|undefined }))} className="space-y-4">
              <div className="form-grid">
                <div>
                  <label className="label">处理状态</label>
                  <select {...resolveForm.register('status')} className="input">
                    <option value="INVESTIGATING">调查中</option>
                    <option value="CONFIRMED">已确认</option>
                    <option value="RESOLVED">已解决</option>
                    <option value="CLOSED">已关闭</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...resolveForm.register('createRisk')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm">同步到供应商风险</span>
                  </label>
                </div>
                {resolveForm.watch('createRisk') && (
                  <div>
                    <label className="label">风险等级</label>
                    <select {...resolveForm.register('riskLevel')} className="input">
                      <option value="LOW">低</option>
                      <option value="MEDIUM">中</option>
                      <option value="HIGH">高</option>
                      <option value="CRITICAL">严重</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="label">处理方案 / 结论</label>
                <textarea {...resolveForm.register('resolution')} className="input min-h-[100px]" rows={4} placeholder="请描述处理方案和结论，该结论将进入供应商风险档案..." />
              </div>
              <div className="action-group pt-2">
                <button type="button" onClick={() => { setResolveOpen(false); setSelectedDisc(null) }} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary" disabled={resolve.isPending}>
                  {resolve.isPending ? '提交中...' : '确认处理'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
