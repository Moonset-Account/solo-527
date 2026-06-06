<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">作品审核</h2>
      <div class="flex gap-2">
        <button
          v-for="s in statusFilters"
          :key="s.value"
          @click="currentStatus = s.value"
          :class="['px-3 py-2 rounded-lg text-sm font-medium', currentStatus === s.value ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
        >
          {{ s.label }}
          <span v-if="s.count !== undefined" class="ml-1">({{ s.count }})</span>
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作品</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学员</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">课程</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">公开授权</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="artwork in artworks" :key="artwork.id" class="hover:bg-gray-50">
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      :src="getArtworkImage(artwork.id)"
                      :alt="artwork.title"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div class="font-medium text-gray-800 line-clamp-1">{{ artwork.title }}</div>
                    <div class="text-xs text-gray-500">❤️ {{ artwork.likes_count }} · 👁️ {{ artwork.views_count }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ artwork.student?.user?.name || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ artwork.course_session?.course?.title || '-' }}
              </td>
              <td class="px-4 py-4">
                <span :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', artwork.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']">
                  {{ artwork.is_public ? '✅ 已授权' : '🔒 未授权' }}
                </span>
              </td>
              <td class="px-4 py-4">
                <span :class="['badge', getStatusBadge(artwork.status)]">{{ getStatusLabel(artwork.status) }}</span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ formatDate(artwork.created_at) }}
              </td>
              <td class="px-4 py-4">
                <div class="flex gap-2">
                  <button
                    @click="viewArtwork = artwork"
                    class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    查看
                  </button>
                  <button
                    v-if="artwork.status === ArtworkStatus.PENDING_REVIEW"
                    @click="approveArtwork(artwork)"
                    class="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    通过
                  </button>
                  <button
                    v-if="artwork.status === ArtworkStatus.PENDING_REVIEW"
                    @click="rejectArtwork(artwork)"
                    class="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    拒绝
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination && pagination.total_pages > 1" class="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
        <p class="text-sm text-gray-500">共 {{ pagination.total_count }} 条</p>
        <div class="flex gap-2">
          <button @click="loadArtworks(currentPage - 1)" :disabled="currentPage <= 1" class="btn btn-secondary text-sm" :class="{ 'opacity-50 cursor-not-allowed': currentPage <= 1 }">
            上一页
          </button>
          <span class="px-4 py-2 text-sm">{{ currentPage }} / {{ pagination.total_pages }}</span>
          <button @click="loadArtworks(currentPage + 1)" :disabled="currentPage >= pagination.total_pages" class="btn btn-secondary text-sm" :class="{ 'opacity-50 cursor-not-allowed': currentPage >= pagination.total_pages }">
            下一页
          </button>
        </div>
      </div>
    </div>

    <div v-if="viewArtwork" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" @click.self="viewArtwork = null">
      <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 h-full">
          <div class="aspect-square md:aspect-auto bg-gray-100">
            <img
              :src="getArtworkImage(viewArtwork.id)"
              :alt="viewArtwork.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="p-6 overflow-y-auto">
            <div class="flex items-start justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-800">{{ viewArtwork.title }}</h2>
              <button @click="viewArtwork = null" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  {{ viewArtwork.student?.user?.name?.charAt(0) || '👤' }}
                </div>
                <div>
                  <div class="font-medium text-gray-800">{{ viewArtwork.student?.user?.name || '匿名学员' }}</div>
                  <div class="text-xs text-gray-500">提交于 {{ formatDate(viewArtwork.created_at) }}</div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-1">作品描述</h4>
                <p class="text-gray-600 text-sm">{{ viewArtwork.description || '暂无描述' }}</p>
              </div>

              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-1">当前状态</h4>
                <span :class="['badge', getStatusBadge(viewArtwork.status)]">{{ getStatusLabel(viewArtwork.status) }}</span>
              </div>

              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">公开授权</h4>
                <div class="flex items-center gap-2">
                  <span :class="['inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium', viewArtwork.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']">
                    {{ viewArtwork.is_public ? '✅ 学员已授权公开展示' : '🔒 学员未授权公开展示' }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-2">
                  只有学员授权公开展示的作品，才能在作品墙展示
                </p>
              </div>

              <div v-if="viewArtwork.tags && viewArtwork.tags.length > 0">
                <h4 class="text-sm font-medium text-gray-700 mb-2">标签</h4>
                <div class="flex flex-wrap gap-2">
                  <span v-for="tag in viewArtwork.tags" :key="tag" class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    #{{ tag }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="viewArtwork.status === ArtworkStatus.PENDING_REVIEW" class="mt-6 pt-6 border-t border-gray-100 flex gap-3">
              <button @click="approveArtwork(viewArtwork); viewArtwork = null" class="btn btn-success flex-1">
                ✅ 审核通过
              </button>
              <button @click="rejectArtwork(viewArtwork); viewArtwork = null" class="btn btn-danger flex-1">
                ❌ 拒绝
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { artworkAPI } from '../../utils/api'
import { getArtworkImage } from '../../utils/images'
import { ArtworkStatus } from '../../types'
import type { Artwork, ApiResponse } from '../../types'

const artworks = ref<Artwork[]>([])
const currentStatus = ref<number | null>(null)
const currentPage = ref(1)
const pagination = ref<{ total_pages: number; total_count: number } | null>(null)
const viewArtwork = ref<Artwork | null>(null)

const statusFilters = computed(() => [
  { label: '全部', value: null },
  { label: '待审核', value: ArtworkStatus.PENDING_REVIEW },
  { label: '已发布', value: ArtworkStatus.PUBLISHED },
  { label: '已拒绝', value: ArtworkStatus.REJECTED }
])

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

const loadArtworks = async (page = 1) => {
  currentPage.value = page
  const params: any = { page, per_page: 20 }
  if (currentStatus.value !== null) params.status = currentStatus.value
  try {
    const res: any = await artworkAPI.list(params)
    artworks.value = res.artworks || []
    pagination.value = res.meta
  } catch (e) {
    console.error('加载作品失败', e)
  }
}

const approveArtwork = async (artwork: Artwork) => {
  if (!confirm('确定审核通过该作品？')) return
  try {
    await artworkAPI.approve(artwork.id)
    artwork.status = ArtworkStatus.PUBLISHED
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const rejectArtwork = async (artwork: Artwork) => {
  const reason = prompt('请输入拒绝原因：')
  if (reason === null) return
  try {
    await artworkAPI.reject(artwork.id, reason)
    artwork.status = ArtworkStatus.REJECTED
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

onMounted(() => {
  loadArtworks()
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
