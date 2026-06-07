<script setup lang="ts">
import { RouterLink as Link } from 'vue-router'
import { Lock, Home } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />

    <div class="flex-1 flex items-center justify-center p-4">
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <Lock class="w-10 h-10 text-red-500" />
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <p class="text-xl text-gray-600 mb-2">访问被拒绝</p>
        <p class="text-gray-500 mb-6">您没有权限访问此页面，请联系管理员</p>
        <Link to="/" class="btn-primary inline-flex">
          <Home class="w-4 h-4 mr-2" />
          返回首页
        </Link>
      </div>
    </div>
  </div>
</template>

