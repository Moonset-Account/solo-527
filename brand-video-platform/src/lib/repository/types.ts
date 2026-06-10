import type { Topic, Script, TimelineEvent, TopicStatus } from '@/lib/types'

export interface TopicFilters {
  status?: TopicStatus
  creatorId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  brandLine?: string
  platforms?: string[]
  tags?: string[]
  orderBy?: keyof Topic
  orderDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface TopicRepository {
  listTopics(filters?: TopicFilters): Promise<Topic[]>
  getTopic(id: string): Promise<Topic | null>
  createTopic(topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>): Promise<Topic>
  updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | null>

  listScripts(topicId: string): Promise<Script[]>
  createScript(script: Omit<Script, 'id' | 'created_at' | 'updated_at'>): Promise<Script>
  updateScript(id: string, updates: Partial<Script>): Promise<Script | null>

  listTimeline(topicId: string): Promise<TimelineEvent[]>
  createTimelineEvent(event: Omit<TimelineEvent, 'id' | 'created_at'>): Promise<TimelineEvent>
}
