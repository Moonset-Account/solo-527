import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface VarietyForm {
  code: string
  name: string
  category: string
  growthCycle: number | ''
  harvestStandard: string
  shelfLife: number | ''
  status: string
}

interface FormErrors {
  name?: string
  code?: string
  category?: string
}

const categoryOptions = [
  { value: 'citrus', label: '柑橘' },
  { value: 'apple', label: '苹果' },
  { value: 'pear', label: '梨' },
  { value: 'peach', label: '桃' },
  { value: 'grape', label: '葡萄' },
  { value: 'other', label: '其他' },
]

const statusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

const emptyForm: VarietyForm = {
  code: '',
  name: '',
  category: 'apple',
  growthCycle: '',
  harvestStandard: '',
  shelfLife: '',
  status: 'active',
}

export default function VarietyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { execute: fetchVariety, data: varietyData } = useApi<VarietyForm & { id: string }>()
  const { execute: saveVariety, loading: saving } = useApi()

  const [form, setForm] = useState<VarietyForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (isEdit) {
      fetchVariety(`/api/varieties/${id}`).catch(() => {})
    } else {
      const code = `VR-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`
      setForm({ ...emptyForm, code })
    }
  }, [id])

  useEffect(() => {
    if (isEdit && varietyData) {
      setForm({
        code: varietyData.code,
        name: varietyData.name,
        category: varietyData.category,
        growthCycle: varietyData.growthCycle,
        harvestStandard: varietyData.harvestStandard || '',
        shelfLife: varietyData.shelfLife,
        status: varietyData.status,
      })
    }
  }, [varietyData])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = '请输入品种名称'
    if (!form.code.trim()) newErrors.code = '请输入编码'
    if (!form.category) newErrors.category = '请选择分类'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      ...form,
      growthCycle: form.growthCycle ? Number(form.growthCycle) : 0,
      shelfLife: form.shelfLife ? Number(form.shelfLife) : 0,
    }
    const url = isEdit ? `/api/varieties/${id}` : '/api/varieties'
    const method = isEdit ? 'PUT' : 'POST'

    const result = await saveVariety(url, {
      method,
      body: JSON.stringify(payload),
    })

    if (result !== null) {
      navigate('/varieties')
    }
  }

  const updateField = (field: keyof VarietyForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? '编辑品种' : '新增品种'}
        action={
          <button onClick={() => navigate('/varieties')} className="btn-outline flex items-center gap-2">
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
              placeholder="VR-XXX"
            />
          </FormField>

          <FormField label="名称" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={cn('input-field', errors.name && 'border-red-400 focus:ring-red-400')}
              placeholder="请输入品种名称"
            />
          </FormField>

          <FormField label="分类" required error={errors.category}>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={cn('input-field', errors.category && 'border-red-400 focus:ring-red-400')}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="种植周期(天)">
            <input
              type="number"
              value={form.growthCycle}
              onChange={(e) => updateField('growthCycle', e.target.value === '' ? '' : Number(e.target.value))}
              className="input-field"
              placeholder="0"
              min="0"
            />
          </FormField>

          <FormField label="保质期(天)">
            <input
              type="number"
              value={form.shelfLife}
              onChange={(e) => updateField('shelfLife', e.target.value === '' ? '' : Number(e.target.value))}
              className="input-field"
              placeholder="0"
              min="0"
            />
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
            <FormField label="采收标准">
              <textarea
                value={form.harvestStandard}
                onChange={(e) => updateField('harvestStandard', e.target.value)}
                className="input-field min-h-[80px]"
                placeholder="请输入采收标准"
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
