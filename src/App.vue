<template>
  <div class="min-h-screen bg-[#F2F3F5]">
    <header class="bg-white border-b border-[#E5E6EB] sticky top-0 z-50">
      <div class="px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#165DFF] flex items-center justify-center">
            <Clock class="w-5 h-5 text-white" />
          </div>
          <span class="text-lg font-semibold text-[#1D2129]">出餐时长监控系统</span>
        </div>
        <nav class="flex items-center gap-1">
          <router-link
            to="/"
            class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            :class="$route.path === '/' ? 'bg-[#165DFF]/10 text-[#165DFF]' : 'text-[#4E5969] hover:bg-[#F2F3F5]'"
          >
            <span class="flex items-center gap-2">
              <Map class="w-4 h-4" />
              商圈地图
            </span>
          </router-link>
          <router-link
            to="/reports"
            class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            :class="$route.path === '/reports' ? 'bg-[#165DFF]/10 text-[#165DFF]' : 'text-[#4E5969] hover:bg-[#F2F3F5]'"
          >
            <span class="flex items-center gap-2">
              <BarChart3 class="w-4 h-4" />
              数据报表
            </span>
          </router-link>
        </nav>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#165DFF]/10 flex items-center justify-center">
            <User class="w-4 h-4 text-[#165DFF]" />
          </div>
          <span class="text-sm text-[#4E5969]">运营管理员</span>
        </div>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Clock, Map, BarChart3, User } from 'lucide-vue-next'
</script>