<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-4">
        <router-link to="/artworks" class="text-gray-500 hover:text-purple-600 flex items-center">
          <span class="mr-1">←</span> 返回作品列表
        </router-link>
      </div>
    </header>
    <main class="container py-8">
      <div class="max-w-3xl mx-auto">
        <div class="card overflow-hidden mb-6">
          <div class="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <span class="text-8xl opacity-50">🏺</span>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ artwork?.title }}</h1>
            <div class="flex items-center justify-between mb-4">
              <span class="text-gray-500">作者：{{ artwork?.student?.user?.name }}</span>
              <div class="flex items-center space-x-4 text-gray-500">
                <span>❤️ {{ artwork?.likes_count }}</span>
                <span>👁️ {{ artwork?.views_count }}</span>
              </div>
            </div>
            <p class="text-gray-600">{{ artwork?.description }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { artworkAPI } from '../../utils/api'
import type { Artwork } from '../../types'

const route = useRoute()
const artwork = ref<Artwork | null>(null)

onMounted(async () => {
  try {
    artwork.value = await artworkAPI.detail(Number(route.params.id))
  } catch (e) {
    console.error(e)
  }
})
</script>
