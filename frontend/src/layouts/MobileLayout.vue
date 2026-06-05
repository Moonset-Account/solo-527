<template>
  <div class="mobile-page min-h-screen bg-gray-50">
    <el-header class="bg-white border-b flex items-center justify-between px-4 sticky top-0 z-50" height="56px">
      <div class="text-lg font-medium text-gray-700">{{ pageTitle }}</div>
      <div class="flex items-center gap-2">
        <el-button v-if="showDesktop" text @click="$router.push('/dashboard')">
          <el-icon><Monitor /></el-icon>
        </el-button>
      </div>
    </el-header>
    
    <main class="p-4">
      <router-view />
    </main>
    
    <nav class="bottom-nav flex">
      <router-link to="/m/home" class="bottom-nav-item" :class="{ active: isActive('/m/home') }">
        <el-icon><HomeFilled /></el-icon>
        首页
      </router-link>
      <router-link to="/m/scan" class="bottom-nav-item" :class="{ active: isActive('/m/scan') }">
        <el-icon><QRCode /></el-icon>
        扫码
      </router-link>
      <router-link to="/m/requisition" class="bottom-nav-item" :class="{ active: isActive('/m/requisition') }">
        <el-icon><AddLocation /></el-icon>
        申请
      </router-link>
      <router-link to="/m/confirm" class="bottom-nav-item" :class="{ active: isActive('/m/confirm') }">
        <el-icon><CircleCheck /></el-icon>
        <span v-if="pendingCount > 0" class="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{{ pendingCount }}</span>
        确认
      </router-link>
      <router-link to="/m/profile" class="bottom-nav-item" :class="{ active: isActive('/m/profile') }">
        <el-icon><User /></el-icon>
        我的
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import {
  Monitor, HomeFilled, QRCode, AddLocation, CircleCheck, User
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageTitle = computed(() => (route.meta.title as string) || '')
const showDesktop = computed(() => userStore.isAdmin)
const pendingCount = ref(0)

function isActive(path: string) {
  return route.path === path
}

async function loadPendingCount() {
  try {
    const data = await api.get('/requisitions/pending-confirmation?limit=1') as any[]
    pendingCount.value = data.length || 0
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadPendingCount()
})
</script>
