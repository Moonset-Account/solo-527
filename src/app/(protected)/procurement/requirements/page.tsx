'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { FileText, Plus, Trash2, Calendar, User, Package } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDecimal, requirementStatusConfig } from '@/lib/config'

const schema = z.object({
  title: z.string().min(1, '请输入需求标题'),
  department: z.string().min(1, '请输入部门'),
  requiredDate: z.string().min(1, '请选择需求日期'),
  priority: z.coerce.number().int().min(1).max(5),
  remark: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, '请选择耗材'),
    quantity: z.coerce.number().positive('数量必须大于0'),
    expectedPrice: z.coerce.number().positive().optional(),
    remark: z.string().optional(),
  })).min(1, '请至少添加一项耗材'),
})

type FormValues = z.infer<typeof schema>

export default function RequirementsPage() {
  const utils = useApiUtils()
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: requirements = [] } = api.procurement.listRequirements.useQuery({
    status: statusFilter || undefined,
  })
  const { data: items = [] } = api.supply.listItems.useQuery({})

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      department: '',
      requiredDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      priority: 3,
      remark: '',
      items: [{ itemId: '', quantity: 1, remark: '' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const create = api.procurement.createRequirement.useMutation({
    onSuccess: async () => {
      await utils.procurement.listRequirements.invalidate()
      setOpen(false)
      form.reset()
    },
  })

  const totalExpected = (r: any) =>
    r.items.reduce((s: number, it: any) => s + (it.expectedPrice ? Number(it.expectedPrice) * Number(it.quantity) : 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">采购需求</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">员工提交采购需求，驱动后续报价与采购</p>
        </div>
        <div className="action-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-44">
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="SUBMITTED">已提交</option>
            <option value="APPROVED">已批准</option>
            <option value="FULFILLED">已完成</option>
            <option value="CANCELLED">已取消</option>
          </select>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 新建需求
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>需求单号</th>
                <th>标题</th>
                <th>申请人</th>
                <th>部门</th>
                <th>优先级</th>
                <th>需求日期</th>
                <th>耗材项数</th>
                <th>预估金额</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r, idx) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-slate-500 dark:text-slate-400">PR{String(idx + 1).padStart(4, '0')}</td>
                  <td className="font-medium">{r.title}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {r.user?.name?.[0] || 'U'}
                      </div>
                      <span>{r.user?.name}</span>
                    </div>
                  </td>
                  <td>{r.department}</td>
                  <td>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={`w-4 h-4 rounded-sm ${n <= r.priority ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(r.requiredDate)}</td>
                  <td className="text-center">{r.items.length}</td>
                  <td className="font-medium text-primary">{formatCurrency(totalExpected(r))}</td>
                  <td><span className={`badge ${requirementStatusConfig[r.status as keyof typeof requirementStatusConfig].className}`}>{requirementStatusConfig[r.status as keyof typeof requirementStatusConfig].label}</span></td>
                  <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {requirements.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无采购需求
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新建采购需求" size="xl">
        <form onSubmit={form.handleSubmit((d) => create.mutate({ ...d, requiredDate: new Date(d.requiredDate) }))} className="space-y-5">
          <div className="form-grid">
            <div className="sm:col-span-2">
              <label className="label">需求标题</label>
              <input {...form.register('title')} className="input" placeholder="如：Q3季度办公文具采购" />
              {form.formState.errors.title && <p className="text-sm text-danger mt-1">{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <label className="label">部门</label>
              <input {...form.register('department')} className="input" placeholder="如：行政部" />
              {form.formState.errors.department && <p className="text-sm text-danger mt-1">{form.formState.errors.department.message}</p>}
            </div>
            <div>
              <label className="label">需求日期</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" {...form.register('requiredDate')} className="input pl-9" />
              </div>
              {form.formState.errors.requiredDate && <p className="text-sm text-danger mt-1">{form.formState.errors.requiredDate.message}</p>}
            </div>
            <div>
              <label className="label">优先级（1-5）</label>
              <input type="range" min="1" max="5" {...form.register('priority')} className="w-full h-10 accent-primary" />
              <div className="text-sm text-center text-primary font-medium">{form.watch('priority')} 级</div>
            </div>
            <div className="form-grid-full">
              <label className="label">备注（选填）</label>
              <textarea {...form.register('remark')} className="input min-h-[60px]" rows={2} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">需求明细</label>
              <button type="button" onClick={() => append({ itemId: '', quantity: 1, remark: '' })} className="btn-secondary text-sm py-1.5">
                <Plus className="w-3.5 h-3.5" /> 新增行
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={f.id} className="grid gap-3 grid-cols-1 sm:grid-cols-12 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="sm:col-span-5">
                    <select {...form.register(`items.${i}.itemId`)} className="input">
                      <option value="">选择耗材</option>
                      {items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.specification})</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" step="any" min="0" {...form.register(`items.${i}.quantity`)} className="input" placeholder="数量" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" step="0.01" min="0" {...form.register(`items.${i}.expectedPrice`)} className="input" placeholder="预估单价" />
                  </div>
                  <div className="sm:col-span-2">
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
            {form.formState.errors.items && <p className="text-sm text-danger mt-1">{form.formState.errors.items.message}</p>}
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
