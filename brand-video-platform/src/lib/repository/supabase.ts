/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TopicRepository } from './types'
import type { Topic, Script, TimelineEvent, TopicStatus, ScriptStatus } from '@/lib/types'
import type { Database } from '@/lib/supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateId } from '@/lib/utils'

function rowToTopic(row: any): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    brand_line: row.brand_line ?? '',
    target_platform: row.target_platform ?? [],
    expected_publish_date: row.expected_publish_date,
    tags: row.tags ?? [],
    status: row.status as TopicStatus,
    creator_id: row.creator_id,
    creator_name: row.creator_name,
    reviewer_id: row.reviewer_id,
    reviewer_name: row.reviewer_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToScript(row: any): Script {
  return {
    id: row.id,
    topic_id: row.topic_id,
    content: row.content,
    version: row.version,
    status: row.status as ScriptStatus,
    author_id: row.author_id,
    author_name: row.author_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToTimeline(row: any): TimelineEvent {
  return {
    id: row.id,
    topic_id: row.topic_id,
    event_type: row.event_type as TimelineEvent['event_type'],
    actor_id: row.actor_id,
    actor_name: row.actor_name,
    description: row.description,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
  }
}

export function createSupabaseRepository(client: SupabaseClient<Database>): TopicRepository {
  return {
    async listTopics(filters = {}) {
      let q: any = client.from('topics').select('*')

      if (filters.status) q = q.eq('status', filters.status)
      if (filters.creatorId) q = q.eq('creator_id', filters.creatorId)
      if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom)
      if (filters.dateTo) q = q.lte('created_at', `${filters.dateTo}T23:59:59Z`)
      if (filters.search) {
        q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.brandLine) q = q.eq('brand_line', filters.brandLine)
      if (filters.platforms && filters.platforms.length > 0)
        q = q.overlaps('target_platform', filters.platforms)
      if (filters.tags && filters.tags.length > 0) q = q.overlaps('tags', filters.tags)

      if (filters.orderBy) {
        q = q.order(filters.orderBy, { ascending: (filters.orderDir || 'desc') === 'asc' })
      } else {
        q = q.order('created_at', { ascending: false })
      }
      if (filters.limit) q = q.limit(filters.limit)
      if (filters.offset) q = q.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)

      const { data, error } = await q
      if (error) throw error
      return (data || []).map(rowToTopic)
    },

    async getTopic(id) {
      const { data, error } = await (client as any)
        .from('topics')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) return null
      return rowToTopic(data)
    },

    async createTopic(topic) {
      const id = generateId()
      const insertData: any = {
        id,
        title: topic.title,
        description: topic.description || null,
        brand_line: topic.brand_line || null,
        target_platform: topic.target_platform && topic.target_platform.length > 0 ? topic.target_platform : null,
        expected_publish_date: topic.expected_publish_date || null,
        tags: topic.tags && topic.tags.length > 0 ? topic.tags : null,
        status: topic.status,
        creator_id: topic.creator_id,
        creator_name: topic.creator_name,
        reviewer_id: topic.reviewer_id || null,
        reviewer_name: topic.reviewer_name || null,
      }
      const { data, error } = await (client as any)
        .from('topics')
        .insert(insertData)
        .select('*')
        .single()
      if (error || !data) throw error || new Error('Failed to create topic')
      return rowToTopic(data)
    },

    async updateTopic(id, updates) {
      const updateData: any = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description || null
      if (updates.brand_line !== undefined) updateData.brand_line = updates.brand_line || null
      if (updates.target_platform !== undefined) updateData.target_platform = updates.target_platform && updates.target_platform.length > 0 ? updates.target_platform : null
      if (updates.expected_publish_date !== undefined) updateData.expected_publish_date = updates.expected_publish_date || null
      if (updates.tags !== undefined) updateData.tags = updates.tags && updates.tags.length > 0 ? updates.tags : null
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.reviewer_id !== undefined) updateData.reviewer_id = updates.reviewer_id || null
      if (updates.reviewer_name !== undefined) updateData.reviewer_name = updates.reviewer_name || null

      const { data, error } = await (client as any)
        .from('topics')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      if (error || !data) return null
      return rowToTopic(data)
    },

    async listScripts(topicId) {
      const { data, error } = await (client as any)
        .from('scripts')
        .select('*')
        .eq('topic_id', topicId)
        .order('version', { ascending: false })
      if (error) throw error
      return (data || []).map(rowToScript)
    },

    async createScript(script) {
      const id = generateId()
      const insertData: any = {
        id,
        topic_id: script.topic_id,
        content: script.content,
        version: script.version,
        status: script.status,
        author_id: script.author_id,
        author_name: script.author_name,
      }
      const { data, error } = await (client as any)
        .from('scripts')
        .insert(insertData)
        .select('*')
        .single()
      if (error || !data) throw error || new Error('Failed to create script')
      return rowToScript(data)
    },

    async updateScript(id, updates) {
      const updateData: any = {}
      if (updates.content !== undefined) updateData.content = updates.content
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.version !== undefined) updateData.version = updates.version

      const { data, error } = await (client as any)
        .from('scripts')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      if (error || !data) return null
      return rowToScript(data)
    },

    async listTimeline(topicId) {
      const { data, error } = await (client as any)
        .from('timeline_events')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []).map(rowToTimeline)
    },

    async createTimelineEvent(event) {
      const id = generateId()
      const insertData: any = {
        id,
        topic_id: event.topic_id,
        event_type: event.event_type,
        actor_id: event.actor_id,
        actor_name: event.actor_name,
        description: event.description,
        metadata: event.metadata || {},
      }
      const { data, error } = await (client as any)
        .from('timeline_events')
        .insert(insertData)
        .select('*')
        .single()
      if (error || !data) throw error || new Error('Failed to create timeline event')
      return rowToTimeline(data)
    },
  }
}
