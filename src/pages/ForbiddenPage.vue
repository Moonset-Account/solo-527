<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Lock, Home } from 'lucide-vue-next'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface p-4">
    <div class="text-center">
      <div class="w-32 h-32 mx-auto mb-8 rounded-full bg-amber-100 flex items-center justify-center">
        <Lock class="w-16 h-16 text-amber-500" />
      </div>
      
      <h1 class="text-6xl font-bold text-primary mb-4">403</h1>
      <h2 class="text-2xl font-semibold text-gray-900 mb-2">权限不足</h2>
      <p class="text-gray-500 mb-8 max-w-md mx-auto">
        抱歉，您没有权限访问此页面。请联系管理员获取相应的访问权限，或返回首页继续浏览。
      </p>
      
      <button
        @click="goHome"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
      >
        <Home class="w-5 h-5" />
        返回首页
      </button>
    </div>
  </div>
</template>
