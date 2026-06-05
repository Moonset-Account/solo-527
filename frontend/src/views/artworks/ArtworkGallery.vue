<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-2">
          <span class="text-2xl">🎨</span>
          <span class="font-bold text-lg text-gray-800">手作工作室</span>
        </router-link>
        <nav class="flex items-center space-x-6">
          <router-link to="/courses" class="text-gray-600 hover:text-purple-600">课程</router-link>
          <router-link to="/calendar" class="text-gray-600 hover:text-purple-600">日历</router-link>
          <router-link to="/artworks" class="text-purple-600 font-medium">作品</router-link>
          <template v-if="authStore.isAuthenticated">
            <router-link to="/my/bookings" class="text-gray-600 hover:text-purple-600">我的</router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-outline btn-sm">登录</router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">学员作品展示</h1>
        <p class="text-gray-500">欣赏往期学员的精彩手作作品</p>
      </div>

      <div class="flex gap-2 mb-6">
        <button
          @click="sortBy = 'newest'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', sortBy === 'newest' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300']"
        >
          最新发布
        </button>
        <button
          @click="sortBy = 'popular'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', sortBy === 'popular' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300']"
        >
          最受欢迎
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <router-link
          v-for="artwork in artworks"
          :key="artwork.id"
          :to="`/artworks/${artwork.id}`"
          class="card overflow-hidden group hover:shadow-lg transition-all"
        >
          <div class="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center text-5xl opacity-60 group-hover:scale-110 transition-transform">
              🏺
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <div class="flex items-center justify-between text-white text-sm">
                <div class="flex items-center space-x-1">
                  <span>❤️</span>
                  <span>{{ artwork.likes_count }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <span>👁️</span>
                  <span>{{ artwork.views_count }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-3">
            <h3 class="font-medium text-gray-800 truncate">{{ artwork.title }}</h3>
            <p class="text-sm text-gray-500 truncate">{{ artwork.student?.user?.name }}</p>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { artworkAPI } from '../../utils/api'
import type { Artwork } from '../../types'

const authStore = useAuthStore()
const artworks = ref<Artwork[]>([])
const sortBy = ref<'newest' | 'popular'>('newest')
const loading = ref(true)

const loadArtworks = async () => {
  loading.value = true
  try {
    const response = await artworkAPI.list({ sort: sortBy.value, per_page: 24 })
    artworks.value = response.artworks
  } catch (e) {
    console.error('加载作品失败', e)
  } finally {
    loading.value = false
  }
}

watch(sortBy, () => loadArtworks())

onMounted(() => {
  loadArtworks()
})
</script>
