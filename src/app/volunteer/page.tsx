'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, Button, EmptyState, StatCard, Input, Textarea, Modal, Select } from '@/components/ui'
import { VolunteerStatusBadge } from '@/components/Badges'
import { formatDate, formatDateShort } from '@/lib/utils'

const statusFilters = [
  { value: undefined, label: '全部' },
  { value: 'PENDING', label: '招募中' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
] as const

export default function VolunteerPage() {
  const [status, setStatus] = useState<typeof statusFilters[number]['value']>(undefined)
  const [mineOnly, setMineOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState('设施维修')
  const [scheduledAt, setScheduledAt] = useState('')
  const [completeHours, setCompleteHours] = useState<number>(2)
  const [completeNote, setCompleteNote] = useState('')

  const { data: tasks, isLoading } = trpc.volunteer.listTasks.useQuery({ status, mineOnly })
  const { data: stats } = trpc.volunteer.stats.useQuery()
  const utils = trpc.useUtils()

  const signUpMutation = trpc.volunteer.signUp.useMutation({
    onSuccess: () => utils.volunteer.listTasks.invalidate(),
  })
  const cancelMutation = trpc.volunteer.cancelSignUp.useMutation({
    onSuccess: () => utils.volunteer.listTasks.invalidate(),
  })
  const createMutation = trpc.volunteer.createTask.useMutation({
    onSuccess: () => {
      setShowCreateModal(false)
      setTitle(''); setDesc(''); setType('设施维修'); setScheduledAt('')
      utils.volunteer.listTasks.invalidate()
    },
  })
  const completeMutation = trpc.volunteer.completeTask.useMutation({
    onSuccess: () => {
      setShowCompleteModal(false); setSelectedTask(null); setCompleteNote('')
      utils.volunteer.listTasks.invalidate()
    },
  })

  const volunteerTypes = ['设施维修', '环境维护', '秩序维护', '敬老助残', '文化活动', '宣传通知', '其他']

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🤝 志愿服务</h1>
          <p className="mt-1 text-sm text-slate-500">报名参与志愿活动，贡献社区力量</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setMineOnly(!mineOnly)}>
            {mineOnly ? '📋 我的任务' : '👥 全部任务'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>+ 发布任务</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <StatCard icon="📋" label="全部任务" value={stats?.totalTasks ?? 0} tone="blue" />
        <StatCard icon="✅" label="已完成" value={stats?.completedTasks ?? 0} tone="emerald" />
        <StatCard icon="⏱️" label="累计服务时长" value={`${stats?.totalHours ?? 0}h`} tone="purple" />
        <StatCard icon="⭐" label="我的服务时长" value={`${stats?.myHours ?? 0}h`} subtext={`完成 ${stats?.myCompletedTasks ?? 0} 项`} tone="amber" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(f => (
          <button
            key={f.value ?? 'all'}
            onClick={() => setStatus(f.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardBody><div className="h-24 animate-pulse rounded bg-slate-100" /></CardBody></Card>
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState icon="🤝" title="暂无任务" description={mineOnly ? "还没有报名的志愿任务" : "当前没有招募中的志愿任务"} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <Card key={task.id} className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 flex-1 min-w-0">{task.title}</h3>
                  <VolunteerStatusBadge status={task.status} />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="bg-purple-50 text-purple-700 rounded px-2 py-0.5">🏷️ {task.type}</span>
                  {task.scheduledAt && <span>📅 {formatDateShort(task.scheduledAt)}</span>}
                  {task.assignee && <span>👤 {task.assignee.name}</span>}
                  {task.hoursSpent && <span>⏱️ {task.hoursSpent}h</span>}
                </div>
                {task.damageReport && (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-xs text-blue-700">
                    🛠️ 关联维修: {task.damageReport.title}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  {task.status === 'PENDING' && (
                    <Button size="sm" onClick={() => signUpMutation.mutate({ id: task.id })} disabled={signUpMutation.isPending}>
                      我要报名
                    </Button>
                  )}
                  {task.status === 'CONFIRMED' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => cancelMutation.mutate({ id: task.id })} disabled={cancelMutation.isPending}>
                        取消报名
                      </Button>
                      <Button size="sm" onClick={() => { setSelectedTask(task.id); setShowCompleteModal(true) }}>
                        完成任务
                      </Button>
                    </>
                  )}
                  {task.status === 'COMPLETED' && task.note && (
                    <p className="text-xs text-slate-500 italic">📝 {task.note}</p>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {stats?.byType && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 志愿服务类型统计</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.byType.map(t => (
                <div key={t.type} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">{t.type}</span>
                    <span className="text-sm text-purple-600">{t._count.id} 次</span>
                  </div>
                  <p className="text-xs text-slate-500">累计 {t._sum.hoursSpent ?? 0} 小时</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="🤝 发布志愿任务"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({
              title, description: desc, type,
              scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            })} disabled={!title.trim() || !desc.trim() || createMutation.isPending}>
              {createMutation.isPending ? '发布中...' : '发布任务'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="任务标题" placeholder="例如：协助检查电梯故障" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea label="任务描述" placeholder="描述任务内容、时间地点、技能要求等..." value={desc} onChange={e => setDesc(e.target.value)} />
          <Select label="任务类型" value={type} onChange={e => setType(e.target.value)} options={volunteerTypes.map(t => ({ value: t, label: t }))} />
          <Input label="计划时间（可选）" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={showCompleteModal && !!selectedTask}
        onClose={() => { setShowCompleteModal(false); setSelectedTask(null); setCompleteNote('') }}
        title="✅ 完成志愿任务"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowCompleteModal(false); setSelectedTask(null) }}>取消</Button>
            <Button onClick={() => completeMutation.mutate({
              id: selectedTask!, hoursSpent: completeHours, note: completeNote || undefined,
            })} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? '提交中...' : '确认完成'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="服务时长（小时）" type="number" min={0.5} step={0.5} value={completeHours} onChange={e => setCompleteHours(parseFloat(e.target.value) || 0.5)} />
          <Textarea label="服务记录（可选）" placeholder="简要记录完成情况..." value={completeNote} onChange={e => setCompleteNote(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
