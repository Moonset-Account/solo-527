<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-6">
        <h1 class="text-2xl font-bold text-gray-800">学员作品墙</h1>
        <p class="text-gray-500 mt-1">探索手作艺术，欣赏学员们的精彩作品</p>
      </div>
    </header>

    <main class="container py-8">
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="tag in allTags"
          :key="tag"
          @click="toggleTag(tag)"
          :class="['px-4 py-2 rounded-full text-sm font-medium transition-all', selectedTags.includes(tag) ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50']"
        >
          {{ tag }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-16">
        <div class="loading-spinner mx-auto mb-4 w-10 h-10 border-3"></div>
        <p class="text-gray-400">加载作品中...</p>
      </div>

      <div v-else-if="artworks.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4">🎨</div>
        <p class="text-gray-500">暂无公开作品，敬请期待~</p>
      </div>

      <div v-else class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        <div
          v-for="artwork in filteredArtworks"
          :key="artwork.id"
          class="break-inside-avoid"
        >
          <div class="card overflow-hidden cursor-pointer group" @click="showDetail(artwork)">
            <div class="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                :src="getArtworkImage(artwork.id)"
                :alt="artwork.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div class="flex items-center gap-2 text-sm">
                    <span>❤️ {{ artwork.likes_count || 0 }}</span>
                    <span>👁️ {{ artwork.views_count || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-bold text-gray-800 line-clamp-1">{{ artwork.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">
                by {{ artwork.student?.user?.name || '匿名学员' }}
              </p>
              <div v-if="artwork.tags && artwork.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                <span v-for="tag in artwork.tags.slice(0, 3)" :key="tag" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="selectedArtwork" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" @click.self="selectedArtwork = null">
      <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 h-full">
          <div class="aspect-square md:aspect-auto bg-gray-100">
            <img
              :src="getArtworkImage(selectedArtwork.id)"
              :alt="selectedArtwork.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="p-6 overflow-y-auto">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-800">{{ selectedArtwork.title }}</h2>
                <div class="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                  <span>❤️ {{ selectedArtwork.likes_count || 0 }}</span>
                  <span>👁️ {{ selectedArtwork.views_count || 0 }}</span>
                </div>
              </div>
              <button @click="selectedArtwork = null" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                {{ selectedArtwork.student?.user?.name?.charAt(0) || '👤' }}
              </div>
              <div>
                <div class="font-medium text-gray-800">{{ selectedArtwork.student?.user?.name || '匿名学员' }}</div>
                <div class="text-xs text-gray-500">
                  作品发布于 {{ formatDate(selectedArtwork.created_at) }}
                </div>
              </div>
            </div>

            <p class="text-gray-600 leading-relaxed mb-4">{{ selectedArtwork.description }}</p>

            <div v-if="selectedArtwork.tags && selectedArtwork.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
              <span v-for="tag in selectedArtwork.tags" :key="tag" class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                #{{ tag }}
              </span>
            </div>

            <div v-if="selectedArtwork.course_session" class="p-4 bg-amber-50 rounded-xl">
              <div class="text-sm text-amber-800">
                <span class="font-bold">🎓 来自课程：</span>
                {{ selectedArtwork.course_session.course?.title }}
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-100 flex gap-3">
              <button @click="handleLike(selectedArtwork)" class="btn btn-secondary flex-1">
                ❤️ 点赞
              </button>
              <button class="btn btn-primary flex-1">
                💬 留言
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
import type { Artwork } from '../../types'

const artworks = ref<Artwork[]>([])
const loading = ref(true)
const selectedArtwork = ref<Artwork | null>(null)
const selectedTags = ref<string[]>([])

const allTags = computed(() => {
  const tags = new Set<string>()
  artworks.value.forEach(a => a.tags?.forEach(t => tags.add(t)))
  return ['全部', ...Array.from(tags)]
})

const filteredArtworks = computed(() => {
  if (selectedTags.value.length === 0 || selectedTags.value.includes('全部')) {
    return artworks.value
  }
  return artworks.value.filter(a => a.tags?.some(t => selectedTags.value.includes(t)))
})

const toggleTag = (tag: string) => {
  if (tag === '全部') {
    selectedTags.value = []
  } else {
    const idx = selectedTags.value.indexOf(tag)
    if (idx > -1) {
      selectedTags.value.splice(idx, 1)
    } else {
      selectedTags.value.push(tag)
    }
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const showDetail = (artwork: Artwork) => {
  selectedArtwork.value = artwork
  artworkAPI.incrementView(artwork.id)
}

const handleLike = async (artwork: Artwork) => {
  try {
    await artworkAPI.like(artwork.id)
    artwork.likes_count = (artwork.likes_count || 0) + 1
  } catch (e) {
    console.error('点赞失败', e)
  }
}

const loadArtworks = async () => {
  loading.value = true
  try {
    const res = await artworkAPI.list({ is_public: true, status: 2, per_page: 50 })
    artworks.value = res.artworks || []
  } catch (e) {
    console.error('加载作品失败', e)
  } finally {
    loading.value = false
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
