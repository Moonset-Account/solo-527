<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTheme } from '@/composables/useTheme'
import {
  DataLine,
  FolderOpened,
  TrendCharts,
  Stamp,
  Bell,
  Download,
  Clock,
  Fold,
  Expand,
  SwitchButton,
  Sunny,
  Moon,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const app = useAppStore()
const { theme, toggleTheme, isDark } = useTheme()

onMounted(() => {
  if (auth.isLoggedIn && !auth.user) {
    auth.fetchUser()
  }
  app.fetchNotifications()
})

const menuItems = [
  { index: '/', label: '运营仪表盘', icon: DataLine },
  { index: '/datasets', label: '数据集管理', icon: FolderOpened },
  { index: '/metrics', label: '指标维度', icon: TrendCharts },
  { index: '/approvals', label: '权限审批', icon: Stamp },
  { index: '/subscriptions', label: '异常订阅', icon: Bell },
  { index: '/exports', label: '报表导出', icon: Download },
  { index: '/history', label: '版本对比', icon: Clock },
]

const activeMenu = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  const match = menuItems.find(m => path.startsWith(m.index) && m.index !== '/')
  return match ? match.index : path
})

const sidebarWidth = computed(() =>
  app.sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
)

const breadcrumbItems = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title)
  return [{ title: '首页', path: '/' }, ...matched.map(r => ({ title: r.meta.title as string, path: r.path }))]
})

function handleSelect(index: string) {
  router.push(index)
}

function handleLogout() {
  auth.logout()
}
</script>

<template>
  <div class="flex h-full" :class="{ dark: isDark }">
    <aside
      class="fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-50"
      :style="{ width: sidebarWidth }"
      style="background: var(--color-primary)"
    >
      <div class="flex items-center h-14 px-4 shrink-0" style="border-bottom: 1px solid rgba(255,255,255,0.1)">
        <div class="flex items-center gap-2 overflow-hidden">
          <div class="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style="background: var(--color-accent)">
            <DataLine class="text-white" :size="18" />
          </div>
          <span
            v-show="!app.sidebarCollapsed"
            class="text-white font-semibold text-sm whitespace-nowrap"
            style="font-family: var(--font-heading)"
          >
            用户增长报表中心
          </span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="app.sidebarCollapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#10B981"
        class="flex-1 py-2 overflow-y-auto"
        @select="handleSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>

      <div
        class="shrink-0 flex items-center justify-center py-3 cursor-pointer hover:bg-white/5 transition-colors"
        style="border-top: 1px solid rgba(255,255,255,0.1)"
        @click="app.toggleSidebar"
      >
        <el-icon class="text-white/70"><component :is="app.sidebarCollapsed ? Expand : Fold" /></el-icon>
      </div>
    </aside>

    <div class="flex-1 flex flex-col transition-all duration-300" :style="{ marginLeft: sidebarWidth }">
      <header
        class="h-14 flex items-center justify-between px-6 shrink-0"
        style="background: var(--color-bg-card); border-bottom: 1px solid var(--color-border)"
      >
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="item in breadcrumbItems"
            :key="item.path"
            :to="item.path"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <div class="flex items-center gap-4">
          <el-badge :value="app.notifications.length" :hidden="app.notifications.length === 0" :max="99">
            <el-icon :size="20" class="cursor-pointer" style="color: var(--color-text-secondary)" @click="router.push('/subscriptions')">
              <Bell />
            </el-icon>
          </el-badge>

          <el-icon
            :size="20"
            class="cursor-pointer"
            style="color: var(--color-text-secondary)"
            @click="toggleTheme"
          >
            <component :is="isDark ? Sunny : Moon" />
          </el-icon>

          <div class="flex items-center gap-2 ml-2">
            <el-avatar :size="32" style="background: var(--color-accent)">
              {{ auth.user?.displayName?.charAt(0) || 'U' }}
            </el-avatar>
            <div v-if="auth.user" class="flex flex-col">
              <span class="text-sm font-medium" style="color: var(--color-text)">{{ auth.user.displayName }}</span>
              <span class="text-xs" style="color: var(--color-text-muted)">{{ auth.user.role }}</span>
            </div>
            <el-button :icon="SwitchButton" text size="small" @click="handleLogout" />
          </div>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto" style="background: var(--color-bg)">
        <router-view />
      </main>
    </div>
  </div>
</template>
