'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { Truck, Plus, Trash2, Calendar, CheckCircle2, XCircle, FileText } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDecimal } from '@/lib/config'

const schema = z.object({
  supplierId: z.string().min(1, '请选择供应商'),
  deliveryNumber: z.string().min(1, '请输入交货单号'),
  deliveryDate: z.string().min(1, '请选择交货日期'),
  receivedDate: z.string().optional(),
  totalAmount: z.coerce.number().positive('总金额必须大于0'),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  remark: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, '请选择耗材'),
    quantity: z.coerce.number().positive('数量必须大于0'),
    unitPrice: z.coerce.number().positive('单价必须大于0'),
    batchNumber: z.string().optional(),
    expireDate: z.string().optional(),
    qualified: z.boolean().default(true),
    remark: z.string().optional(),
  })).min(1, '请至少添加一项'),
})

export default function DeliveriesPage() {
  const utils = useApiUtils()
  const [open, setOpen] = useState(false)
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const { data: deliveries = [] } = api.procurement.listDeliveries.useQuery({
    supplierId: supplierFilter || undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
  })
  const { data: suppliers = [] } = api.procurement.listSuppliers.useQuery({ status: true })
  const { data: items = [] } = api.supply.listItems.useQuery({})

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: '',
      deliveryNumber: '',
      deliveryDate: new Date().toISOString().slice(0, 10),
      receivedDate: '',
      totalAmount: 0,
      invoiceNumber: '',
      invoiceDate: '',
      remark: '',
      items: [{ itemId: '', quantity: 1, unitPrice: 0, qualified: true, remark: '' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const create = api.procurement.createDelivery.useMutation({
    onSuccess: async () => {
      await utils.procurement.listDeliveries.invalidate()
      setOpen(false)
      form.reset()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">交付管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">供应商送货记录、发票信息，联动提醒规则</p>
        </div>
        <div className="action-group">
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 登记交付
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="input w-full sm:w-52">
            <option value="">全部供应商</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex gap-2 items-center">
            <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="input w-full sm:w-44" />
            <span className="text-slate-400 hidden sm:inline">至</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="input w-full sm:w-44" />
          </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>交货单号</th>
                <th>供应商</th>
                <th>交货日期</th>
                <th>收料日期</th>
                <th>发票号</th>
                <th>总金额</th>
                <th>对账状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td className="font-mono font-medium">{d.deliveryNumber}</td>
                  <td>{d.supplier.name}</td>
                  <td className="whitespace-nowrap">{formatDate(d.deliveryDate)}</td>
                  <td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(d.receivedDate)}</td>
                  <td className="font-mono text-sm">{d.invoiceNumber || '-'}</td>
                  <td className="font-medium text-primary whitespace-nowrap">{formatCurrency(Number(d.totalAmount))}</td>
                  <td>
                    {d.reconciliations && d.reconciliations.length > 0 ? (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 已对账
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex gap-1">
                      <FileText className="w-3 h-3" /> 待对账
                    </span>
                  )}
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无交付记录
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="登记供应商交付" size="xl">
        <form onSubmit={form.handleSubmit(d => create.mutate({ ...d, deliveryDate: new Date(d.deliveryDate), receivedDate: d.receivedDate ? new Date(d.receivedDate) : undefined, invoiceDate: d.invoiceDate ? new Date(d.invoiceDate) : undefined }))} className="space-y-5">
          <div className="form-grid">
            <div>
              <label className="label">供应商</label>
              <select {...form.register('supplierId')} className="input">
                <option value="">请选择供应商</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">交货单号</label>
              <input {...form.register('deliveryNumber')} className="input font-mono" placeholder="如：DN-2025-001" />
            </div>
            <div>
              <label className="label">交货日期</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" {...form.register('deliveryDate')} className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">收料日期（选填）</label>
              <input type="date" {...form.register('receivedDate')} className="input" />
            </div>
            <div>
              <label className="label">发票号（选填）</label>
              <input {...form.register('invoiceNumber')} className="input font-mono" />
            </div>
            <div>
              <label className="label">开票日期（选填）</label>
              <input type="date" {...form.register('invoiceDate')} className="input" />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="relative">
                <label className="label">交付总金额</label>
                <span className="absolute left-3 top-[calc(100%-10px)] text-slate-400">¥</span>
                <input type="number" step="0.01" min="0" {...form.register('totalAmount')} className="input pl-8" />
              </div>
            </div>
            <div className="form-grid-full">
              <label className="label">备注（选填）</label>
              <textarea {...form.register('remark')} className="input min-h-[60px]" rows={2} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">交付明细</label>
              <button type="button" onClick={() => append({ itemId: '', quantity: 1, unitPrice: 0, qualified: true, remark: '' })} className="btn-secondary text-sm py-1.5">
                <Plus className="w-3.5 h-3.5" /> 新增行
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={f.id} className="grid gap-3 grid-cols-1 sm:grid-cols-12 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="sm:col-span-3">
                    <select {...form.register(`items.${i}.itemId`)} className="input">
                      <option value="">选择耗材</option>
                      {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-1.5">
                    <input type="number" step="any" min="0" {...form.register(`items.${i}.quantity`)} className="input" placeholder="数量" />
                  </div>
                  <div className="sm:col-span-1.5">
                    <input type="number" step="0.01" min="0" {...form.register(`items.${i}.unitPrice`)} className="input" placeholder="单价" />
                  </div>
                  <div className="sm:col-span-2">
                    <input {...form.register(`items.${i}.batchNumber` as any)} className="input" placeholder="批号" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="date" {...form.register(`items.${i}.expireDate` as any)} className="input" placeholder="效期" />
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-center pt-6">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" {...form.register(`items.${i}.qualified`)} className="w-4 h-4 accent-primary" defaultChecked />
                      <span className="text-xs">合格</span>
                    </label>
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
              {create.isPending ? '提交中...' : '确认登记'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
