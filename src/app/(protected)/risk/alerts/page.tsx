'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, useApiUtils } from '@/trpc/react'
import { Bell, Plus, AlertCircle, AlertTriangle, Info, CheckCircle2, Power, PowerOff } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatDateTime } from '@/lib/config'

const severityColors = {
  INFO: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const ruleTypeOptions = [
  { value: 'PURCHASE_REQUIREMENT', label: '采购需求' },
  { value: 'SUPPLIER_QUOTE', label: '供应商报价' },
  { value: 'DELIVERY_RECORD', label: '交付记录' },
  { value: 'FRAMEWORK_AGREEMENT', label: '框架协议' },
]

const schema = z.object({
  name: z.string().min(1, '请输入规则名称'),
  description: z.string().optional(),
  ruleType: z.string().min(1, '请选择业务类型'),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  priorityThreshold: z.coerce.number().int().optional(),
  amountThreshold: z.coerce.number().positive().optional(),
  statusCondition: z.string().optional(),
})

export default function AlertsPage() {
  const utils = useApiUtils()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules')
  const [readFilter, setReadFilter] = useState<string>('')

  const { data: rules = [] } = api.risk.listAlertRules.useQuery()
  const { data: logs = [] } = api.risk.listAlertLogs.useQuery({
    read: readFilter === 'unread' ? false : readFilter === 'read' ? true : undefined,
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      ruleType: 'PURCHASE_REQUIREMENT',
      severity: 'WARNING',
      priorityThreshold: undefined,
      amountThreshold: undefined,
      statusCondition: '',
    },
  })

  const create = api.risk.createAlertRule.useMutation({
    onSuccess: async () => {
      await utils.risk.listAlertRules.invalidate()
      setCreateOpen(false)
      form.reset()
    },
  })

  const toggle = api.risk.toggleAlertRule.useMutation({
    onSuccess: async () => await utils.risk.listAlertRules.invalidate(),
  })

  const markRead = api.risk.markAlertRead.useMutation({
    onSuccess: async () => await utils.risk.listAlertLogs.invalidate(),
  })

  const SeverityIcon = (s: string) =>
    s === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> :
    s === 'WARNING' ? <AlertCircle className="w-4 h-4" /> :
    <Info className="w-4 h-4" />

  const unreadCount = logs.filter(l => !l.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">提醒规则管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            联动框架协议、采购需求、供应商报价、交付记录，自动触发提醒
          </p>
        </div>
        <div className="action-group">
          <button
            onClick={() => setActiveTab(activeTab === 'rules' ? 'logs' : 'rules')}
            className="btn-secondary relative"
          >
            <Bell className="w-4 h-4" />
            {activeTab === 'rules' ? '查看日志' : '管理规则'}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </button>
          {activeTab === 'rules' && (
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> 新建规则
            </button>
          )}
        </div>
      </div>

      {activeTab === 'rules' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map(r => (
            <div key={r.id} className={`card p-5 ${!r.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{r.name}</h3>
                    <span className={`badge ${severityColors[r.severity as keyof typeof severityColors]} flex gap-1`}>
                      {SeverityIcon(r.severity)}
                      {r.severity === 'INFO' ? '提示' : r.severity === 'WARNING' ? '警告' : '严重'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {ruleTypeOptions.find(o => o.value === r.ruleType)?.label || r.ruleType}
                  </p>
                </div>
                <button
                  onClick={() => toggle.mutate({ id: r.id, enabled: !r.enabled })}
                  className={`p-2 rounded-lg transition-colors ${
                    r.enabled ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {r.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
              {r.description && <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{r.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">触发: {r._count.logs} 次</span>
                <span className={`badge ${r.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500'}`}>
                  {r.enabled ? '已启用' : '已停用'}
                </span>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="card p-12 text-center text-slate-500 dark:text-slate-400 md:col-span-2 lg:col-span-3">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              暂无提醒规则，点击右上角新建
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <select value={readFilter} onChange={e => setReadFilter(e.target.value)} className="input w-full sm:w-44">
              <option value="">全部</option>
              <option value="unread">未读</option>
              <option value="read">已读</option>
            </select>
          </div>
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>严重程度</th>
                    <th>规则</th>
                    <th>业务类型</th>
                    <th>消息</th>
                    <th>触发时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className={!l.read ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                      <td><span className={`badge ${severityColors[l.severity as keyof typeof severityColors]} flex gap-1 w-fit`}>{SeverityIcon(l.severity)}{l.severity}</span></td>
                      <td className="font-medium">{l.rule?.name || '-'}</td>
                      <td><span className="badge bg-slate-100 dark:bg-slate-800 text-xs">{l.sourceType}</span></td>
                      <td className="text-sm max-w-[280px] truncate" title={l.message}>{l.message}</td>
                      <td className="text-slate-500 dark:text-slate-400 whitespace-nowrap text-sm">{formatDateTime(l.createdAt)}</td>
                      <td>
                        {l.read
                          ? <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><CheckCircle2 className="w-3 h-3" />已读</span>
                          : <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">未读</span>
                        }
                      </td>
                      <td>
                        {!l.read && (
                          <button onClick={() => markRead.mutate(l.id)} className="btn-secondary py-1 px-2.5 text-xs">
                            标记已读
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      暂无提醒日志
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="新建提醒规则" size="lg">
        <form onSubmit={form.handleSubmit(d => {
          const conditions: Record<string, any> = {}
          if (d.priorityThreshold) conditions.priority = d.priorityThreshold
          if (d.amountThreshold) conditions.totalAmount = d.amountThreshold
          if (d.statusCondition) conditions.status = d.statusCondition
          create.mutate({
            name: d.name,
            description: d.description,
            ruleType: d.ruleType,
            severity: d.severity as 'INFO' | 'WARNING' | 'CRITICAL',
            conditions,
            actions: { notify: true, email: false },
          })
        })} className="space-y-4">
          <div className="form-grid">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="label">规则名称</label>
              <input {...form.register('name')} className="input" placeholder="如：大额采购需求自动提醒" />
            </div>
            <div>
              <label className="label">严重程度</label>
              <select {...form.register('severity')} className="input">
                <option value="INFO">提示</option>
                <option value="WARNING">警告</option>
                <option value="CRITICAL">严重</option>
              </select>
            </div>
            <div>
              <label className="label">业务类型</label>
              <select {...form.register('ruleType')} className="input">
                {ruleTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">优先级阈值（选填）</label>
              <input type="number" min="1" max="5" step="1" {...form.register('priorityThreshold' as any)} className="input" placeholder="1-5 级" />
            </div>
            <div>
              <label className="label">金额阈值（元，选填）</label>
              <input type="number" step="0.01" min="0" {...form.register('amountThreshold' as any)} className="input" placeholder="≥此金额触发" />
            </div>
            <div className="form-grid-full">
              <label className="label">规则描述（选填）</label>
              <textarea {...form.register('description')} className="input min-h-[60px]" rows={2} placeholder="规则说明，供管理员参考..." />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 inline mr-2" />
            提示：触发条件为"或"关系。满足任一条件即触发规则。触发的提醒会出现在通知日志中，并可能影响供应商风险评估。
          </div>

          <div className="action-group pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? '提交中...' : '创建规则'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
