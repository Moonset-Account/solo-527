import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Info } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'

const gradeOptions = [
  { value: 'premium', label: '特级' },
  { value: 'first', label: '一级' },
  { value: 'second', label: '二级' },
  { value: 'third', label: '三级' },
]

const unitOptions = ['kg', '斤', '箱']

interface Option {
  id: string
  name: string
  currentVarietyId?: string
}

export default function HarvestForm() {
  const navigate = useNavigate()
  const { execute, loading } = useApi()
  const [plots, setPlots] = useState<Option[]>([])
  const [varieties, setVarieties] = useState<Option[]>([])
  const [form, setForm] = useState({
    plotId: '',
    varietyId: '',
    quantity: '',
    unit: 'kg',
    qualityGrade: '',
    harvester: '',
    harvestDate: new Date().toISOString().slice(0, 10),
    remark: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/plots')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPlots(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
    fetch('/api/varieties')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setVarieties(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (form.plotId) {
      const plot = plots.find((p) => p.id === form.plotId)
      if (plot?.currentVarietyId) {
        setForm((f) => ({ ...f, varietyId: plot.currentVarietyId! }))
      }
    }
  }, [form.plotId, plots])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.plotId) e.plotId = '请选择地块'
    if (!form.quantity) e.quantity = '请填写采收量'
    if (!form.qualityGrade) e.qualityGrade = '请选择品质等级'
    if (!form.harvester.trim()) e.harvester = '请填写采收人'
    if (!form.harvestDate) e.harvestDate = '请选择采收日期'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await execute('/api/harvests', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
      }),
    })
    if (result) {
      navigate('/harvests')
    }
  }

  return (
    <div>
      <PageHeader title="新增采收记录" />

      <div className="card p-6 max-w-2xl">
        <div className="flex items-start gap-2 p-3 mb-5 bg-accent-50 text-accent-700 rounded-lg text-sm">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>批次编号将在提交后由系统自动生成</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="地块" required error={errors.plotId}>
              <select
                value={form.plotId}
                onChange={(e) => setForm({ ...form, plotId: e.target.value })}
                className="input-field"
              >
                <option value="">请选择地块</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="品种">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="采收量" required error={errors.quantity}>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input-field"
                placeholder="输入数量"
                min="0"
                step="0.01"
              />
            </FormField>
            <FormField label="单位">
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input-field"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="品质等级" required error={errors.qualityGrade}>
            <select
              value={form.qualityGrade}
              onChange={(e) => setForm({ ...form, qualityGrade: e.target.value })}
              className="input-field"
            >
              <option value="">请选择等级</option>
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="采收人" required error={errors.harvester}>
            <input
              type="text"
              value={form.harvester}
              onChange={(e) => setForm({ ...form, harvester: e.target.value })}
              className="input-field"
              placeholder="请输入采收人姓名"
            />
          </FormField>

          <FormField label="采收日期" required error={errors.harvestDate}>
            <input
              type="date"
              value={form.harvestDate}
              onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
              className="input-field"
            />
          </FormField>

          <FormField label="备注">
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="备注信息（可选）"
            />
          </FormField>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              提交记录
            </button>
            <button type="button" onClick={() => navigate('/harvests')} className="btn-outline">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
