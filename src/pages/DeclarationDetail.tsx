import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, History } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface HistoryEntry {
  id: string
  field: string
  oldValue: string
  newValue: string
  operator: string
  time: string
}

interface Declaration {
  id: string
  name: string
  batchNo: string
  status: string
  remark: string
  result: string
  deadline: string
  history: HistoryEntry[]
}

const mockHistory: HistoryEntry[] = [
  { id: 'h1', field: '状态', oldValue: '草稿', newValue: '已提交', operator: '张三', time: '2026-06-10 10:00' },
  { id: 'h2', field: '备注', oldValue: '', newValue: '等待审核', operator: '张三', time: '2026-06-10 10:00' },
  { id: 'h3', field: '状态', oldValue: '已提交', newValue: '已驳回', operator: '李四', time: '2026-06-11 09:30' },
  { id: 'h4', field: '处理结果', oldValue: '', newValue: '材料不齐全', operator: '李四', time: '2026-06-11 09:30' },
]

const mockDeclaration: Declaration = {
  id: '4', name: '出口检疫证书', batchNo: 'CS-20260608-002',
  status: 'rejected', remark: '材料不齐全', result: '驳回补充',
  deadline: '2026-06-12', history: mockHistory,
}

const statusLabelMap: Record<string, string> = {
  draft: '草稿', submitted: '已提交', approved: '已通过', rejected: '已驳回',
}

export default function DeclarationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { execute: fetchDecl, loading } = useApi<Declaration>()
  const { execute: updateDecl, loading: saving } = useApi<Declaration>()

  const [decl, setDecl] = useState<Declaration>(mockDeclaration)
  const [form, setForm] = useState({ status: '', remark: '', result: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchDecl(`/api/declarations/${id}`).then((data) => {
      if (data) {
        setDecl(data)
        setForm({ status: data.status, remark: data.remark, result: data.result })
      }
    }).catch(() => {})
  }, [id])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.status) errs.status = '请选择状态'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await updateDecl(`/api/declarations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    })
    if (result) {
      setDecl({ ...decl, ...form })
    }
  }

  const infoItems = [
    { label: '材料名称', value: decl.name },
    { label: '关联批次', value: decl.batchNo },
    { label: '状态', value: <StatusBadge status={decl.status} type="declaration" /> },
    { label: '截止日期', value: decl.deadline },
  ]

  return (
    <div>
      <PageHeader
        title="申报材料详情"
        action={
          <button onClick={() => navigate('/declarations')} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">材料信息</h3>
            <div className="space-y-3">
              {infoItems.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800">变更记录</h3>
            </div>
            {decl.history.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">暂无变更记录</div>
            ) : (
              <div className="space-y-3">
                {decl.history.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg bg-gray-50 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">{h.field}</span>
                      <span className="text-xs text-gray-400">{h.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{h.oldValue || '(空)'}</span>
                      <span>→</span>
                      <span className="text-primary-700 font-medium">{h.newValue}</span>
                    </div>
                    <span className="text-xs text-gray-400">操作人：{h.operator}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">编辑材料</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <FormField label="状态" required error={errors.status}>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="draft">草稿</option>
                <option value="submitted">已提交</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
              </select>
            </FormField>

            <FormField label="备注">
              <textarea
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                rows={4}
                className="input-field"
                placeholder="请输入备注信息"
              />
            </FormField>

            <FormField label="处理结果">
              <textarea
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
                rows={4}
                className="input-field"
                placeholder="请输入处理结果"
              />
            </FormField>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存修改'}
              </button>
              <button type="button" onClick={() => navigate('/declarations')} className="btn-outline">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
