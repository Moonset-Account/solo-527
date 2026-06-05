<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">作品审核</h2>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300']"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1 px-2 py-0.5 text-xs rounded-full" :class="activeTab === tab.value ? 'bg-white/20' : 'bg-gray-100'">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="artwork in filteredArtworks" :key="artwork.id" class="card overflow-hidden">
        <div class="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <span class="text-6xl opacity-50">🏺</span>
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-bold text-gray-800">{{ artwork.title }}</h3>
            <span :class="['badge', getStatusBadge(artwork.status)]">{{ getStatusLabel(artwork.status) }}</span>
          </div>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2">{{ artwork.description }}</p>
          <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>作者：{{ artwork.student?.user?.name }}</span>
            <span>{{ formatDate(artwork.created_at) }}</span>
          </div>
          <div v-if="artwork.status === 1" class="flex gap-2">
            <button @click="handleApprove(artwork)" class="btn btn-success btn-sm flex-1">
              ✓ 通过
            </button>
            <button @click="handleReject(artwork)" class="btn btn-danger btn-sm flex-1">
              ✕ 拒绝
            </button>
          </div>
          <div v-if="artwork.is_public" class="text-xs text-green-600 flex items-center">
            <span class="mr-1">🌐</span> 公开展示
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { artworkAPI } from '../../utils/api'
import type { Artwork, ArtworkStatus } from '../../types'

const artworks = ref<Artwork[]>([])
const activeTab = ref('pending')

const tabs = computed(() => [
  { value: 'pending', label: '待审核', count: artworks.value.filter(a => a.status === ArtworkStatus.PENDING_REVIEW).length },
  { value: 'published', label: '已发布', count: artworks.value.filter(a => a.status === ArtworkStatus.PUBLISHED).length },
  { value: 'rejected', label: '已拒绝', count: artworks.value.filter(a => a.status === ArtworkStatus.REJECTED).length },
  { value: 'all', label: '全部', count: artworks.value.length }
])

const filteredArtworks = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return artworks.value.filter(a => a.status === ArtworkStatus.PENDING_REVIEW)
    case 'published':
      return artworks.value.filter(a => a.status === ArtworkStatus.PUBLISHED)
    case 'rejected':
      return artworks.value.filter(a => a.status === ArtworkStatus.REJECTED)
    default:
      return artworks.value
  }
})

const getStatusLabel = (status: ArtworkStatus) => {
  const labels: Record<ArtworkStatus, string> = {
    [ArtworkStatus.DRAFT]: '草稿',
    [ArtworkStatus.PENDING_REVIEW]: '待审核',
    [ArtworkStatus.PUBLISHED]: '已发布',
    [ArtworkStatus.REJECTED]: '已拒绝',
    [ArtworkStatus.ARCHIVED]: '已归档'
  }
  return labels[status]
}

const getStatusBadge = (status: ArtworkStatus) => {
  const badges: Record<ArtworkStatus, string> = {
    [ArtworkStatus.DRAFT]: 'badge-secondary',
    [ArtworkStatus.PENDING_REVIEW]: 'badge-warning',
    [ArtworkStatus.PUBLISHED]: 'badge-success',
    [ArtworkStatus.REJECTED]: 'badge-danger',
    [ArtworkStatus.ARCHIVED]: 'badge-secondary'
  }
  return badges[status]
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const loadArtworks = async () => {
  try {
    const response = await artworkAPI.list({ per_page: 50 })
    artworks.value = response.artworks
  } catch (e) {
    console.error(e)
  }
}

const handleApprove = async (artwork: Artwork) => {
  if (!confirm('确定通过该作品的公开展示申请？')) return
  try {
    await artworkAPI.approve(artwork.id)
    await loadArtworks()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const handleReject = async (artwork: Artwork) => {
  const reason = prompt('请输入拒绝原因')
  if (reason === null) return
  try {
    await artworkAPI.reject(artwork.id, reason)
    await loadArtworks()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

onMounted(() => {
  loadArtworks()
})
</script>
