'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { AlertTriangle, Plus, CheckCircle2, ShieldCheck, Eye, FileText, TrendingUp } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatDate, formatDateTime, riskLevelConfig, userRoleConfig } from '@/lib/config'
import type { RiskLevel } from '@prisma/client'

const schema = z.object({
  supplierId: z.string().min(1, '请选择供应商'),
  title: z.string().min(1, '请输入风险标题'),
  description: z.string().min(1, '请输入风险描述'),
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  sourceType: z.string().min(1, '请输入来源类型'),
  sourceId: z.string().optional(),
  impactAnalysis: z.string().optional(),
  mitigationPlan: z.string().optional(),
})

export default function RiskPage() {
  const utils = useApiUtils()
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const { data: risks = [] } = api.risk.listRisks.useQuery({
    level: levelFilter || undefined,
    supplierId: supplierFilter || undefined,
    resolved: showResolved ? undefined : false,
  })
  const { data: suppliers = [] } = api.procurement.listSuppliers.useQuery({})

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: '',
      title: '',
      description: '',
      level: 'MEDIUM',
      sourceType: 'MANUAL',
      impactAnalysis: '',
      mitigationPlan: '',
    },
  })

  const create = api.risk.createRisk.useMutation({
    onSuccess: async () => {
      await utils.risk.listRisks.invalidate()
      await utils.risk.listBoardEntries.invalidate()
      setCreateOpen(false)
      form.reset()
    },
  })

  const update = api.risk.updateRisk.useMutation({
    onSuccess: async () => {
      await utils.risk.listRisks.invalidate()
      await utils.risk.listBoardEntries.invalidate()
      setViewOpen(false)
      setSelected(null)
    },
  })

  const stats = {
    total: risks.length,
    critical: risks.filter(r => r.level === 'CRITICAL' && !r.resolved).length,
    high: risks.filter(r => r.level === 'HIGH' && !r.resolved).length,
    medium: risks.filter(r => r.level === 'MEDIUM' && !r.resolved).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">供应商风险档案</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            交付差异、付款差异处理结论自动归档，可手动添加风险项
          </p>
        </div>
        <div className="action-group">
          <button onClick={() => setShowResolved(v => !v)} className="btn-secondary">
            {showResolved ? '只看未解决' : '查看全部'}
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 登记风险
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <AlertTriangle className="w-4 h-4" /> 未解决风险
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="card p-5 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-sm text-danger mb-1">
            <TrendingUp className="w-4 h-4" /> 严重级
          </div>
          <div className="text-2xl font-bold text-danger">{stats.critical}</div>
        </div>
        <div className="card p-5 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mb-1">
            <AlertTriangle className="w-4 h-4" /> 高级
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
        </div>
        <div className="card p-5 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-1">
            <Eye className="w-4 h-4" /> 中低级
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.medium + risks.filter(r => r.level === 'LOW' && !r.resolved).length}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="input w-full sm:w-56">
              <option value="">全部供应商</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="input w-full sm:w-40">
              <option value="">全部等级</option>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(l => (
                <option key={l} value={l}>{riskLevelConfig[l].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>等级</th>
                <th>供应商</th>
                <th>标题</th>
                <th>描述</th>
                <th>来源</th>
                <th>处理人</th>
                <th>状态</th>
                <th>记录时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {risks.map(r => (
                <tr key={r.id}>
                  <td><span className={`badge ${riskLevelConfig[r.level].className} font-medium`}>{riskLevelConfig[r.level].label}</span></td>
                  <td className="font-medium">{r.supplier.name}</td>
                  <td className="font-medium">{r.title}</td>
                  <td className="text-sm text-slate-500 dark:text-slate-400 max-w-[220px] truncate">{r.description}</td>
                  <td><span className="badge bg-slate-100 dark:bg-slate-800 text-xs">{r.sourceType}</span></td>
                  <td className="text-sm">{r.creator?.name || '-'}</td>
                  <td>
                    {r.resolved
                      ? <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex gap-1"><CheckCircle2 className="w-3 h-3" />已解决</span>
                      : <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">处理中</span>
                    }
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap text-sm">{formatDate(r.createdAt)}</td>
                  <td>
                    <button onClick={() => { setSelected(r); setViewOpen(true) }} className="btn-secondary py-1.5 px-2.5 text-xs">
                      <Eye className="w-3.5 h-3.5" /> 详情
                    </button>
                  </td>
                </tr>
              ))}
              {risks.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无风险记录
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="登记供应商风险" size="lg">
        <form onSubmit={form.handleSubmit(d => create.mutate({
          ...d,
          level: d.level as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        }))} className="space-y-4">
          <div className="form-grid">
            <div>
              <label className="label">供应商</label>
              <select {...form.register('supplierId')} className="input">
                <option value="">请选择供应商</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">风险等级</label>
              <select {...form.register('level')} className="input">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(l => (
                  <option key={l} value={l}>{riskLevelConfig[l].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">来源类型</label>
              <select {...form.register('sourceType')} className="input">
                <option value="MANUAL">手动登记</option>
                <option value="DELIVERY_DISCREPANCY">交付差异</option>
                <option value="PAYMENT_DISCREPANCY">付款差异</option>
                <option value="QUOTATION">报价异常</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">风险标题</label>
              <input {...form.register('title')} className="input" placeholder="如：交货期延迟超过7天" />
            </div>
            <div className="form-grid-full">
              <label className="label">风险描述</label>
              <textarea {...form.register('description')} className="input min-h-[80px]" rows={3} />
            </div>
            <div className="form-grid-full">
              <label className="label">影响分析（选填）</label>
              <textarea {...form.register('impactAnalysis')} className="input min-h-[60px]" rows={2} />
            </div>
            <div className="form-grid-full">
              <label className="label">缓解措施 / 跟踪计划（选填）</label>
              <textarea {...form.register('mitigationPlan')} className="input min-h-[60px]" rows={2} />
            </div>
          </div>
          <div className="action-group pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? '提交中...' : '确认登记'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={viewOpen} onClose={() => { setViewOpen(false); setSelected(null) }} title="风险详情" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">供应商</div>
                <div className="font-medium">{selected.supplier.name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">风险等级</div>
                <span className={`badge ${riskLevelConfig[selected.level as keyof typeof riskLevelConfig].className} font-medium`}>{riskLevelConfig[selected.level as keyof typeof riskLevelConfig].label}</span>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">来源</div>
                <span className="badge bg-slate-100 dark:bg-slate-700">{selected.sourceType}</span>
              </div>
              <div className="sm:col-span-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">标题</div>
                <div className="font-semibold">{selected.title}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="label">风险描述</div>
              <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">{selected.description}</p>
            </div>
            {selected.impactAnalysis && (
              <div className="space-y-1">
                <div className="label">影响分析</div>
                <p className="text-sm bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg">{selected.impactAnalysis}</p>
              </div>
            )}
            {selected.mitigationPlan && (
              <div className="space-y-1">
                <div className="label">缓解措施</div>
                <p className="text-sm bg-green-50 dark:bg-green-900/10 p-3 rounded-lg">{selected.mitigationPlan}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">创建人</div>
                <div>{selected.creator?.name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">创建时间</div>
                <div>{formatDateTime(selected.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">解决时间</div>
                <div>{formatDateTime(selected.resolvedDate)}</div>
              </div>
            </div>

            <div className="action-group pt-2 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => { setViewOpen(false); setSelected(null) }} className="btn-secondary">关闭</button>
              <button
                type="button"
                onClick={() => update.mutate({ id: selected.id, resolved: !selected.resolved })}
                className={selected.resolved ? 'btn-secondary' : 'btn-success'}
                disabled={update.isPending}
              >
                <CheckCircle2 className="w-4 h-4" />
                {selected.resolved ? '标记为未解决' : '标记为已解决'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
