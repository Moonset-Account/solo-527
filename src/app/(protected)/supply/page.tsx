'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { Package, Plus, Search, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatDate } from '@/lib/config'

const categorySchema = z.object({
  name: z.string().min(1, '请输入分类名称'),
  code: z.string().min(1, '请输入分类编码'),
  description: z.string().optional(),
})

const itemSchema = z.object({
  categoryId: z.string().min(1, '请选择分类'),
  name: z.string().min(1, '请输入耗材名称'),
  specification: z.string().min(1, '请输入规格说明'),
  unit: z.string().min(1, '请输入单位'),
  barcode: z.string().optional(),
})

export default function SupplyPage() {
  const utils = useApiUtils()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)

  const { data: categories = [], isLoading: catLoading } = api.supply.listCategories.useQuery()
  const { data: items = [], isLoading: itemLoading } = api.supply.listItems.useQuery({
    categoryId: activeCategory || undefined,
    search: search || undefined,
  })

  const catForm = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: '', code: '', description: '' } })
  const itemForm = useForm({ resolver: zodResolver(itemSchema), defaultValues: { categoryId: '', name: '', specification: '', unit: '', barcode: '' } })

  const createCategory = api.supply.createCategory.useMutation({
    onSuccess: async () => {
      await utils.supply.listCategories.invalidate()
      setCategoryModalOpen(false)
      catForm.reset()
    },
  })
  const createItem = api.supply.createItem.useMutation({
    onSuccess: async () => {
      await utils.supply.listItems.invalidate()
      setItemModalOpen(false)
      itemForm.reset()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">耗材管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">维护耗材分类与规格信息</p>
        </div>
        <div className="action-group">
          <button onClick={() => setCategoryModalOpen(true)} className="btn-secondary">
            <Plus className="w-4 h-4" /> 新增分类
          </button>
          <button onClick={() => setItemModalOpen(true)} className="btn-primary">
            <Package className="w-4 h-4" /> 新增耗材
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card p-3 h-fit">
          <div className="p-2">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索耗材..."
                className="input pl-9"
              />
            </div>
            <button
              onClick={() => setActiveCategory(undefined)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeCategory ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              全部分类
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  activeCategory === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="font-medium truncate">{c.name}</span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{c._count.items}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>耗材名称</th>
                  <th>规格</th>
                  <th>分类</th>
                  <th>单位</th>
                  <th>编码</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="font-medium">{i.name}</td>
                    <td className="text-slate-500 dark:text-slate-400">{i.specification}</td>
                    <td><span className="badge bg-slate-100 dark:bg-slate-800">{i.category.name}</span></td>
                    <td>{i.unit}</td>
                    <td className="text-slate-500 dark:text-slate-400 font-mono text-xs">{i.barcode || '-'}</td>
                    <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(i.createdAt)}</td>
                  </tr>
                ))}
                {items.length === 0 && !itemLoading && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">暂无耗材数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="新增耗材分类">
        <form onSubmit={catForm.handleSubmit((d) => createCategory.mutate(d))} className="space-y-4">
          <div>
            <label className="label">分类名称</label>
            <input {...catForm.register('name')} className="input" placeholder="如：打印耗材" />
            {catForm.formState.errors.name && <p className="text-sm text-danger mt-1">{catForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="label">分类编码</label>
            <input {...catForm.register('code')} className="input" placeholder="如：PRINT-001" />
            {catForm.formState.errors.code && <p className="text-sm text-danger mt-1">{catForm.formState.errors.code.message}</p>}
          </div>
          <div>
            <label className="label">描述（选填）</label>
            <textarea {...catForm.register('description')} className="input min-h-[80px]" rows={3} />
          </div>
          <div className="action-group pt-2">
            <button type="button" onClick={() => setCategoryModalOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={createCategory.isPending}>
              {createCategory.isPending ? '提交中...' : '确认创建'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title="新增耗材" size="lg">
        <form onSubmit={itemForm.handleSubmit((d) => createItem.mutate(d))} className="space-y-4">
          <div className="form-grid">
            <div>
              <label className="label">分类</label>
              <select {...itemForm.register('categoryId')} className="input">
                <option value="">请选择分类</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {itemForm.formState.errors.categoryId && <p className="text-sm text-danger mt-1">{itemForm.formState.errors.categoryId.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">耗材名称</label>
              <input {...itemForm.register('name')} className="input" placeholder="如：A4打印纸" />
              {itemForm.formState.errors.name && <p className="text-sm text-danger mt-1">{itemForm.formState.errors.name.message}</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="label">规格说明</label>
              <input {...itemForm.register('specification')} className="input" placeholder="如：70g 500张/包 5包/箱" />
              {itemForm.formState.errors.specification && <p className="text-sm text-danger mt-1">{itemForm.formState.errors.specification.message}</p>}
            </div>
            <div>
              <label className="label">计量单位</label>
              <input {...itemForm.register('unit')} className="input" placeholder="如：包、箱、个" />
              {itemForm.formState.errors.unit && <p className="text-sm text-danger mt-1">{itemForm.formState.errors.unit.message}</p>}
            </div>
            <div className="form-grid-full">
              <label className="label">条形码（选填）</label>
              <input {...itemForm.register('barcode')} className="input" />
            </div>
          </div>
          <div className="action-group pt-2">
            <button type="button" onClick={() => setItemModalOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={createItem.isPending}>
              {createItem.isPending ? '提交中...' : '确认创建'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
