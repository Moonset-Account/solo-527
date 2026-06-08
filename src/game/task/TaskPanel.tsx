import { useState } from 'react'
import { Clock, Users, Package, CheckCircle, XCircle } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { PRIORITY_CONFIG, EVENT_TYPE_CONFIG, formatTime } from '@/types/game'
import type { Task } from '@/types/game'
import AssignModal from './AssignModal'

export default function TaskPanel() {
  const { tasks, zones, elapsedTime } = useGameStore()
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.failed !== b.failed) return a.failed ? 1 : -1
    return PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order
  })

  const getZoneName = (zoneId: string) => zones.find((z) => z.id === zoneId)?.name ?? ''

  const getTimeRemaining = (task: Task) => {
    const remaining = task.timeLimit - (elapsedTime - task.createdAt)
    return Math.max(0, remaining)
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1a2332' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: '#2a3a4a' }}>
        <h2 className="text-sm font-semibold text-gray-200">任务列表</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedTasks.map((task) => {
          const priorityCfg = PRIORITY_CONFIG[task.priority]
          const eventCfg = EVENT_TYPE_CONFIG[task.eventType]
          const timeRemaining = getTimeRemaining(task)
          const isUrgent = timeRemaining <= 10 && !task.completed && !task.failed

          return (
            <div
              key={task.id}
              className="relative flex items-start gap-2 px-3 py-2.5 border-b transition-colors"
              style={{
                borderColor: '#2a3a4a',
                opacity: task.completed ? 0.5 : task.failed ? 0.6 : 1,
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r" style={{ backgroundColor: priorityCfg.color }} />

              <div className="flex-1 ml-2 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{eventCfg.icon}</span>
                  <span
                    className={`text-sm font-medium text-gray-200 truncate ${
                      task.completed ? 'line-through' : ''
                    }`}
                    style={task.failed ? { color: '#ef4444' } : undefined}
                  >
                    {task.name}
                  </span>
                  {task.completed && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                  {task.failed && <XCircle size={14} className="text-red-400 shrink-0" />}
                </div>

                <div className="text-[11px] text-gray-400 mt-0.5">{getZoneName(task.zoneId)}</div>

                <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                  <span className={`flex items-center gap-1 ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
                    <Clock size={11} />
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Users size={11} />
                    {task.assignedTeams}/{task.requiredTeams}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Package size={11} />
                    {task.assignedSupplies}/{task.requiredSupplies}
                  </span>
                </div>
              </div>

              {!task.completed && !task.failed && (
                <button
                  onClick={() => setAssigningTaskId(task.id)}
                  className="shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                  style={{ backgroundColor: '#ff6b35', color: '#fff' }}
                >
                  分配
                </button>
              )}
            </div>
          )
        })}
      </div>

      {assigningTaskId && (
        <AssignModal taskId={assigningTaskId} onClose={() => setAssigningTaskId(null)} />
      )}
    </div>
  )
}
