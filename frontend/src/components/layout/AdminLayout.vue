<template>
  <div class="min-h-screen bg-slate-50 flex">
    <aside
      class="flex flex-col bg-gradient-to-b from-deep-blue-900 to-deep-blue-800 text-white transition-all duration-300 fixed left-0 top-0 h-full z-40 shadow-2xl"
      :class="collapsed ? 'w-[80px]' : 'w-[240px]'"
    >
      <div class="h-16 flex items-center px-5 border-b border-white/10">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <NIcon size={20} color="#fff"><MailOutlined /></NIcon>
        </div>
        <transition name="fade">
          <span v-if="!collapsed" class="ml-3 font-charter text-xl font-bold tracking-wide whitespace-nowrap">
            邮件智能助手
          </span>
        </transition>
      </div>
      <nav class="flex-1 py-4 overflow-y-auto px-3">
        <ul class="space-y-1">
          <li v-for="item in menuItems" :key="item.path">
            <RouterLink
              :to="item.path"
              class="flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group"
              :class="{
                'bg-white/15 text-amber-gold-300 shadow-inner': isActive(item.path),
                'hover:bg-white/8 text-white/80 hover:text-white': !isActive(item.path)
              }"
            >
              <NIcon :size="20" class="flex-shrink-0">
                <component :is="item.icon" />
              </NIcon>
              <transition name="fade">
                <span v-if="!collapsed" class="ml-3 text-sm font-medium whitespace-nowrap">
                  {{ item.label }}
                </span>
              </transition>
              <transition name="fade">
                <span v-if="!collapsed && item.badge" class="ml-auto bg-amber-gold-500 text-deep-blue-900 text-xs px-2 py-0.5 rounded-full font-bold">
                  {{ item.badge }}
                </span>
              </transition>
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="p-3 border-t border-white/10">
        <div class="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center font-bold text-deep-blue-900 flex-shrink-0 text-sm">
              {{ user?.name?.charAt(0) || 'U' }}
            </div>
            <transition name="fade">
              <div v-if="!collapsed" class="ml-3 min-w-0 flex-1">
                <p class="text-sm font-medium truncate">{{ user?.name }}</p>
                <p class="text-xs text-white/50 truncate">{{ roleText }}</p>
              </div>
            </transition>
          </div>
          <transition name="fade">
            <button
              v-if="!collapsed"
              @click="handleLogout"
              class="mt-3 w-full flex items-center justify-center px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 text-xs transition-all"
            >
              <NIcon size={14} class="mr-1.5"><LogoutOutlined /></NIcon>
              退出登录
            </button>
          </transition>
        </div>
      </div>
    </aside>

    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="collapsed ? 'ml-[80px]' : 'ml-[240px]'"
    >
      <header class="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center px-6 shadow-sm">
        <button
          @click="toggleCollapsed"
          class="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-deep-blue-600 transition-all"
        >
          <NIcon size={18}>
            <MenuOutlined v-if="collapsed" />
            <MenuFoldOutlined v-else />
          </NIcon>
        </button>

        <div class="ml-4 flex items-center text-sm text-slate-500 min-w-0">
          <NBreadcrumb>
            <template #separator>
              <span class="mx-1.5 text-slate-300">/</span>
            </template>
            <NBreadcrumbItem v-for="item in breadcrumbs" :key="item.path">
              <RouterLink
                :to="item.path"
                class="hover:text-deep-blue-600 transition-colors"
                :class="{ 'text-deep-blue-600 font-medium': item.active }"
              >
                {{ item.label }}
              </RouterLink>
            </NBreadcrumbItem>
          </NBreadcrumb>
        </div>

        <div class="ml-auto flex items-center space-x-2">
          <NPopover trigger="hover" placement="bottom-end">
            <template #trigger>
              <button class="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-deep-blue-600 transition-all relative">
                <NIcon size={18}><BellOutlined /></NIcon>
                <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </template>
            <div class="w-80 py-2">
              <p class="px-4 py-2 font-charter font-bold text-deep-blue-900 text-sm border-b border-slate-100">通知消息</p>
              <div class="max-h-64 overflow-y-auto">
                <div
                  v-for="n in notifications"
                  :key="n.id"
                  class="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                >
                  <div class="flex items-start">
                    <span
                      class="w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0"
                      :class="{
                        'bg-red-500': n.type === 'urgent',
                        'bg-amber-gold-500': n.type === 'warning',
                        'bg-emerald-500': n.type === 'success'
                      }"
                    ></span>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-800">{{ n.title }}</p>
                      <p class="text-xs text-slate-400 mt-1">{{ n.time }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </NPopover>

          <NDropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <button class="flex items-center px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-deep-blue-500 to-deep-blue-700 flex items-center justify-center text-white font-bold text-sm">
                {{ user?.name?.charAt(0) || 'U' }}
              </div>
              <div class="ml-2.5 text-left hidden sm:block">
                <p class="text-sm font-medium text-slate-800 leading-tight">{{ user?.name }}</p>
                <p class="text-xs text-slate-400 leading-tight">{{ user?.department }}</p>
              </div>
              <NIcon size={14} class="ml-2 text-slate-400"><CaretDownOutlined /></NIcon>
            </button>
          </NDropdown>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <RouterView v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { NIcon, NBreadcrumb, NBreadcrumbItem, NPopover, NDropdown, useDialog, useMessage } from 'naive-ui'
import {
  DashboardOutlined,
  BookOutlined,
  MessageOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  AlertTriangleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MailOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  CaretDownOutlined
} from '@vicons/antd'
import type { DropdownOption, DropdownGroupOption, DropdownDividerOption } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const message = useMessage()
const dialog = useDialog()

const collapsed = computed(() => appStore.collapsed)
const user = computed(() => authStore.user)

const toggleCollapsed = () => appStore.toggleCollapsed()

const roleText = computed(() => {
  const map: Record<string, string> = { admin: '系统管理员', reviewer: '复核员', operator: '运营' }
  return map[user.value?.role || ''] || '用户'
})

const allMenuItems = [
  { path: '/dashboard', label: '销售工作台', icon: DashboardOutlined, roles: ['admin', 'reviewer', 'operator'] },
  { path: '/knowledge', label: '知识库管理', icon: BookOutlined, roles: ['admin', 'reviewer', 'operator'] },
  { path: '/templates', label: '话术版本中心', icon: MessageOutlined, roles: ['admin', 'reviewer', 'operator'] },
  { path: '/prompts', label: '提示词版本中心', icon: CodeOutlined, roles: ['admin'] },
  { path: '/reviews', label: '复核工作台', icon: CheckCircleOutlined, roles: ['admin', 'reviewer'], badge: '3' },
  { path: '/risks', label: '风险样本库', icon: AlertTriangleOutlined, roles: ['admin', 'reviewer'] },
  { path: '/analytics', label: '统计分析看板', icon: BarChartOutlined, roles: ['admin'] },
  { path: '/logs', label: '操作日志', icon: FileTextOutlined, roles: ['admin'] }
]

const menuItems = computed(() =>
  allMenuItems.filter(item => authStore.hasRole(item.roles))
)

const breadcrumbs = computed(() => {
  const crumbs: { path: string; label: string; active: boolean }[] = [{ path: '/dashboard', label: '首页', active: false }]
  const current = allMenuItems.find(i => i.path === route.path)
  if (current && current.path !== '/dashboard') {
    crumbs.push({ path: current.path, label: current.label, active: true })
  } else if (route.path === '/dashboard') {
    crumbs[0].active = true
  }
  return crumbs
})

const isActive = (path: string) => route.path === path

const notifications = [
  { id: 1, type: 'urgent', title: '有3封邮件等待您复核', time: '5分钟前' },
  { id: 2, type: 'warning', title: '知识库「邮件合规标准」已更新', time: '1小时前' },
  { id: 3, type: 'success', title: '提示词 v3.2.0 已全面生效', time: '2小时前' }
]

const userMenuOptions: Array<DropdownOption | DropdownGroupOption | DropdownDividerOption> = [
  { label: '个人中心', key: 'profile', icon: () => h(NIcon, null, { default: () => h(UserOutlined) }) },
  { label: '系统设置', key: 'settings', icon: () => h(NIcon, null, { default: () => h(SettingOutlined) }) },
  { type: 'divider' as const },
  { label: '退出登录', key: 'logout', icon: () => h(NIcon, null, { default: () => h(LogoutOutlined) }) }
]

function handleUserMenuSelect(key: string | number) {
  if (key === 'logout') {
    handleLogout()
  } else if (key === 'profile') {
    message.info('个人中心功能开发中')
  } else if (key === 'settings') {
    message.info('系统设置功能开发中')
  }
}

function handleLogout() {
  dialog.warning({
    title: '确认退出',
    content: '您确定要退出登录吗？',
    positiveText: '确定退出',
    negativeText: '取消',
    onPositiveClick: () => {
      authStore.logout()
      router.push({ name: 'Login' })
      message.success('已退出登录')
    }
  })
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease-out;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
