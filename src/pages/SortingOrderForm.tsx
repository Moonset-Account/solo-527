import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'

interface Harvest {
  id: string
  batchNo: string
  variety: string
  quantity: number
  unit: string
}

const mockHarvests: Harvest[] = [
  { id: 'h1', batchNo: 'CS-20260610-001', variety: '红富士', quantity: 500, unit: 'kg' },
  { id: 'h2', batchNo: 'CS-20260610-002', variety: '嘎啦', quantity: 300, unit: 'kg' },
  { id: 'h3', batchNo: 'CS-20260609-001', variety: '金冠', quantity: 200, unit: 'kg' },
]

export default function SortingOrderForm() {
  const navigate = useNavigate()
  const { execute: submitOrder, loading: submitting } = useApi()
  const { execute: fetchHarvests } = useApi<Harvest[]>()
  const [harvests, setHarvests] = useState<Harvest[]>(mockHarvests)
  const [form, setForm] = useState({ harvestId: '', sorter: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchHarvests('/api/harvests').then((data) => {
      if (data) setHarvests(data)
    }).catch(() => {})
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.harvestId) errs.harvestId = '请选择来源采收批次'
    if (!form.sorter.trim()) errs.sorter = '请输入分拣员姓名'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await submitOrder('/api/sorting-orders', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    if (result) {
      navigate(`/sorting-orders/${(result as Record<string, string>).id}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="新增分拣订单"
        subtitle="为采收批次创建分拣任务"
        action={
          <button onClick={() => navigate('/sorting-orders')} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
        }
      />

      <div className="card p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="来源采收批次" required error={errors.harvestId}>
            <select
              value={form.harvestId}
              onChange={(e) => setForm({ ...form, harvestId: e.target.value })}
              className="input-field"
            >
              <option value="">请选择采收批次</option>
              {harvests.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.batchNo} - {h.variety} ({h.quantity}{h.unit})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="分拣员" required error={errors.sorter}>
            <input
              type="text"
              value={form.sorter}
              onChange={(e) => setForm({ ...form, sorter: e.target.value })}
              placeholder="请输入分拣员姓名"
              className="input-field"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" />
              {submitting ? '提交中...' : '创建订单'}
            </button>
            <button type="button" onClick={() => navigate('/sorting-orders')} className="btn-outline">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
