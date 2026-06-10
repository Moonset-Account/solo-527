import { create } from 'zustand'
import { Topic, Script, Task, Schedule, ExceptionRecord, TimelineEvent, Profile, TopicStatus, TaskStatus, ExceptionStatus, ScheduleStatus } from './types'
import { mockTopics, mockScripts, mockTasks, mockSchedules, mockExceptions, mockTimelineEvents, mockProfiles } from './mock-data'

interface AppState {
  topics: Topic[]
  scripts: Script[]
  tasks: Task[]
  schedules: Schedule[]
  exceptions: ExceptionRecord[]
  timelineEvents: TimelineEvent[]
  profiles: Profile[]
  currentUserId: string

  addTopic: (topic: Topic) => void
  updateTopicStatus: (id: string, status: TopicStatus, reviewerId?: string) => void
  addScript: (script: Script) => void
  updateScriptStatus: (id: string, status: Script['status']) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  addSchedule: (schedule: Schedule) => void
  updateScheduleStatus: (id: string, status: ScheduleStatus) => void
  resolveException: (id: string, conclusion: string) => void
  updateExceptionStatus: (id: string, status: ExceptionStatus) => void
  addTimelineEvent: (event: TimelineEvent) => void

  getTopicsByStatus: (status: TopicStatus) => Topic[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  getExceptionsByStatus: (status: ExceptionStatus) => ExceptionRecord[]
  getTopicById: (id: string) => Topic | undefined
  getScriptsByTopicId: (topicId: string) => Script[]
  getTasksByTopicId: (topicId: string) => Task[]
  getTimelineByTopicId: (topicId: string) => TimelineEvent[]
  getPersonnelLoad: () => Record<string, number>
}

export const useAppStore = create<AppState>((set, get) => ({
  topics: mockTopics,
  scripts: mockScripts,
  tasks: mockTasks,
  schedules: mockSchedules,
  exceptions: mockExceptions,
  timelineEvents: mockTimelineEvents,
  profiles: mockProfiles,
  currentUserId: 'u1',

  addTopic: (topic) => set((s) => ({ topics: [topic, ...s.topics] })),

  updateTopicStatus: (id, status, reviewerId) =>
    set((s) => ({
      topics: s.topics.map((t) =>
        t.id === id ? { ...t, status, updated_at: new Date().toISOString(), ...(reviewerId ? { reviewer_id: reviewerId, reviewer_name: s.profiles.find((p) => p.id === reviewerId)?.display_name } : {}) } : t
      ),
    })),

  addScript: (script) => set((s) => ({ scripts: [script, ...s.scripts] })),

  updateScriptStatus: (id, status) =>
    set((s) => ({
      scripts: s.scripts.map((sc) => (sc.id === id ? { ...sc, status, updated_at: new Date().toISOString() } : sc)),
    })),

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)),
    })),

  addSchedule: (schedule) => set((s) => ({ schedules: [schedule, ...s.schedules] })),

  updateScheduleStatus: (id, status) =>
    set((s) => ({
      schedules: s.schedules.map((sc) => (sc.id === id ? { ...sc, status, updated_at: new Date().toISOString() } : sc)),
    })),

  resolveException: (id, conclusion) =>
    set((s) => ({
      exceptions: s.exceptions.map((e) =>
        e.id === id ? { ...e, status: 'resolved' as ExceptionStatus, conclusion, handler_id: s.currentUserId, handler_name: s.profiles.find((p) => p.id === s.currentUserId)?.display_name ?? null, resolved_at: new Date().toISOString() } : e
      ),
    })),

  updateExceptionStatus: (id, status) =>
    set((s) => ({
      exceptions: s.exceptions.map((e) =>
        e.id === id ? { ...e, status, handler_id: s.currentUserId, handler_name: s.profiles.find((p) => p.id === s.currentUserId)?.display_name ?? null } : e
      ),
    })),

  addTimelineEvent: (event) => set((s) => ({ timelineEvents: [event, ...s.timelineEvents] })),

  getTopicsByStatus: (status) => get().topics.filter((t) => t.status === status),
  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
  getExceptionsByStatus: (status) => get().exceptions.filter((e) => e.status === status),
  getTopicById: (id) => get().topics.find((t) => t.id === id),
  getScriptsByTopicId: (topicId) => get().scripts.filter((s) => s.topic_id === topicId),
  getTasksByTopicId: (topicId) => get().tasks.filter((t) => t.topic_id === topicId),
  getTimelineByTopicId: (topicId) => get().timelineEvents.filter((e) => e.topic_id === topicId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  getPersonnelLoad: () => {
    const loads: Record<string, number> = {}
    get().tasks
      .filter((t) => t.status === 'assigned' || t.status === 'in_progress')
      .forEach((t) => {
        if (t.assignee_id) {
          loads[t.assignee_id] = (loads[t.assignee_id] || 0) + 1
        }
      })
    return loads
  },
}))
