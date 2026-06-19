'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { ClipboardList, Plus, Trash2, Search, Calendar, DollarSign } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDecimal } from '@/lib/config'

const schema = z.object({
  itemId: z.string().min(1, '请选择耗材'),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, '请选择正确的月份'),
  quantity: z.coerce.number().positive('数量必须大于0'),
  actualCost: z.coerce.number().positive('金额必须大于0').optional(),
  remark: z.string().optional(),
})

export default function MonthlyUsagePage() {
  const utils = useApiUtils()
  const [open, setOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [search, setSearch] = useState('')

  const { data: usages = [] } = api.supply.listMonthlyUsages.useQuery({
    yearMonth: filterMonth || undefined,
  })
  const { data: items = [] } = api.supply.listItems.useQuery({})

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: '',
      yearMonth: new Date().toISOString().slice(0, 7),
      quantity: 1,
      remark: '',
    },
  })

  const create = api.supply.createMonthlyUsage.useMutation({
    onSuccess: async () => {
      await utils.supply.listMonthlyUsages.invalidate()
      setOpen(false)
      form.reset()
    },
  })
  const del = api.supply.deleteMonthlyUsage.useMutation({
    onSuccess: async () => await utils.supply.listMonthlyUsages.invalidate(),
  })

  const filteredUsages = usages.filter(u => 
    !search || 
    u.item.name.includes(search) || 
    u.item.specification.includes(search)
  )
  const totalCost = filteredUsages.reduce((s, u) => s + (u.actualCost ? Number(u.actualCost) : 0), 0)
  const totalQty = filteredUsages.reduce((s, u) => s + Number(u.quantity), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">月度用量登记</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">员工登记办公耗材的月度使用量与实际花费</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> 登记用量
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">登记条目数</div>
          <div className="text-2xl font-bold">{filteredUsages.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">总用量</div>
          <div className="text-2xl font-bold">{formatDecimal(totalQty)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">总花费</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">耗材种类数</div>
          <div className="text-2xl font-bold">{new Set(filteredUsages.map(u => u.itemId)).size}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索耗材..." className="input pl-9 w-full sm:w-60" />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input pl-9 w-full sm:w-52" />
            </div>
          </div>
          {filterMonth && <button onClick={() => setFilterMonth('')} className="btn-secondary text-sm">清除筛选</button>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>月份</th>
                <th>耗材名称</th>
                <th>规格</th>
                <th>分类</th>
                <th>用量</th>
                <th>实际花费</th>
                <th>备注</th>
                <th>登记时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsages.map((u) => (
                <tr key={u.id}>
                  <td><span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-mono">{u.yearMonth}</span></td>
                  <td className="font-medium">{u.item.name}</td>
                  <td className="text-slate-500 dark:text-slate-400 text-sm">{u.item.specification}</td>
                  <td><span className="badge bg-slate-100 dark:bg-slate-800 text-xs">{u.item.category.name}</span></td>
                  <td className="font-medium">{formatDecimal(Number(u.quantity))} {u.item.unit}</td>
                  <td className="font-medium text-primary">{formatCurrency(u.actualCost ? Number(u.actualCost) : 0)}</td>
                  <td className="text-slate-500 dark:text-slate-400 text-sm max-w-[150px] truncate">{u.remark || '-'}</td>
                  <td className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td>
                    <button onClick={() => del.mutate(u.id)} disabled={del.isPending} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsages.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无登记数据，点击右上角开始登记
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="登记月度用量">
        <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
          <div className="form-grid">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">选择耗材</label>
              <select {...form.register('itemId')} className="input">
                <option value="">请选择耗材</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} - {i.specification} ({i.unit})</option>
                ))}
              </select>
              {form.formState.errors.itemId && <p className="text-sm text-danger mt-1">{form.formState.errors.itemId.message}</p>}
            </div>
            <div>
              <label className="label">月份</label>
              <input type="month" {...form.register('yearMonth')} className="input" />
              {form.formState.errors.yearMonth && <p className="text-sm text-danger mt-1">{form.formState.errors.yearMonth.message}</p>}
            </div>
            <div>
              <label className="label">使用数量</label>
              <input type="number" step="any" min="0" {...form.register('quantity')} className="input" />
              {form.formState.errors.quantity && <p className="text-sm text-danger mt-1">{form.formState.errors.quantity.message}</p>}
            </div>
            <div>
              <label className="label">实际花费（选填）</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" step="0.01" min="0" {...form.register('actualCost' as any)} className="input pl-9" placeholder="0.00" />
              </div>
            </div>
            <div className="form-grid-full">
              <label className="label">备注（选填）</label>
              <textarea {...form.register('remark')} className="input min-h-[80px]" rows={3} placeholder="备注说明..." />
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
