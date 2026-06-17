'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, Button, Input, Textarea } from '@/components/ui'

const facilityTypes = [
  '电梯', '门禁', '照明', '消防', '健身器材', '儿童游乐', '绿化', '停车场', '给排水', '其他'
]

export default function NewFacilityPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('电梯')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoInput, setPhotoInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = trpc.facility.create.useMutation({
    onSuccess: data => router.push(`/facilities/${data.id}`),
  })

  const addPhoto = () => {
    if (!photoInput.trim()) return
    setPhotoUrls([...photoUrls, photoInput.trim()])
    setPhotoInput('')
  }

  const removePhoto = (i: number) => {
    setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = '请填写设施名称'
    if (!location.trim()) errs.location = '请填写位置'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    createMutation.mutate({
      name: name.trim(),
      type,
      location: location.trim(),
      description: description.trim() || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700">
        ← 返回
      </button>
      <Card>
        <CardHeader>
          <CardTitle>🏢 添加设施</CardTitle>
          <p className="mt-1 text-sm text-slate-500">登记社区公共设施基本信息</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="设施名称" placeholder="例如：3号楼1单元电梯" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">设施类型</label>
                <div className="flex flex-wrap gap-2">
                  {facilityTypes.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        type === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="所在位置" placeholder="例如：3号楼1单元" value={location} onChange={e => setLocation(e.target.value)} error={errors.location} />
            </div>
            <Textarea label="设施描述（可选）" placeholder="品牌、型号、投用时间、维护要点等..." value={description} onChange={e => setDescription(e.target.value)} />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">设施照片</label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="照片 URL" value={photoInput} onChange={e => setPhotoInput(e.target.value)} />
                <Button type="button" variant="secondary" onClick={addPhoto}>添加</Button>
              </div>
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <div className="text-center p-2">
                        <div className="text-2xl">📷</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-rose-500 text-white text-xs shadow-sm hover:bg-rose-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>取消</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '创建中...' : '添加设施'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
