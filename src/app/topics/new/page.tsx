'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, Button, Input, Textarea, Select } from '@/components/ui'

export default function NewTopicPage() {
  const router = useRouter()
  const createMutation = trpc.topic.create.useMutation({
    onSuccess: data => router.push(`/topics/${data.id}`),
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [voteType, setVoteType] = useState<'SINGLE' | 'MULTIPLE' | 'RANKED'>('SINGLE')
  const [maxSelections, setMaxSelections] = useState(1)
  const [passThreshold, setPassThreshold] = useState(0.5)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [options, setOptions] = useState<{ label: string; description: string }[]>([
    { label: '', description: '' },
    { label: '', description: '' },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = '请填写议题标题'
    if (!description.trim()) errs.description = '请填写议题说明'
    const validOptions = options.filter(o => o.label.trim())
    if (validOptions.length < 2) errs.options = '至少需要 2 个有效选项'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const validOptions = options.filter(o => o.label.trim())
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      voteType,
      maxSelections: voteType === 'SINGLE' ? 1 : maxSelections,
      passThreshold,
      isAnonymous,
      options: validOptions,
    })
  }

  const addOption = () => {
    if (options.length >= 10) return
    setOptions([...options, { label: '', description: '' }])
  }

  const removeOption = (i: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, idx) => idx !== i))
  }

  const updateOption = (i: number, field: 'label' | 'description', value: string) => {
    setOptions(options.map((opt, idx) => idx === i ? { ...opt, [field]: value } : opt))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700">
        ← 返回
      </button>

      <Card>
        <CardHeader>
          <CardTitle>📝 发起新议题</CardTitle>
          <p className="mt-1 text-sm text-slate-500">居民代表可发起社区公共议题供全体居民协商投票</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="议题标题"
              placeholder="例如：小区东大门门禁系统改造方案"
              value={title}
              onChange={e => setTitle(e.target.value)}
              error={errors.title}
              maxLength={200}
            />

            <Textarea
              label="议题说明"
              placeholder="详细描述议题背景、可供选择的方案、需要居民决策的内容等..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              error={errors.description}
              className="min-h-[120px]"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="投票方式"
                value={voteType}
                onChange={e => setVoteType(e.target.value as any)}
                options={[
                  { value: 'SINGLE', label: '单选投票' },
                  { value: 'MULTIPLE', label: '多选投票' },
                  { value: 'RANKED', label: '排序投票' },
                ]}
              />
              {voteType !== 'SINGLE' && (
                <Input
                  label="最多可选数"
                  type="number"
                  min={2}
                  max={10}
                  value={maxSelections}
                  onChange={e => setMaxSelections(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
                />
              )}
              <Input
                label="通过阈值（0-1）"
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={passThreshold}
                onChange={e => setPassThreshold(Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)))}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                  />
                  启用匿名投票
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">投票选项</h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 10}
                >
                  + 添加选项
                </Button>
              </div>
              {errors.options && <p className="text-xs text-rose-600">{errors.options}</p>}
              {options.map((opt, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-600">选项 {i + 1}</span>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-xs text-rose-600 hover:text-rose-700"
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="选项标题"
                    value={opt.label}
                    onChange={e => updateOption(i, 'label', e.target.value)}
                  />
                  <Textarea
                    placeholder="选项说明（可选）"
                    value={opt.description}
                    onChange={e => updateOption(i, 'description', e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '创建中...' : '创建议题（草稿）'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
