import type { TopicRepository } from './types'
import type { Topic, Script, TimelineEvent } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { mockTopics, mockScripts, mockTimelineEvents } from '@/lib/mock-data'

interface GlobalData {
  _topics: Topic[] | undefined
  _scripts: Script[] | undefined
  _timelineEvents: TimelineEvent[] | undefined
}

declare global {
  let __globalData: GlobalData | undefined
}

function ensureData(): { topics: Topic[]; scripts: Script[]; timelineEvents: TimelineEvent[] } {
  if (!globalThis.__globalData) {
    globalThis.__globalData = {
      _topics: undefined,
      _scripts: undefined,
      _timelineEvents: undefined,
    }
  }
  const data = globalThis.__globalData
  if (data._topics === undefined) {
    data._topics = JSON.parse(JSON.stringify(mockTopics)) as Topic[]
  }
  if (data._scripts === undefined) {
    data._scripts = JSON.parse(JSON.stringify(mockScripts)) as Script[]
  }
  if (data._timelineEvents === undefined) {
    data._timelineEvents = JSON.parse(JSON.stringify(mockTimelineEvents)) as TimelineEvent[]
  }
  return {
    topics: data._topics,
    scripts: data._scripts,
    timelineEvents: data._timelineEvents,
  }
}

export const memoryRepository: TopicRepository = {
  async listTopics(filters = {}) {
    const { topics } = ensureData()
    let result = [...topics]

    if (filters.status) result = result.filter((t) => t.status === filters.status)
    if (filters.creatorId) result = result.filter((t) => t.creator_id === filters.creatorId)
    if (filters.dateFrom) result = result.filter((t) => t.created_at >= filters.dateFrom)
    if (filters.dateTo) result = result.filter((t) => t.created_at <= filters.dateTo + 'T23:59:59Z')
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      )
    }
    if (filters.brandLine) result = result.filter((t) => t.brand_line === filters.brandLine)
    if (filters.platforms && filters.platforms.length > 0)
      result = result.filter((t) => filters.platforms!.some((p) => t.target_platform.includes(p)))
    if (filters.tags && filters.tags.length > 0)
      result = result.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)))

    if (filters.orderBy) {
      const key = filters.orderBy
      const dir = filters.orderDir || 'desc'
      result.sort((a, b) => {
        const av = a[key as keyof Topic] as unknown as string | number | undefined
        const bv = b[key as keyof Topic] as unknown as string | number | undefined
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        if (av < bv) return dir === 'asc' ? -1 : 1
        if (av > bv) return dir === 'asc' ? 1 : -1
        return 0
      })
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    if (filters.offset) result = result.slice(filters.offset)
    if (filters.limit) result = result.slice(0, filters.limit)

    return result
  },

  async getTopic(id) {
    const { topics } = ensureData()
    return topics.find((t) => t.id === id) || null
  },

  async createTopic(topic) {
    const { topics } = ensureData()
    const now = new Date().toISOString()
    const newTopic: Topic = {
      ...topic,
      id: generateId(),
      created_at: now,
      updated_at: now,
    }
    topics.unshift(newTopic)
    return newTopic
  },

  async updateTopic(id, updates) {
    const { topics } = ensureData()
    const idx = topics.findIndex((t) => t.id === id)
    if (idx === -1) return null
    topics[idx] = { ...topics[idx]!, ...updates, updated_at: new Date().toISOString() }
    return topics[idx]!
  },

  async listScripts(topicId) {
    const { scripts } = ensureData()
    return scripts
      .filter((s) => s.topic_id === topicId)
      .sort((a, b) => b.version - a.version)
  },

  async createScript(script) {
    const { scripts } = ensureData()
    const now = new Date().toISOString()
    const newScript: Script = {
      ...script,
      id: generateId(),
      created_at: now,
      updated_at: now,
    }
    scripts.unshift(newScript)
    return newScript
  },

  async updateScript(id, updates) {
    const { scripts } = ensureData()
    const idx = scripts.findIndex((s) => s.id === id)
    if (idx === -1) return null
    scripts[idx] = { ...scripts[idx]!, ...updates, updated_at: new Date().toISOString() }
    return scripts[idx]!
  },

  async listTimeline(topicId) {
    const { timelineEvents } = ensureData()
    return timelineEvents
      .filter((e) => e.topic_id === topicId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  async createTimelineEvent(event) {
    const { timelineEvents } = ensureData()
    const now = new Date().toISOString()
    const newEvent: TimelineEvent = {
      ...event,
      id: generateId(),
      created_at: now,
    }
    timelineEvents.unshift(newEvent)
    return newEvent
  },
}
