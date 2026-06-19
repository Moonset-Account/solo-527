'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { FileCheck, Plus, Trash2, Calendar, DollarSign } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDecimal, quoteStatusConfig } from '@/lib/config'

const schema = z.object({
  supplierId: z.string().min(1, '请选择供应商'),
  requirementId: z.string().optional(),
  quoteNumber: z.string().min(1, '请输入报价单号'),
  validUntil: z.string().min(1, '请选择有效期'),
  totalAmount: z.coerce.number().positive('总价必须大于0'),
  deliveryDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  remark: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, '请选择耗材'),
    quantity: z.coerce.number().positive('数量必须大于0'),
    unitPrice: z.coerce.number().positive('单价必须大于0'),
    remark: z.string().optional(),
  })).min(1, '请至少添加一项'),
})

export default function QuotesPage() {
  const utils = useApiUtils()
  const [open, setOpen] = useState(false)
  const [supplierFilter, setSupplierFilter] = useState('')

  const { data: quotes = [] } = api.procurement.listQuotes.useQuery({
    supplierId: supplierFilter || undefined,
  })
  const { data: suppliers = [] } = api.procurement.listSuppliers.useQuery({ status: true })
  const { data: requirements = [] } = api.procurement.listRequirements.useQuery({})
  const { data: items = [] } = api.supply.listItems.useQuery({})

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: '',
      requirementId: '',
      quoteNumber: '',
      validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      totalAmount: 0,
      paymentTerms: '',
      remark: '',
      items: [{ itemId: '', quantity: 1, unitPrice: 0, remark: '' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const create = api.procurement.createQuote.useMutation({
    onSuccess: async () => {
      await utils.procurement.listQuotes.invalidate()
      setOpen(false)
      form.reset()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">供应商报价</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">管理供应商报价单，联动采购需求与提醒规则</p>
        </div>
        <div className="action-group">
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="input w-full sm:w-52">
            <option value="">全部供应商</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 新建报价
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>报价单号</th>
                <th>供应商</th>
                <th>关联需求</th>
                <th>总报价</th>
                <th>有效期至</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id}>
                  <td className="font-mono font-medium">{q.quoteNumber}</td>
                  <td>{q.supplier.name}</td>
                  <td className="text-slate-500 dark:text-slate-400">{q.requirement?.title || '-'}</td>
                  <td className="font-medium text-primary whitespace-nowrap">{formatCurrency(Number(q.totalAmount))}</td>
                  <td className="whitespace-nowrap">{formatDate(q.validUntil)}</td>
                  <td><span className={`badge ${quoteStatusConfig[q.status as keyof typeof quoteStatusConfig].className}`}>{quoteStatusConfig[q.status as keyof typeof quoteStatusConfig].label}</span></td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(q.createdAt)}</td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无报价数据
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新建供应商报价" size="xl">
        <form onSubmit={form.handleSubmit(d => create.mutate({ ...d, validUntil: new Date(d.validUntil) }))} className="space-y-5">
          <div className="form-grid">
            <div>
              <label className="label">供应商</label>
              <select {...form.register('supplierId')} className="input">
                <option value="">请选择供应商</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">报价单号</label>
              <input {...form.register('quoteNumber')} className="input font-mono" placeholder="如：Q-2025-001" />
            </div>
            <div>
              <label className="label">关联采购需求（选填）</label>
              <select {...form.register('requirementId')} className="input">
                <option value="">无</option>
                {requirements.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <div className="relative">
                <label className="label">报价有效期至</label>
                <Calendar className="w-4 h-4 absolute left-3 top-[calc(100%-10px)] text-slate-400" />
                <input type="date" {...form.register('validUntil')} className="input pl-9" />
              </div>
            </div>
            <div>
              <div className="relative">
                <label className="label">报价总金额</label>
                <DollarSign className="w-4 h-4 absolute left-3 top-[calc(100%-10px)] text-slate-400" />
                <input type="number" step="0.01" min="0" {...form.register('totalAmount')} className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">预计交货日期（选填）</label>
              <input type="date" {...form.register('deliveryDate' as any)} className="input" />
            </div>
            <div className="form-grid-full">
              <label className="label">付款条件（选填）</label>
              <input {...form.register('paymentTerms')} className="input" placeholder="如：货到付款 / 月结" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">报价明细</label>
              <button type="button" onClick={() => append({ itemId: '', quantity: 1, unitPrice: 0, remark: '' })} className="btn-secondary text-sm py-1.5">
                <Plus className="w-3.5 h-3.5" /> 新增行
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={f.id} className="grid gap-3 grid-cols-1 sm:grid-cols-12 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="sm:col-span-4">
                    <select {...form.register(`items.${i}.itemId`)} className="input">
                      <option value="">选择耗材</option>
                      {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.specification})</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" step="any" min="0" {...form.register(`items.${i}.quantity`)} className="input" placeholder="数量" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" step="0.01" min="0" {...form.register(`items.${i}.unitPrice`)} className="input" placeholder="单价" />
                  </div>
                  <div className="sm:col-span-3">
                    <input {...form.register(`items.${i}.remark`)} className="input" placeholder="备注" />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="btn w-full justify-center p-2 text-danger border-danger/30 hover:bg-danger/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="action-group pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? '提交中...' : '确认提交'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
