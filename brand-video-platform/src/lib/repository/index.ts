import type { TopicRepository } from './types'
import { memoryRepository } from './memory'
import { createSupabaseRepository } from './supabase'
import { createServerClient, hasSupabaseConfig } from '@/lib/supabase/server'

let cachedRepo: TopicRepository | null = null
let cachedIsSupabase = false

export async function getRepository(): Promise<{ repo: TopicRepository; isSupabase: boolean }> {
  if (cachedRepo && !process.env.NODE_ENV.startsWith('dev')) {
    return { repo: cachedRepo, isSupabase: cachedIsSupabase }
  }

  if (hasSupabaseConfig()) {
    try {
      const client = createServerClient()
      if (client) {
        const repo = createSupabaseRepository(client)
        const test = await client.from('topics').select('id', { count: 'exact', head: true })
        if (!test.error) {
          cachedRepo = repo
          cachedIsSupabase = true
          return { repo, isSupabase: true }
        }
        console.warn('[repository] Supabase 连接验证失败，回退到内存存储：', test.error?.message)
      }
    } catch (err) {
      console.warn('[repository] Supabase 初始化失败，回退到内存存储：', err)
    }
  }

  cachedRepo = memoryRepository
  cachedIsSupabase = false
  return { repo: memoryRepository, isSupabase: false }
}

export function getRepositoryNoAwait() {
  return { repo: memoryRepository, isSupabase: false }
}
