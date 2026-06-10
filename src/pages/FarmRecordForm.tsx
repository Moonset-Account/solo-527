import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Bug, ShowerHead, Scissors, Leaf, Wrench, Loader2, ImagePlus, X } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

const typeOptions = [
  { value: 'fertilization', label: '施肥', icon: Droplets, color: 'text-green-600 bg-green-50' },
  { value: 'pesticide', label: '打药', icon: Bug, color: 'text-red-600 bg-red-50' },
  { value: 'irrigation', label: '灌溉', icon: ShowerHead, color: 'text-blue-600 bg-blue-50' },
  { value: 'pruning', label: '修剪', icon: Scissors, color: 'text-amber-600 bg-amber-50' },
  { value: 'weeding', label: '除草', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'other', label: '其他', icon: Wrench, color: 'text-gray-600 bg-gray-50' },
]

const unitOptions = ['kg', 'L', 'g', 'mL', '亩']

interface Option {
  id: string
  name: string
  currentVarietyId?: string
  currentVariety?: string
}

export default function FarmRecordForm() {
  const navigate = useNavigate()
  const { execute, loading } = useApi()
  const [plots, setPlots] = useState<Option[]>([])
  const [varieties, setVarieties] = useState<Option[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [form, setForm] = useState({
    type: '',
    plotId: '',
    varietyId: '',
    content: '',
    dosage: '',
    unit: 'kg',
    operateDate: new Date().toISOString().slice(0, 10),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoFiles, setPhotoFiles] = useState<File[]>([])

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
    if (!form.type) e.type = '请选择类型'
    if (!form.plotId) e.plotId = '请选择地块'
    if (!form.content.trim()) e.content = '请填写内容'
    if (!form.operateDate) e.operateDate = '请选择日期'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotoFiles((prev) => [...prev, ...files])
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(f)
    })
  }

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const formData = new FormData()
    formData.append('type', form.type)
    formData.append('plotId', form.plotId)
    formData.append('varietyId', form.varietyId)
    formData.append('content', form.content)
    if (form.dosage) formData.append('dosage', form.dosage)
    if (form.unit) formData.append('unit', form.unit)
    formData.append('operateDate', form.operateDate)
    photoFiles.forEach((f) => formData.append('photos', f))

    const result = await fetch('/api/farm-records', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    })
    if (result.ok) {
      navigate('/farm-records')
    }
  }

  return (
    <div>
      <PageHeader title="新增农事记录" />

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="记录类型" required error={errors.type}>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {typeOptions.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors',
                    form.type === t.value
                      ? `${t.color} border-current ring-1 ring-current`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  <t.icon className="h-5 w-5" />
                  {t.label}
                </button>
              ))}
            </div>
          </FormField>

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

          <FormField label="内容" required error={errors.content}>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="input-field min-h-[100px]"
              placeholder="请描述具体操作内容"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="用量">
              <input
                type="number"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
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

          <FormField label="操作日期" required error={errors.operateDate}>
            <input
              type="date"
              value={form.operateDate}
              onChange={(e) => setForm({ ...form, operateDate: e.target.value })}
              className="input-field"
            />
          </FormField>

          <FormField label="照片">
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 cursor-pointer transition-colors">
                <ImagePlus className="h-4 w-4" />
                上传照片
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotos}
                  className="hidden"
                />
              </label>
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              提交记录
            </button>
            <button type="button" onClick={() => navigate('/farm-records')} className="btn-outline">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
