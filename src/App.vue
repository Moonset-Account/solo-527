<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import FilterBar from '@/components/FilterBar.vue'
import { useAuthStore } from '@/stores/auth'

const sidebarPinned = ref(false)
const authStore = useAuthStore()
const route = useRoute()

provide('sidebarPinned', sidebarPinned)

onMounted(() => {
  authStore.init()
})
</script>

<template>
  <div v-if="route.name === 'login'">
    <router-view />
  </div>
  <div v-else class="flex h-screen bg-[#071E25] text-gray-100 overflow-hidden">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-auto">
      <div class="flex items-center justify-between px-4 md:px-6 pt-3">
        <FilterBar />
        <div class="flex items-center gap-3 shrink-0 ml-4">
          <span class="text-xs text-gray-400">{{ authStore.displayName }}</span>
          <span
            class="px-1.5 py-0.5 rounded text-[10px] font-medium"
            :class="{
              'bg-[#00B4D8]/10 text-[#00B4D8]': authStore.role === 'technician',
              'bg-[#F59E0B]/10 text-[#F59E0B]': authStore.role === 'manager',
              'bg-[#EF4444]/10 text-[#EF4444]': authStore.role === 'admin',
            }"
          >
            {{ authStore.roleLabel }}
          </span>
          <button
            class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            @click="authStore.logout(); $router.push('/login')"
          >
            退出
          </button>
        </div>
      </div>

      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
