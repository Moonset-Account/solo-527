import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Tag, TagQueryLogic } from '@/types'
import { tagsApi } from '@/api'

export const useTagsStore = defineStore('tags', () => {
  const list = ref<Tag[]>([])
  const loading = ref(false)
  const selectedTag = ref<Tag | null>(null)
  const tagProfile = ref<{
    radar: { axis: string; value: number }[]
    distribution: { source: string; count: number }[]
  } | null>(null)

  async function fetchList(group?: string) {
    loading.value = true
    try {
      const { data } = await tagsApi.list(group)
      list.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile(id: number) {
    const { data } = await tagsApi.profile(id)
    tagProfile.value = data
  }

  async function createTag(data: Partial<Tag>) {
    await tagsApi.create(data)
  }

  async function updateTag(id: number, data: Partial<Tag>) {
    await tagsApi.update(id, data)
  }

  async function deleteTag(id: number) {
    await tagsApi.delete(id)
  }

  async function batchQuery(tagIds: number[], logic: TagQueryLogic) {
    const { data } = await tagsApi.batchQuery(tagIds, logic)
    return data
  }

  return {
    list, loading, selectedTag, tagProfile,
    fetchList, fetchProfile, createTag, updateTag, deleteTag, batchQuery,
  }
})
