<template>
  <el-container class="h-screen">
    <el-aside width="220px" class="bg-gray-800">
      <div class="h-16 flex items-center justify-center text-white text-lg font-bold border-b border-gray-700">
        <el-icon class="mr-2"><Experiment /></el-icon>
        试剂库存系统
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#3b82f6"
        router
        class="border-none"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/reagents">
          <el-icon><Box /></el-icon>
          <span>试剂管理</span>
        </el-menu-item>
        <el-menu-item index="/storage">
          <el-icon><Warehouse /></el-icon>
          <span>柜位管理</span>
        </el-menu-item>
        <el-menu-item index="/requisitions">
          <el-icon><Document /></el-icon>
          <span>领用管理</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><Checked /></el-icon>
          <span>盘点管理</span>
        </el-menu-item>
        <el-menu-item index="/notifications">
          <el-icon><Bell /></el-icon>
          <span>通知中心</span>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="ml-2" />
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><PieChart /></el-icon>
          <span>报表中心</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/audit">
          <el-icon><DocumentCopy /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="bg-white border-b flex items-center justify-between px-6">
        <div class="text-lg font-medium text-gray-700">{{ pageTitle }}</div>
        <div class="flex items-center gap-4">
          <el-button text @click="$router.push('/m/home')">
            <el-icon class="mr-1"><Mobile /></el-icon>
            移动端
          </el-button>
          <el-dropdown @command="handleCommand">
            <div class="flex items-center cursor-pointer">
              <el-avatar :size="32" class="mr-2">
                {{ user?.full_name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="text-gray-700">{{ user?.full_name }}</span>
              <el-icon class="ml-1"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="bg-gray-50 overflow-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import {
  Experiment, DataAnalysis, Box, Warehouse, Document,
  Checked, Bell, PieChart, User, DocumentCopy,
  Mobile, ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isAdmin = computed(() => userStore.isAdmin)
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) || '')

function handleCommand(command: string) {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/m/profile')
  }
}

async function loadUnreadCount() {
  try {
    const data = await api.get('/notifications/unread-count') as any
    unreadCount.value = data.count
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadUnreadCount()
  setInterval(loadUnreadCount, 60000)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
