'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { Handshake, Plus, Search, Mail, Phone, Star, StarOff } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatDate, formatCurrency } from '@/lib/config'

const schema = z.object({
  name: z.string().min(1, '请输入供应商名称'),
  code: z.string().min(1, '请输入供应商编码'),
  contactPerson: z.string().min(1, '请输入联系人'),
  contactEmail: z.string().email('请输入有效邮箱'),
  contactPhone: z.string().min(1, '请输入联系电话'),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  bankAccount: z.string().optional(),
})

export default function SuppliersAdminPage() {
  const utils = useApiUtils()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: suppliers = [], isLoading } = api.procurement.listSuppliers.useQuery({
    search: search || undefined,
    status: statusFilter === '' ? undefined : statusFilter === 'active',
  })
  const { data: riskStats = [] } = api.risk.supplierRiskStats.useQuery()

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      taxNumber: '',
      bankAccount: '',
    },
  })

  const create = api.procurement.createSupplier.useMutation({
    onSuccess: async () => {
      await utils.procurement.listSuppliers.invalidate()
      setOpen(false)
      form.reset()
    },
  })

  const getSupplierStats = (id: string) => riskStats.find((s: any) => s.supplier.id === id)

  const totalActive = suppliers.filter((s: any) => s.status).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">供应商管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            维护供应商档案，查看评级和风险分布
          </p>
        </div>
        <div className="action-group">
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> 新增供应商
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Handshake className="w-4 h-4" /> 供应商总数
          </div>
          <div className="text-2xl font-bold">{suppliers.length}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Star className="w-4 h-4" /> 活跃供应商
          </div>
          <div className="text-2xl font-bold text-green-600">{totalActive}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <StarOff className="w-4 h-4" /> 停用
          </div>
          <div className="text-2xl font-bold text-slate-500">{suppliers.length - totalActive}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            平均评级
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {suppliers.length ? (suppliers.reduce((s: any, x: any) => s + Number(x.rating), 0) / suppliers.length).toFixed(1) : '-'}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索名称/编码..." className="input pl-9 w-full sm:w-64" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
              <option value="">全部</option>
              <option value="active">已启用</option>
              <option value="inactive">已停用</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>供应商</th>
                <th>联系人</th>
                <th>电话</th>
                <th>邮箱</th>
                <th>评级</th>
                <th>未解决风险</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s: any) => {
                const stats = getSupplierStats(s.id)
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.code}</div>
                    </td>
                    <td>{s.contactPerson}</td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {s.contactPhone}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm font-mono text-primary truncate max-w-[200px]" title={s.contactEmail}>
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{s.contactEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-4 h-4 ${n <= Number(s.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                        ))}
                      </div>
                    </td>
                    <td>
                      {stats && stats.unresolved > 0 ? (
                        <span className={`badge ${stats.critical > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : stats.high > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {stats.unresolved} 项
                        </span>
                      ) : <span className="text-slate-400 text-sm">无</span>}
                    </td>
                    <td>
                      {s.status
                        ? <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">正常</span>
                        : <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">已停用</span>
                      }
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap text-sm">{formatDate(s.createdAt)}</td>
                  </tr>
                )
              })}
              {suppliers.length === 0 && !isLoading && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Handshake className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  暂无供应商，点击右上角新增
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新增供应商" size="lg">
        <form onSubmit={form.handleSubmit((d: any) => create.mutate(d))} className="space-y-4">
          <div className="form-grid">
            <div className="sm:col-span-2">
              <label className="label">供应商名称</label>
              <input {...form.register('name')} className="input" placeholder="如：某某办公设备有限公司" />
              {form.formState.errors.name && <p className="text-sm text-danger mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="label">供应商编码</label>
              <input {...form.register('code')} className="input font-mono" placeholder="如：SUP-001" />
              {form.formState.errors.code && <p className="text-sm text-danger mt-1">{form.formState.errors.code.message}</p>}
            </div>
            <div>
              <label className="label">联系人</label>
              <input {...form.register('contactPerson')} className="input" />
            </div>
            <div>
              <label className="label">联系电话</label>
              <input {...form.register('contactPhone')} className="input" />
            </div>
            <div>
              <label className="label">邮箱</label>
              <input type="email" {...form.register('contactEmail')} className="input" />
              {form.formState.errors.contactEmail && <p className="text-sm text-danger mt-1">{form.formState.errors.contactEmail.message}</p>}
            </div>
            <div className="form-grid-full">
              <label className="label">办公地址（选填）</label>
              <input {...form.register('address')} className="input" />
            </div>
            <div>
              <label className="label">税号（选填）</label>
              <input {...form.register('taxNumber')} className="input font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">银行账户（选填）</label>
              <input {...form.register('bankAccount')} className="input font-mono" />
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
