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
  dataSource: 'memory' | 'supabase' | 'api' | 'loading'

  hydrateTopics: () => Promise<void>
  addTopic: (topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>) => Promise<Topic>
  updateTopicStatus: (id: string, status: TopicStatus, reviewerId?: string, reviewerName?: string) => Promise<Topic | null>
  addScript: (script: Omit<Script, 'id' | 'created_at' | 'updated_at'>) => Promise<Script>
  loadTopicScripts: (topicId: string) => Promise<void>
  updateScriptStatus: (id: string, status: Script['status']) => Promise<Script | null>
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  addSchedule: (schedule: Schedule) => void
  updateScheduleStatus: (id: string, status: ScheduleStatus) => void
  resolveException: (id: string, conclusion: string) => void
  updateExceptionStatus: (id: string, status: ExceptionStatus) => void
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'created_at'>) => Promise<TimelineEvent | TimelineEvent>
  loadTopicTimeline: (topicId: string) => Promise<void>

  getTopicsByStatus: (status: TopicStatus) => Topic[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  getExceptionsByStatus: (status: ExceptionStatus) => ExceptionRecord[]
  getTopicById: (id: string) => Topic | undefined
  getScriptsByTopicId: (topicId: string) => Script[]
  getTasksByTopicId: (topicId: string) => Task[]
  getTimelineByTopicId: (topicId: string) => TimelineEvent[]
  getPersonnelLoad: () => Record<string, number>
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const json = await res.json()
  return json.data as T
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
  dataSource: 'memory',

  hydrateTopics: async () => {
    try {
      const params = new URLSearchParams({ orderBy: 'created_at', orderDir: 'desc' })
      const topics = await apiFetch<Topic[]>(`/api/topics?${params}`)
      set({ topics, dataSource: 'api' })
    } catch (err) {
      console.warn('[store] hydrateTopics 失败，保持内存数据：', err)
    }
  },

  addTopic: async (topic) => {
    try {
      const created = await apiFetch<Topic>('/api/topics', {
        method: 'POST',
        body: JSON.stringify(topic),
      })
      set((s) => ({ topics: [created, ...s.topics] }))
      return created
    } catch (err) {
      console.warn('[store] addTopic API 失败，fallback 到内存：', err)
      const now = new Date().toISOString()
      const created: Topic = {
        ...topic,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        created_at: now,
        updated_at: now,
      }
      set((s) => ({ topics: [created, ...s.topics] }))
      const ev: TimelineEvent = {
        id: `${Date.now()}-tl`,
        topic_id: created.id,
        event_type: 'topic_created',
        actor_id: topic.creator_id,
        actor_name: topic.creator_name,
        description: `创建选题：${topic.title}`,
        metadata: {},
        created_at: now,
      }
      set((s) => ({ timelineEvents: [ev, ...s.timelineEvents] }))
      return created
    }
  },

  updateTopicStatus: async (id, status, reviewerId, reviewerName) => {
    const reviewer = reviewerId
      ? { reviewer_id: reviewerId, reviewer_name: reviewerName || get().profiles.find((p) => p.id === reviewerId)?.display_name }
      : {}
    try {
      const updated = await apiFetch<Topic>(`/api/topics/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...reviewer }),
      })
      set((s) => ({ topics: s.topics.map((t) => (t.id === id ? updated : t)) }))
      return updated
    } catch (err) {
      console.warn('[store] updateTopicStatus API 失败，fallback 到内存：', err)
      let updated: Topic | null = null
      set((s) => {
        const mapped = s.topics.map((t) => {
          if (t.id !== id) return t
          updated = { ...t, status, updated_at: new Date().toISOString(), ...reviewer } as Topic
          return updated
        })
        const ev: TimelineEvent = {
          id: `${Date.now()}-tl`,
          topic_id: id,
          event_type: status === 'approved' ? 'topic_approved' : 'topic_rejected',
          actor_id: reviewer.reviewer_id || s.currentUserId,
          actor_name: reviewer.reviewer_name || s.profiles.find((p) => p.id === reviewer.reviewer_id)?.display_name || '张明远',
          description: status === 'approved' ? '审批通过选题' : '驳回选题',
          metadata: {},
          created_at: new Date().toISOString(),
        }
        return { topics: mapped, timelineEvents: [ev, ...s.timelineEvents] }
      })
      return updated
    }
  },

  addScript: async (script) => {
    try {
      const created = await apiFetch<Script>(`/api/topics/${script.topic_id}/scripts`, {
        method: 'POST',
        body: JSON.stringify(script),
      })
      set((s) => ({ scripts: [created, ...s.scripts] }))
      return created
    } catch (err) {
      console.warn('[store] addScript API 失败，fallback 到内存：', err)
      const now = new Date().toISOString()
      const created: Script = {
        ...script,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        created_at: now,
        updated_at: now,
      }
      set((s) => {
        const ev: TimelineEvent = {
          id: `${Date.now()}-tl`,
          topic_id: script.topic_id,
          event_type: 'script_submitted',
          actor_id: script.author_id,
          actor_name: script.author_name,
          description: `提交脚本 v${script.version}`,
          metadata: { version: script.version, status: script.status },
          created_at: now,
        }
        return { scripts: [created, ...s.scripts], timelineEvents: [ev, ...s.timelineEvents] }
      })
      return created
    }
  },

  loadTopicScripts: async (topicId) => {
    try {
      const list = await apiFetch<Script[]>(`/api/topics/${topicId}/scripts`)
      set((s) => {
        const other = s.scripts.filter((x) => x.topic_id !== topicId)
        return { scripts: [...list, ...other] }
      })
    } catch (err) {
      console.warn('[store] loadTopicScripts 失败：', err)
    }
  },

  updateScriptStatus: async (id, status) => {
    let updated: Script | null = null
    set((s) => {
      const mapped = s.scripts.map((sc) => {
        if (sc.id !== id) return sc
        updated = { ...sc, status, updated_at: new Date().toISOString() }
        return updated
      })
      return { scripts: mapped }
    })
    return updated
  },

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
        e.id === id
          ? {
              ...e,
              status: 'resolved' as ExceptionStatus,
              conclusion,
              handler_id: s.currentUserId,
              handler_name: s.profiles.find((p) => p.id === s.currentUserId)?.display_name ?? null,
              resolved_at: new Date().toISOString(),
            }
          : e
      ),
    })),

  updateExceptionStatus: (id, status) =>
    set((s) => ({
      exceptions: s.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              handler_id: s.currentUserId,
              handler_name: s.profiles.find((p) => p.id === s.currentUserId)?.display_name ?? null,
            }
          : e
      ),
    })),

  addTimelineEvent: async (event) => {
    try {
      const created = await apiFetch<TimelineEvent>(`/api/topics/${event.topic_id}/timeline`, {
        method: 'POST',
        body: JSON.stringify(event),
      })
      set((s) => ({ timelineEvents: [created, ...s.timelineEvents] }))
      return created
    } catch (err) {
      console.warn('[store] addTimelineEvent API 失败，fallback 到内存：', err)
      const created: TimelineEvent = {
        ...event,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        created_at: new Date().toISOString(),
      }
      set((s) => ({ timelineEvents: [created, ...s.timelineEvents] }))
      return created
    }
  },

  loadTopicTimeline: async (topicId) => {
    try {
      const list = await apiFetch<TimelineEvent[]>(`/api/topics/${topicId}/timeline`)
      set((s) => {
        const other = s.timelineEvents.filter((x) => x.topic_id !== topicId)
        return { timelineEvents: [...list, ...other] }
      })
    } catch (err) {
      console.warn('[store] loadTopicTimeline 失败：', err)
    }
  },

  getTopicsByStatus: (status) => get().topics.filter((t) => t.status === status),
  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
  getExceptionsByStatus: (status) => get().exceptions.filter((e) => e.status === status),
  getTopicById: (id) => get().topics.find((t) => t.id === id),
  getScriptsByTopicId: (topicId) => get().scripts.filter((s) => s.topic_id === topicId).sort((a, b) => b.version - a.version),
  getTasksByTopicId: (topicId) => get().tasks.filter((t) => t.topic_id === topicId),
  getTimelineByTopicId: (topicId) => get().timelineEvents.filter((e) => e.topic_id === topicId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  getPersonnelLoad: () => {
    const loads: Record<string, number> = {}
    get()
      .tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress')
      .forEach((t) => {
        if (t.assignee_id) loads[t.assignee_id] = (loads[t.assignee_id] || 0) + 1
      })
    return loads
  },
}))
