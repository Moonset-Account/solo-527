<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-8">
          <router-link to="/" class="flex items-center space-x-2">
            <span class="text-2xl">🏺</span>
            <span class="font-display text-xl font-bold text-primary-600">匠心手作</span>
          </router-link>
          <nav class="hidden md:flex items-center space-x-6">
            <router-link
              to="/courses"
              class="text-wood-700 hover:text-primary-600 transition-colors font-medium"
            >
              课程中心
            </router-link>
            <router-link
              to="/gallery"
              class="text-wood-700 hover:text-primary-600 transition-colors font-medium"
            >
              作品画廊
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/dashboard"
              class="text-wood-700 hover:text-primary-600 transition-colors font-medium"
            >
              运营看板
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/admin/courses"
              class="text-wood-700 hover:text-primary-600 transition-colors font-medium"
            >
              管理后台
            </router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <div class="relative hidden sm:block">
            <el-input
              v-model="searchQuery"
              placeholder="搜索课程、作品..."
              class="w-64"
              :prefix-icon="Search"
              size="default"
            />
          </div>
          <template v-if="authStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <div class="flex items-center space-x-2 cursor-pointer">
                <el-avatar :size="32" class="bg-primary-100">
                  {{ authStore.user?.name?.charAt(0) }}
                </el-avatar>
                <span class="text-sm font-medium text-wood-700 hidden sm:inline">
                  {{ authStore.user?.name }}
                </span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="text-wood-700 hover:text-primary-600 font-medium"
            >
              登录
            </router-link>
            <router-link
              to="/register"
              class="btn-primary text-sm py-2 px-4"
            >
              注册
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }
}
</script>
