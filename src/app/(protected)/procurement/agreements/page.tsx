'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { Handshake, Plus, Trash2, Calendar, DollarSign } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDecimal, agreementStatusConfig } from '@/lib/config'

const schema = z.object({
  supplierId: z.string().min(1, '请选择供应商'),
  agreementNumber: z.string().min(1, '请输入协议编号'),
  title: z.string().min(1, '请输入协议标题'),
  startDate: z.string().min(1, '请选择生效日期'),
  endDate: z.string().min(1, '请选择到期日期'),
  totalAmount: z.coerce.number().positive('总金额必须大于0'),
  paymentTerms: z.string().min(1, '请输入付款条件'),
  termsConditions: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, '请选择耗材'),
    unitPrice: z.coerce.number().positive('单价必须大于0'),
    minOrderQuantity: z.coerce.number().int().positive('最小起订量必须大于0'),
    maxOrderQuantity: z.coerce.number().int().positive().optional(),
    leadTimeDays: z.coerce.number().int().positive('交货期必须大于0'),
  })).min(1, '请至少添加一项耗材'),
})

export default function AgreementsPage() {
  const utils = useApiUtils()
  const [open, setOpen] = useState(false)
  const [supplierFilter, setSupplierFilter] = useState('')

  const { data: agreements = [] } = api.procurement.listAgreements.useQuery({
    supplierId: supplierFilter || undefined,
  })
  const { data: suppliers = [] } = api.procurement.listSuppliers.useQuery({ status: true })
  const { data: items = [] } = api.supply.listItems.useQuery({})

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: '',
      agreementNumber: '',
      title: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      totalAmount: 0,
      paymentTerms: '月结30天',
      termsConditions: '',
      items: [{ itemId: '', unitPrice: 0, minOrderQuantity: 1, leadTimeDays: 7 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const create = api.procurement.createAgreement.useMutation({
    onSuccess: async () => {
      await utils.procurement.listAgreements.invalidate()
      setOpen(false)
      form.reset()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">框架协议</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">维护与供应商签署的框架采购协议</p>
        </div>
        <div className="action-group">
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="input w-full sm:w-52">
            <option value="">全部供应商</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 新建协议
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>协议编号</th>
                <th>标题</th>
                <th>供应商</th>
                <th>有效期</th>
                <th>协议总金额</th>
                <th>付款条件</th>
                <th>耗材项数</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map(a => (
                <tr key={a.id}>
                  <td className="font-mono font-medium">{a.agreementNumber}</td>
                  <td className="font-medium">{a.title}</td>
                  <td>{a.supplier.name}</td>
                  <td className="whitespace-nowrap text-sm">
                    {formatDate(a.startDate)}<br />
                    <span className="text-slate-400">至 {formatDate(a.endDate)}</span>
                  </td>
                  <td className="font-medium text-primary whitespace-nowrap">{formatCurrency(Number(a.totalAmount))}</td>
                  <td className="text-sm max-w-[180px] truncate" title={a.paymentTerms}>{a.paymentTerms}</td>
                  <td className="text-center">{a.items.length}</td>
                  <td><span className={`badge ${agreementStatusConfig[a.status as keyof typeof agreementStatusConfig].className}`}>{agreementStatusConfig[a.status as keyof typeof agreementStatusConfig].label}</span></td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
              {agreements.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Handshake className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无框架协议
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新建框架协议" size="xl">
        <form onSubmit={form.handleSubmit(d => create.mutate({ ...d, startDate: new Date(d.startDate), endDate: new Date(d.endDate) }))} className="space-y-5">
          <div className="form-grid">
            <div>
              <label className="label">供应商</label>
              <select {...form.register('supplierId')} className="input">
                <option value="">请选择供应商</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {form.formState.errors.supplierId && <p className="text-sm text-danger mt-1">{form.formState.errors.supplierId.message}</p>}
            </div>
            <div>
              <label className="label">协议编号</label>
              <input {...form.register('agreementNumber')} className="input font-mono" placeholder="如：FA-2025-001" />
              {form.formState.errors.agreementNumber && <p className="text-sm text-danger mt-1">{form.formState.errors.agreementNumber.message}</p>}
            </div>
            <div>
              <label className="label">协议总金额</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" step="0.01" min="0" {...form.register('totalAmount')} className="input pl-9" />
              </div>
              {form.formState.errors.totalAmount && <p className="text-sm text-danger mt-1">{form.formState.errors.totalAmount.message}</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">协议标题</label>
              <input {...form.register('title')} className="input" placeholder="如：2025年度办公耗材框架采购协议" />
              {form.formState.errors.title && <p className="text-sm text-danger mt-1">{form.formState.errors.title.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">生效日期 ~ 到期日期</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" {...form.register('startDate')} className="input pl-9" />
                </div>
                <div className="relative flex-1">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" {...form.register('endDate')} className="input pl-9" />
                </div>
              </div>
            </div>
            <div>
              <label className="label">付款条件</label>
              <input {...form.register('paymentTerms')} className="input" placeholder="如：月结30天" />
              {form.formState.errors.paymentTerms && <p className="text-sm text-danger mt-1">{form.formState.errors.paymentTerms.message}</p>}
            </div>
            <div className="form-grid-full">
              <label className="label">其他条款（选填）</label>
              <textarea {...form.register('termsConditions')} className="input min-h-[60px]" rows={2} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">协议耗材清单（单价/最小起订/交货期）</label>
              <button type="button" onClick={() => append({ itemId: '', unitPrice: 0, minOrderQuantity: 1, leadTimeDays: 7 })} className="btn-secondary text-sm py-1.5">
                <Plus className="w-3.5 h-3.5" /> 新增耗材
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
                    <input type="number" step="0.01" min="0" {...form.register(`items.${i}.unitPrice`)} className="input" placeholder="协议单价" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" step="1" min="1" {...form.register(`items.${i}.minOrderQuantity`)} className="input" placeholder="最小起订" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" step="1" min="1" {...form.register(`items.${i}.leadTimeDays`)} className="input" placeholder="交货期(天)" />
                  </div>
                  <div className="sm:col-span-1">
                    <input type="number" step="1" min="1" {...form.register(`items.${i}.maxOrderQuantity` as any)} className="input" placeholder="最大量" />
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
              {create.isPending ? '提交中...' : '确认创建'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
