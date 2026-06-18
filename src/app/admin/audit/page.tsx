'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Button, Input, Select, Modal } from '@/components/ui'
import { formatDate } from '@/lib/utils'

const entityTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'Topic', label: '议题' },
  { value: 'Vote', label: '投票' },
  { value: 'Facility', label: '设施' },
  { value: 'DamageReport', label: '损坏报修' },
  { value: 'RectificationReview', label: '整改复查' },
  { value: 'VolunteerTask', label: '志愿任务' },
  { value: 'User', label: '用户' },
  { value: 'VotingRule', label: '投票规则' },
  { value: 'AuditLog', label: '审计日志' },
]

const adminNavItems = [
  { href: '/admin', label: '📊 仪表盘' },
  { href: '/admin/users', label: '👥 用户权限' },
  { href: '/admin/voting-rules', label: '⚙️ 投票规则' },
  { href: '/admin/audit', label: '📜 审计日志', active: true },
]

const actionLabelMap: Record<string, string> = {
  TOPIC_CREATE: '创建议题',
  TOPIC_PUBLISH: '发布议题',
  TOPIC_START_VOTING: '开始投票',
  TOPIC_CLOSE: '结束投票',
  TOPIC_VOTE: '参与投票',
  TOPIC_DELETE: '删除议题',
  FACILITY_CREATE: '创建设施',
  FACILITY_ADD_PHOTO: '添加照片',
  FACILITY_STATUS_UPDATE: '更新设施状态',
  FACILITY_DELETE: '删除设施',
  DAMAGE_REPORT_CREATE: '提交报修',
  DAMAGE_REPORT_UPDATE: '更新报修',
  RECTIFICATION_REVIEW_CREATE: '提交复查',
  VOLUNTEER_TASK_CREATE: '创建志愿任务',
  VOLUNTEER_SIGNUP: '报名志愿',
  VOLUNTEER_TASK_COMPLETE: '完成志愿任务',
  VOLUNTEER_CANCEL: '取消报名',
  VOLUNTEER_TASK_DELETE: '删除志愿任务',
  USER_ROLE_UPDATE: '更新用户角色',
  USER_PROFILE_UPDATE: '更新用户资料',
  VOTING_RULE_CREATE: '创建投票规则',
  VOTING_RULE_UPDATE: '更新投票规则',
  VOTING_RULE_DELETE: '删除投票规则',
  AUDIT_LOG_EXPORT: '导出审计日志',
  VOTE_EXPORT: '导出投票数据',
}

const entityLabel = (t: string) => entityTypeOptions.find(o => o.value === t)?.label || t

export default function AdminAuditPage() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const { data, isLoading } = trpc.admin.listAuditLogs.useQuery({
    entityType: entityType || undefined,
    action: action || undefined,
    limit: 200,
  })

  const [showExport, setShowExport] = useState(false)
  const [exportStart, setExportStart] = useState('')
  const [exportEnd, setExportEnd] = useState('')
  const [exportEntityType, setExportEntityType] = useState('')
  const [exportAction, setExportAction] = useState('')
  const [exportResult, setExportResult] = useState<any>(null)

  const exportQuery = trpc.admin.exportAuditLogs.useQuery(
    {
      startDate: exportStart ? new Date(exportStart) : undefined,
      endDate: exportEnd ? new Date(exportEnd + 'T23:59:59') : undefined,
      entityType: exportEntityType || undefined,
      action: exportAction || undefined,
    },
    { enabled: false }
  )

  const handleExport = async () => {
    const result = await exportQuery.refetch()
    if (result.data) {
      setExportResult(result.data)
      const csv = [
        result.data.headers.join(','),
        ...result.data.rows.map((row: string[]) =>
          row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">📜 审计日志</h1>
        <p className="mt-1 text-sm text-slate-500">管理员和审计员可查看全部操作记录并导出</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {adminNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              item.active
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>📜 操作记录</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="w-44">
              <Select value={entityType} onChange={e => setEntityType(e.target.value)} options={entityTypeOptions} />
            </div>
            <Input placeholder="操作类型筛选" value={action} onChange={e => setAction(e.target.value)} className="!w-40" />
            <Button variant="secondary" onClick={() => setShowExport(true)}>
              📥 导出 CSV
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <EmptyState icon="📜" title="暂无审计日志" />
          ) : (
            <>
              <div className="mb-3 text-xs text-slate-500">共 {data.total} 条记录</div>
              <div className="overflow-x-auto -mx-5">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">时间</th>
                      <th className="px-5 py-3">操作</th>
                      <th className="px-5 py-3 hidden sm:table-cell">实体类型</th>
                      <th className="px-5 py-3 hidden sm:table-cell">实体ID</th>
                      <th className="px-5 py-3">操作人</th>
                      <th className="px-5 py-3 hidden md:table-cell">IP地址</th>
                      <th className="px-5 py-3 hidden lg:table-cell">详情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-slate-900">
                            {actionLabelMap[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-sm bg-slate-100 text-slate-700 rounded px-2 py-0.5">
                            {entityLabel(log.entityType)}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell text-xs text-slate-400 font-mono">
                          {log.entityId ? `${log.entityId.slice(0, 8)}...` : '-'}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {log.user ? (
                            <div>
                              <div className="text-slate-900">{log.user.name}</div>
                              <div className="text-xs text-slate-500">{log.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">系统</span>
                          )}
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-sm text-slate-500">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          {log.detail && (
                            <pre className="text-xs text-slate-500 bg-slate-50 rounded p-1.5 overflow-x-auto max-w-xs">
                              {JSON.stringify(log.detail, null, 0)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showExport}
        onClose={() => { setShowExport(false); setExportResult(null) }}
        title="📥 导出审计日志"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowExport(false); setExportResult(null) }}>关闭</Button>
            <Button onClick={handleExport} disabled={exportQuery.isFetching}>
              {exportQuery.isFetching ? '生成中...' : '生成并下载 CSV'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            ⚠️ 导出操作本身将被记录到审计日志
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="开始日期" type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
            <Input label="结束日期" type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="实体类型" value={exportEntityType} onChange={e => setExportEntityType(e.target.value)} options={entityTypeOptions} />
            <Input label="操作类型（可选）" value={exportAction} onChange={e => setExportAction(e.target.value)} placeholder="如 TOPIC_VOTE" />
          </div>
          {exportResult && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
              ✅ 成功导出 {exportResult.count} 条记录
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
