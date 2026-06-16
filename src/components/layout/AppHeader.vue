<script setup lang="ts">
import { computed } from 'vue'
import { Bell, User, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useRemindersStore } from '@/stores/reminders'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const remindersStore = useRemindersStore()
const router = useRouter()

const displayName = computed(() => authStore.user?.displayName || '未登录')
const unreadCount = computed(() => remindersStore.unreadCount)

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-16 bg-white border-b border-rosegold/10 flex items-center justify-between px-6">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-medium text-gray-800">
        {{ $route.meta.title || '美甲库存管理系统' }}
      </h2>
    </div>
    <div class="flex items-center gap-4">
      <button
        class="relative p-2 rounded-lg hover:bg-rosegold/5 text-grayrose hover:text-rosegold transition-colors"
        @click="router.push('/reminders')"
      >
        <Bell class="w-5 h-5" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral text-white text-xs rounded-full flex items-center justify-center"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>
      <div class="h-6 w-px bg-rosegold/10" />
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-rosegold/10 flex items-center justify-center">
          <User class="w-4 h-4 text-rosegold" />
        </div>
        <span class="text-sm text-gray-700">{{ displayName }}</span>
        <button
          class="p-1.5 rounded-lg hover:bg-coral/5 text-grayrose hover:text-coral transition-colors"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>
</template>
