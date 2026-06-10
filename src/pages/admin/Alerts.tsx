import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, Edit2, Bell, Mail, MessageSquare } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface AlertRule {
  id: string
  name: string
  type: string
  condition: Record<string, unknown>
  notifyMethods: string[]
  active: boolean
}

const alertTypes = [
  { value: 'yield_anomaly', label: '产量异常' },
  { value: 'timeout', label: '超时未处理' },
  { value: 'material_missing', label: '材料缺失' },
  { value: 'stock_low', label: '库存不足' },
]

const alertTypeLabel: Record<string, string> = {
  yield_anomaly: '产量异常',
  timeout: '超时未处理',
  material_missing: '材料缺失',
  stock_low: '库存不足',
}

const notifyOptions = [
  { value: 'in_app', label: '站内通知', icon: Bell },
  { value: 'email', label: '邮件', icon: Mail },
  { value: 'sms', label: '短信', icon: MessageSquare },
]

const notifyLabel: Record<string, string> = {
  in_app: '站内通知',
  email: '邮件',
  sms: '短信',
}

function ConditionForm({ type, condition, onChange }: {
  type: string
  condition: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  if (type === 'yield_anomaly') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <FormField label="偏差百分比(%)">
          <input
            type="number"
            value={(condition.threshold as number) || ''}
            onChange={(e) => onChange({ ...condition, threshold: Number(e.target.value) })}
            className="input-field"
            placeholder="如 30"
          />
        </FormField>
        <FormField label="比较周期(天)">
          <input
            type="number"
            value={(condition.period as number) || ''}
            onChange={(e) => onChange({ ...condition, period: Number(e.target.value) })}
            className="input-field"
            placeholder="如 7"
          />
        </FormField>
      </div>
    )
  }
  if (type === 'timeout') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <FormField label="超时时间(小时)">
          <input
            type="number"
            value={(condition.hours as number) || ''}
            onChange={(e) => onChange({ ...condition, hours: Number(e.target.value) })}
            className="input-field"
            placeholder="如 24"
          />
        </FormField>
        <FormField label="监控对象">
          <select
            value={(condition.target as string) || ''}
            onChange={(e) => onChange({ ...condition, target: e.target.value })}
            className="input-field"
          >
            <option value="">请选择</option>
            <option value="farm-records">农事记录</option>
            <option value="harvests">采收记录</option>
            <option value="orders">订单</option>
          </select>
        </FormField>
      </div>
    )
  }
  if (type === 'material_missing') {
    return (
      <FormField label="检查项目">
        <select
          value={(condition.item as string) || ''}
          onChange={(e) => onChange({ ...condition, item: e.target.value })}
          className="input-field"
        >
          <option value="">请选择</option>
          <option value="pesticide_test">农药残留检测</option>
          <option value="quality_cert">质量认证</option>
          <option value="declaration_doc">申报材料</option>
        </select>
      </FormField>
    )
  }
  if (type === 'stock_low') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <FormField label="库存阈值(kg)">
          <input
            type="number"
            value={(condition.threshold as number) || ''}
            onChange={(e) => onChange({ ...condition, threshold: Number(e.target.value) })}
            className="input-field"
            placeholder="如 100"
          />
        </FormField>
        <FormField label="品种">
          <input
            type="text"
            value={(condition.variety as string) || ''}
            onChange={(e) => onChange({ ...condition, variety: e.target.value })}
            className="input-field"
            placeholder="留空则监控全部"
          />
        </FormField>
      </div>
    )
  }
  return <p className="text-sm text-gray-400">请选择规则类型</p>
}

function formatCondition(rule: AlertRule): string {
  const c = rule.condition
  switch (rule.type) {
    case 'yield_anomaly':
      return `偏差超过${c.threshold || '?'}%，近${c.period || '?'}天`
    case 'timeout':
      return `${c.hours || '?'}小时未处理(${c.target || '?'})`
    case 'material_missing':
      return `缺少${c.item || '?'}`
    case 'stock_low':
      return `库存低于${c.threshold || '?'}kg${c.variety ? ` (${c.variety})` : ''}`
    default:
      return JSON.stringify(c)
  }
}

function AlertModal({ isOpen, onClose, rule, onSave }: {
  isOpen: boolean
  onClose: () => void
  rule: AlertRule | null
  onSave: (data: Omit<AlertRule, 'id'>) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [condition, setCondition] = useState<Record<string, unknown>>({})
  const [notifyMethods, setNotifyMethods] = useState<string[]>([])
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setType(rule.type)
      setCondition(rule.condition)
      setNotifyMethods(rule.notifyMethods)
      setActive(rule.active)
    } else {
      setName('')
      setType('')
      setCondition({})
      setNotifyMethods(['in_app'])
      setActive(true)
    }
  }, [rule, isOpen])

  const toggleNotify = (method: string) => {
    setNotifyMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || !type || notifyMethods.length === 0) return
    onSave({ name: name.trim(), type, condition, notifyMethods, active })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={rule ? '编辑规则' : '新增规则'} size="lg">
      <div className="space-y-4">
        <FormField label="规则名称" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="请输入规则名称"
          />
        </FormField>
        <FormField label="规则类型" required>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setCondition({}) }}
            className="input-field"
          >
            <option value="">请选择类型</option>
            {alertTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </FormField>
        {type && (
          <FormField label="触发条件">
            <ConditionForm type={type} condition={condition} onChange={setCondition} />
          </FormField>
        )}
        <FormField label="通知方式" required>
          <div className="flex flex-wrap gap-3">
            {notifyOptions.map((opt) => {
              const checked = notifyMethods.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                    checked
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNotify(opt.value)}
                    className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                  />
                  <opt.icon className="h-4 w-4" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              )
            })}
          </div>
        </FormField>
        <FormField label="启用状态">
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              active ? 'bg-primary-700' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                active ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={!name.trim() || !type || notifyMethods.length === 0}
          >
            {rule ? '保存修改' : '创建规则'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Alerts() {
  const { execute, loading } = useApi<AlertRule[]>()
  const saveApi = useApi<AlertRule>()
  const [rules, setRules] = useState<AlertRule[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  const loadRules = async () => {
    const res = await execute('/api/admin/alerts')
    if (res) setRules(Array.isArray(res) ? res : [])
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleToggleActive = async (rule: AlertRule) => {
    const res = await saveApi.execute(`/api/admin/alerts/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !rule.active }),
    })
    if (res) await loadRules()
  }

  const handleSave = async (data: Omit<AlertRule, 'id'>) => {
    if (editingRule) {
      const res = await saveApi.execute(`/api/admin/alerts/${editingRule.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (res) await loadRules()
    } else {
      const res = await saveApi.execute('/api/admin/alerts', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (res) await loadRules()
    }
    setModalOpen(false)
    setEditingRule(null)
  }

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setEditingRule(null)
    setModalOpen(true)
  }

  const typeColors: Record<string, string> = {
    yield_anomaly: 'bg-red-50 text-red-700 border-red-200',
    timeout: 'bg-amber-50 text-amber-700 border-amber-200',
    material_missing: 'bg-purple-50 text-purple-700 border-purple-200',
    stock_low: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div>
      <PageHeader
        title="异常提醒"
        subtitle="配置系统异常预警规则"
        action={
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增规则
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-32 mb-4" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn('h-5 w-5', rule.active ? 'text-amber-500' : 'text-gray-400')} />
                  <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-1.5 text-gray-400 hover:text-primary-700 rounded-lg hover:bg-primary-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(rule)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      rule.active ? 'bg-primary-700' : 'bg-gray-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        rule.active ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={cn('status-badge border', typeColors[rule.type] || 'bg-gray-50 text-gray-600 border-gray-200')}>
                  {alertTypeLabel[rule.type] || rule.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                条件：{formatCondition(rule)}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                {rule.notifyMethods.map((method) => (
                  <span key={method} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                    {method === 'in_app' && <Bell className="h-3 w-3" />}
                    {method === 'email' && <Mail className="h-3 w-3" />}
                    {method === 'sms' && <MessageSquare className="h-3 w-3" />}
                    {notifyLabel[method] || method}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="col-span-full card p-8 text-center text-gray-400">暂无提醒规则</div>
          )}
        </div>
      )}

      <AlertModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRule(null) }}
        rule={editingRule}
        onSave={handleSave}
      />
    </div>
  )
}
