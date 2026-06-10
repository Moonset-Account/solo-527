import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'

interface Variety {
  id: string
  name: string
}

const mockVarieties: Variety[] = [
  { id: 'v1', name: '红富士' },
  { id: 'v2', name: '嘎啦' },
  { id: 'v3', name: '金冠' },
  { id: 'v4', name: '国光' },
]

export default function OrderForm() {
  const navigate = useNavigate()
  const { execute: submitOrder, loading: submitting } = useApi()
  const { execute: fetchVarieties } = useApi<Variety[]>()
  const [varieties, setVarieties] = useState<Variety[]>(mockVarieties)
  const [form, setForm] = useState({
    customer: '',
    varietyId: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    deadline: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchVarieties('/api/varieties').then((data) => {
      if (data) setVarieties(data)
    }).catch(() => {})
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.customer.trim()) errs.customer = '请输入客户名称'
    if (!form.varietyId) errs.varietyId = '请选择品种'
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = '请输入有效数量'
    if (!form.unitPrice || Number(form.unitPrice) <= 0) errs.unitPrice = '请输入有效单价'
    if (!form.deadline) errs.deadline = '请选择截止日期'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await submitOrder('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
      }),
    })
    if (result) navigate('/orders')
  }

  return (
    <div>
      <PageHeader
        title="新增订单"
        subtitle="创建新的销售订单"
        action={
          <button onClick={() => navigate('/orders')} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
        }
      />

      <div className="card p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="客户名称" required error={errors.customer}>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              placeholder="请输入客户名称"
              className="input-field"
            />
          </FormField>

          <FormField label="品种" required error={errors.varietyId}>
            <select
              value={form.varietyId}
              onChange={(e) => setForm({ ...form, varietyId: e.target.value })}
              className="input-field"
            >
              <option value="">请选择品种</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="数量" required error={errors.quantity}>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
                min="0"
                className="input-field"
              />
            </FormField>
            <FormField label="单位">
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input-field"
              >
                <option value="kg">kg</option>
                <option value="箱">箱</option>
                <option value="筐">筐</option>
              </select>
            </FormField>
          </div>

          <FormField label="单价" required error={errors.unitPrice}>
            <input
              type="number"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input-field"
            />
          </FormField>

          <FormField label="截止日期" required error={errors.deadline}>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="input-field"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" />
              {submitting ? '提交中...' : '创建订单'}
            </button>
            <button type="button" onClick={() => navigate('/orders')} className="btn-outline">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
