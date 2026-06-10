import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface Variety {
  id: string
  name: string
}

interface PlotForm {
  code: string
  name: string
  area: number | ''
  unit: string
  location: string
  soilType: string
  currentVarietyId: string
  status: string
  remark: string
}

interface FormErrors {
  name?: string
  area?: string
  code?: string
}

const soilOptions = [
  { value: 'red', label: '红壤' },
  { value: 'yellow', label: '黄壤' },
  { value: 'sandy', label: '沙壤' },
  { value: 'clay', label: '黏土' },
  { value: 'other', label: '其他' },
]

const statusOptions = [
  { value: 'active', label: '种植中' },
  { value: 'fallow', label: '休耕' },
  { value: 'preparing', label: '备耕' },
]

const emptyForm: PlotForm = {
  code: '',
  name: '',
  area: '',
  unit: '亩',
  location: '',
  soilType: 'red',
  currentVarietyId: '',
  status: 'preparing',
  remark: '',
}

export default function PlotForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { execute: fetchPlot, data: plotData } = useApi<PlotForm & { id: string }>()
  const { execute: savePlot, loading: saving } = useApi()
  const { execute: fetchVarieties, data: varietiesData } = useApi<Variety[]>()

  const [form, setForm] = useState<PlotForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [varieties, setVarieties] = useState<Variety[]>([])

  useEffect(() => {
    fetchVarieties('/api/varieties?status=active').catch(() => {})
  }, [])

  useEffect(() => {
    if (varietiesData) setVarieties(varietiesData)
  }, [varietiesData])

  useEffect(() => {
    if (isEdit) {
      fetchPlot(`/api/plots/${id}`).catch(() => {})
    } else {
      const code = `PL-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`
      setForm({ ...emptyForm, code })
    }
  }, [id])

  useEffect(() => {
    if (isEdit && plotData) {
      setForm({
        code: plotData.code,
        name: plotData.name,
        area: plotData.area,
        unit: plotData.unit,
        location: plotData.location,
        soilType: plotData.soilType,
        currentVarietyId: plotData.currentVarietyId || '',
        status: plotData.status,
        remark: plotData.remark || '',
      })
    }
  }, [plotData])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = '请输入地块名称'
    if (!form.area || Number(form.area) <= 0) newErrors.area = '请输入有效面积'
    if (!form.code.trim()) newErrors.code = '请输入编码'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = { ...form, area: Number(form.area) }
    const url = isEdit ? `/api/plots/${id}` : '/api/plots'
    const method = isEdit ? 'PUT' : 'POST'

    const result = await savePlot(url, {
      method,
      body: JSON.stringify(payload),
    })

    if (result !== null) {
      navigate('/plots')
    }
  }

  const updateField = (field: keyof PlotForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? '编辑地块' : '新增地块'}
        action={
          <button onClick={() => navigate('/plots')} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="编码" required error={errors.code}>
            <input
              type="text"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              className={cn('input-field', errors.code && 'border-red-400 focus:ring-red-400')}
              placeholder="PL-XXX"
            />
          </FormField>

          <FormField label="名称" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={cn('input-field', errors.name && 'border-red-400 focus:ring-red-400')}
              placeholder="请输入地块名称"
            />
          </FormField>

          <FormField label="面积" required error={errors.area}>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.area}
                onChange={(e) => updateField('area', e.target.value === '' ? '' : Number(e.target.value))}
                className={cn('input-field flex-1', errors.area && 'border-red-400 focus:ring-red-400')}
                placeholder="0"
                min="0"
                step="0.01"
              />
              <select
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                className="input-field w-24"
              >
                <option value="亩">亩</option>
                <option value="平方米">平方米</option>
                <option value="公顷">公顷</option>
              </select>
            </div>
          </FormField>

          <FormField label="位置">
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              className="input-field"
              placeholder="请输入位置信息"
            />
          </FormField>

          <FormField label="土壤类型">
            <select
              value={form.soilType}
              onChange={(e) => updateField('soilType', e.target.value)}
              className="input-field"
            >
              {soilOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="当前品种">
            <select
              value={form.currentVarietyId}
              onChange={(e) => updateField('currentVarietyId', e.target.value)}
              className="input-field"
            >
              <option value="">未种植</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="状态">
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="input-field"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="备注">
              <textarea
                value={form.remark}
                onChange={(e) => updateField('remark', e.target.value)}
                className="input-field min-h-[80px]"
                placeholder="请输入备注信息"
                rows={3}
              />
            </FormField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">
            取消
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
