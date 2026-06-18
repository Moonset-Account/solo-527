<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, User, LogOut, ChevronRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta?.title)
  return matched.map((r) => ({ title: r.meta.title as string, path: r.path }))
})

function logout() {
  authStore.logout()
  router.push('/login')
}

const userName = computed(() => authStore.user?.realName || authStore.user?.username || '用户')
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
    <div class="flex items-center gap-2 text-sm">
      <router-link to="/" class="text-slate-400 hover:text-slate-600">首页</router-link>
      <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
        <ChevronRight class="w-4 h-4 text-slate-300" />
        <span
          :class="idx === breadcrumbs.length - 1 ? 'text-slate-700 font-medium' : 'text-slate-400'"
        >
          {{ crumb.title }}
        </span>
      </template>
    </div>

    <div class="flex items-center gap-4">
      <button class="relative p-2 rounded-md hover:bg-slate-100 transition-colors">
        <Bell class="w-5 h-5 text-slate-500" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <div class="relative">
        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          @click="showUserMenu = !showUserMenu"
        >
          <div class="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
            {{ userName.charAt(0) }}
          </div>
          <span class="text-sm text-slate-700">{{ userName }}</span>
        </button>

        <div
          v-if="showUserMenu"
          class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50"
          @mouseleave="showUserMenu = false"
        >
          <button
            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            @click="showUserMenu = false"
          >
            <User class="w-4 h-4" />
            个人信息
          </button>
          <button
            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            @click="logout"
          >
            <LogOut class="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
