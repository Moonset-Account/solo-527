'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Task, TASK_STATUS_MAP, TaskType, TaskStatus } from '@/lib/types'
import { formatDate, generateId } from '@/lib/utils'
import { UserPlus, Play, CheckCircle, Video, Film, Users } from 'lucide-react'

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; color: string; bg: string; border: string }> = {
  filming: { label: '拍摄', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  editing: { label: '剪辑', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
}

type Column = {
  key: string
  title: string
  statuses: TaskStatus[]
  headerColor: string
}

const COLUMNS: Column[] = [
  { key: 'pending', title: '待分派', statuses: ['pending'], headerColor: 'bg-gray-100 text-gray-700' },
  { key: 'active', title: '进行中', statuses: ['assigned', 'in_progress'], headerColor: 'bg-amber-100 text-amber-700' },
  { key: 'completed', title: '已完成', statuses: ['completed'], headerColor: 'bg-green-100 text-green-700' },
]

export default function TasksPage() {
  const { tasks, profiles, updateTask, addTimelineEvent, currentUserId, getPersonnelLoad } = useAppStore()
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const personnelLoad = getPersonnelLoad()

  const cameramen = profiles.filter((p) => p.role === 'cameraman')
  const editors = profiles.filter((p) => p.role === 'editor')

  const activePersonnel = profiles.filter((p) => p.role === 'cameraman' || p.role === 'editor')
  const maxLoad = Math.max(...activePersonnel.map((p) => personnelLoad[p.id] || 0), 1)

  const getTasksForColumn = (column: Column): Task[] => {
    return tasks.filter((t) => column.statuses.includes(t.status))
  }

  const handleAssign = (task: Task, personId: string) => {
    const person = profiles.find((p) => p.id === personId)
    if (!person) return
    updateTask(task.id, {
      assignee_id: person.id,
      assignee_name: person.display_name,
      status: 'assigned',
    })
    addTimelineEvent({
      id: generateId(),
      topic_id: task.topic_id,
      event_type: 'task_assigned',
      actor_id: currentUserId,
      actor_name: profiles.find((p) => p.id === currentUserId)?.display_name || '',
      description: `分派${TASK_TYPE_CONFIG[task.type].label}任务给${person.display_name}`,
      metadata: { task_type: task.type },
      created_at: new Date().toISOString(),
    })
    setAssigningTaskId(null)
  }

  const handleStatusAdvance = (task: Task) => {
    const nextStatus: Record<string, TaskStatus> = {
      assigned: 'in_progress',
      in_progress: 'completed',
    }
    const next = nextStatus[task.status]
    if (!next) return
    updateTask(task.id, { status: next })
    if (next === 'completed') {
      addTimelineEvent({
        id: generateId(),
        topic_id: task.topic_id,
        event_type: 'task_completed',
        actor_id: currentUserId,
        actor_name: profiles.find((p) => p.id === currentUserId)?.display_name || '',
        description: `完成${TASK_TYPE_CONFIG[task.type].label}任务`,
        metadata: { task_type: task.type },
        created_at: new Date().toISOString(),
      })
    }
  }

  const getEligibleAssignees = (task: Task) => {
    return task.type === 'filming' ? cameramen : editors
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="flex gap-6">
        <div className={`flex-1 ${sidebarOpen ? '' : 'w-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-brand-500">任务看板</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost"
            >
              <Users size={18} />
              {sidebarOpen ? '隐藏负载' : '人员负载'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksForColumn(column)
              return (
                <div key={column.key} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`status-badge ${column.headerColor}`}>
                      {column.title}
                    </span>
                    <span className="text-xs text-surface-400">{columnTasks.length}</span>
                  </div>
                  <div className="flex flex-col gap-3 min-h-[200px]">
                    {columnTasks.map((task) => {
                      const typeConfig = TASK_TYPE_CONFIG[task.type]
                      return (
                        <div key={task.id} className="card p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium text-brand-500 leading-snug">
                              {task.topic_title}
                            </h3>
                            <span className={`status-badge text-xs ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border shrink-0`}>
                              {task.type === 'filming' ? <Film size={12} /> : <Video size={12} />}
                              {typeConfig.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-surface-400">
                            {task.deadline && (
                              <span>截止: {formatDate(task.deadline)}</span>
                            )}
                            {task.assignee_name && (
                              <span>负责人: {task.assignee_name}</span>
                            )}
                          </div>

                          {task.status !== 'completed' && (
                            <span className={`status-badge text-xs ${TASK_STATUS_MAP[task.status].color}`}>
                              {TASK_STATUS_MAP[task.status].label}
                            </span>
                          )}

                          <div className="flex items-center gap-2 mt-auto pt-1">
                            {task.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setAssigningTaskId(assigningTaskId === task.id ? null : task.id)}
                                  className="btn-ghost text-xs"
                                >
                                  <UserPlus size={14} />
                                  分派
                                </button>
                              </>
                            )}

                            {task.status === 'assigned' && (
                              <button
                                onClick={() => handleStatusAdvance(task)}
                                className="btn-ghost text-xs"
                              >
                                <Play size={14} />
                                开始
                              </button>
                            )}

                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusAdvance(task)}
                                className="btn-ghost text-xs text-green-600 hover:text-green-700"
                              >
                                <CheckCircle size={14} />
                                完成
                              </button>
                            )}
                          </div>

                          {assigningTaskId === task.id && (
                            <div className="border border-surface-200 rounded-lg p-2 mt-1 bg-surface-50">
                              <p className="text-xs text-surface-400 mb-2">
                                选择{task.type === 'filming' ? '摄影师' : '剪辑师'}：
                              </p>
                              <div className="flex flex-col gap-1">
                                {getEligibleAssignees(task).map((person) => (
                                  <button
                                    key={person.id}
                                    onClick={() => handleAssign(task, person.id)}
                                    className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md hover:bg-surface-200 transition-colors text-left"
                                  >
                                    <span className="text-brand-500">{person.display_name}</span>
                                    <span className="text-surface-400">
                                      {personnelLoad[person.id] || 0} 个任务
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {columnTasks.length === 0 && (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-surface-200 rounded-xl">
                        <span className="text-xs text-surface-400">暂无任务</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {sidebarOpen && (
          <div className="w-72 shrink-0">
            <div className="card p-5 sticky top-6">
              <h2 className="section-title mb-4">人员负载</h2>
              <div className="flex flex-col gap-4">
                {activePersonnel.map((person) => {
                  const load = personnelLoad[person.id] || 0
                  const pct = (load / maxLoad) * 100
                  return (
                    <div key={person.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-brand-500">{person.display_name}</span>
                        <span className="text-xs text-surface-400">
                          {load} 个任务
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            load >= 3 ? 'bg-red-400' : load >= 2 ? 'bg-amber-400' : 'bg-accent-400'
                          }`}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
