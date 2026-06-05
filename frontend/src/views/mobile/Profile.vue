<template>
  <div class="space-y-4">
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center">
      <el-avatar :size="64" class="mb-3">
        {{ user?.full_name?.charAt(0) || 'U' }}
      </el-avatar>
      <div class="text-xl font-bold">{{ user?.full_name }}</div>
      <div class="text-sm opacity-90 mt-1">
        <el-tag size="small" type="info">
          {{ roleText }}
        </el-tag>
      </div>
      <div class="text-sm opacity-75 mt-2">{{ user?.email }}</div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b">
        <div class="text-sm text-gray-500 mb-1">部门</div>
        <div class="font-medium">{{ user?.department || '未设置' }}</div>
      </div>
      <div class="p-4 border-b">
        <div class="text-sm text-gray-500 mb-1">电话</div>
        <div class="font-medium">{{ user?.phone || '未设置' }}</div>
      </div>
      <div class="p-4">
        <div class="text-sm text-gray-500 mb-1">注册时间</div>
        <div class="font-medium">{{ formatDate(user?.created_at) }}</div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b flex items-center justify-between" @click="$router.push('/m/requisitions')">
        <div class="flex items-center">
          <el-icon class="mr-3 text-blue-500"><Document /></el-icon>
          <span>我的申请</span>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>
      <div class="p-4 border-b flex items-center justify-between" @click="$router.push('/notifications')">
        <div class="flex items-center">
          <el-icon class="mr-3 text-orange-500"><Bell /></el-icon>
          <span>通知中心</span>
        </div>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="mr-2" />
        <el-icon><ArrowRight /></el-icon>
      </div>
      <div class="p-4 flex items-center justify-between" @click="clearCache">
        <div class="flex items-center">
          <el-icon class="mr-3 text-gray-500"><Delete /></el-icon>
          <span>清除缓存</span>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b flex items-center justify-between" v-if="isAdmin" @click="$router.push('/dashboard')">
        <div class="flex items-center">
          <el-icon class="mr-3 text-purple-500"><Monitor /></el-icon>
          <span>管理后台</span>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>
      <div class="p-4 flex items-center justify-between text-red-500" @click="handleLogout">
        <div class="flex items-center">
          <el-icon class="mr-3"><SwitchButton /></el-icon>
          <span>退出登录</span>
        </div>
      </div>
    </div>
    
    <div class="text-center text-xs text-gray-400 mt-8">
      试剂库存管理系统 v1.0.0
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import {
  Document, Bell, Delete, Monitor, SwitchButton, ArrowRight
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const isAdmin = computed(() => userStore.isAdmin)
const unreadCount = ref(0)

const roleText = computed(() => {
  const map: Record<string, string> = {
    admin: '管理员',
    member: '实验室成员',
    external: '外部用户'
  }
  return map[user.value?.role || ''] || user.value?.role
})

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function loadUnreadCount() {
  try {
    const data = await api.get('/notifications/unread-count') as any
    unreadCount.value = data.count
  } catch (e) {
    console.error(e)
  }
}

function clearCache() {
  localStorage.removeItem('scanHistory')
  ElMessage.success('缓存已清除')
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadUnreadCount()
})
</script>
