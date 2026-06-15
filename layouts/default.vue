<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <aside
      class="sidebar flex flex-col flex-shrink-0 w-64 h-full transition-all duration-300"
      :class="{ '-translate-x-full lg:translate-x-0 absolute lg:relative z-40': !sidebarOpen, 'translate-x-0 z-40': sidebarOpen }"
    >
      <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <component :is="icons.Tooth" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-800 leading-tight">{{ appName }}</h1>
          <p class="text-xs text-slate-400">客户关系管理系统</p>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <template v-for="section in menuSections" :key="section.title">
          <p class="px-3 pt-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {{ section.title }}
          </p>
          <template v-for="item in section.items" :key="item.path">
            <NuxtLink
              :to="item.path"
              class="nav-item group"
              :class="{ 'nav-item-active': isActive(item.path) }"
            >
              <component
                :is="item.icon"
                class="w-5 h-5 flex-shrink-0 transition-colors"
                :class="isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'"
              />
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="item.badge"
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="isActive(item.path) ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-600'"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>
          </template>
        </template>
      </nav>

      <div class="p-4 border-t border-slate-100">
        <div class="rounded-xl bg-gradient-to-br from-primary-50 to-white p-4 border border-primary-100">
          <div class="flex items-center gap-2 mb-2">
            <component :is="icons.Sparkles" class="w-4 h-4 text-primary-500" />
            <span class="text-sm font-semibold text-primary-700">升级黑钻</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed mb-3">
            本月新客户 128 位，转化率较上月提升 15%
          </p>
          <button class="btn btn-primary btn-sm w-full">查看详情</button>
        </div>
      </div>
    </aside>

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <header class="topbar flex items-center justify-between px-6 py-3.5 z-20">
        <div class="flex items-center gap-4">
          <button
            class="lg:hidden w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
            @click="sidebarOpen = !sidebarOpen"
          >
            <component :is="icons.Menu" class="w-5 h-5" />
          </button>

          <div class="hidden md:flex items-center gap-2 text-sm">
            <component :is="icons.Home" class="w-4 h-4 text-slate-400" />
            <span class="text-slate-400">/</span>
            <span class="text-slate-800 font-medium">{{ currentPageTitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <div class="hidden sm:block relative">
            <component
              :is="icons.Search"
              class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="搜索客户、顾问..."
              class="w-56 pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-transparent text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <button
            class="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
          >
            <component :is="icons.Bell" class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          <button
            class="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
          >
            <component :is="icons.Settings" class="w-5 h-5" />
          </button>

          <div class="relative" ref="userMenuRef">
            <button
              class="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              @click="userMenuOpen = !userMenuOpen"
            >
              <div class="avatar avatar-sm">
                {{ auth.currentUser?.name?.charAt(0) || 'U' }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-sm font-medium text-slate-800 leading-tight">
                  {{ auth.currentUser?.name }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ auth.getRoleName(auth.currentUser?.role || Role.MANAGER) }}
                </p>
              </div>
              <component :is="icons.ChevronDown" class="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            <div
              v-if="userMenuOpen"
              class="dropdown-menu right-0"
              style="right: 0; left: auto"
            >
              <div class="px-4 py-3 border-b border-slate-100">
                <p class="text-sm font-semibold text-slate-800">{{ auth.currentUser?.name }}</p>
                <p class="text-xs text-slate-500">{{ auth.currentUser?.username }}</p>
                <span class="mt-2 badge" :class="auth.getRoleColor(auth.currentUser?.role || Role.MANAGER)">
                  {{ auth.getRoleName(auth.currentUser?.role || Role.MANAGER) }}
                </span>
              </div>
              <div class="dropdown-item">
                <component :is="icons.User" class="w-4 h-4" />
                个人中心
              </div>
              <div class="dropdown-item">
                <component :is="icons.KeyRound" class="w-4 h-4" />
                修改密码
              </div>
              <div class="h-px bg-slate-100 my-1"></div>
              <div class="dropdown-item text-red-600 hover:bg-red-50 hover:text-red-600" @click="handleLogout">
                <component :is="icons.LogOut" class="w-4 h-4" />
                退出登录
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Home, LayoutDashboard, Users, Tag, Layers, UserCog,
  BarChart3, Target, CheckSquare, Menu, Bell, Settings,
  ChevronDown, Search, User, KeyRound, LogOut, Sparkles,
  Tooth, MessageSquare, GitBranch
} from 'lucide-vue-next'
import { Role } from '~/types'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const config = useRuntimeConfig()

const appName = config.public.appName || '牙科诊所客户画像库'

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const icons = {
  Home, LayoutDashboard, Users, Tag, Layers, UserCog,
  BarChart3, Target, CheckSquare, Menu, Bell, Settings,
  ChevronDown, Search, User, KeyRound, LogOut, Sparkles,
  Tooth, MessageSquare, GitBranch
}

interface MenuItem {
  path: string
  label: string
  icon: any
  badge?: string | number
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: '工作台',
    items: [
      { path: '/', label: '首页', icon: icons.Home },
      { path: '/front-desk', label: '前台工作台', icon: icons.LayoutDashboard, badge: 8 },
      { path: '/synergy', label: '协同视图', icon: icons.GitBranch },
    ],
  },
  {
    title: '客户管理',
    items: [
      { path: '/customers', label: '客户画像库', icon: icons.Users, badge: 128 },
      { path: '/consults', label: '咨询记录', icon: icons.MessageSquare },
    ],
  },
  {
    title: '数据配置',
    items: [
      { path: '/tags', label: '标签管理', icon: icons.Tag },
      { path: '/levels', label: '等级配置', icon: icons.Layers },
      { path: '/advisors', label: '顾问管理', icon: icons.UserCog },
    ],
  },
  {
    title: '数据分析',
    items: [
      { path: '/reports/conversion', label: '转化报表', icon: icons.BarChart3 },
      { path: '/reports/lead-quality', label: '线索质量', icon: icons.Target },
    ],
  },
  {
    title: '审批中心',
    items: [
      { path: '/approvals', label: '批量审批', icon: icons.CheckSquare, badge: 5 },
    ],
  },
]

const currentPageTitle = computed(() => {
  for (const section of menuSections) {
    const item = section.items.find(i => isActive(i.path))
    if (item) return item.label
  }
  return '首页'
})

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path === path || route.path.startsWith(path + '/')
}

function handleLogout() {
  auth.logout()
  userMenuOpen.value = false
  router.push('/login')
}

onMounted(() => {
  if (!auth.isAuthenticated.value && route.path !== '/login') {
    auth.loginAsDefault()
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
      userMenuOpen.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
})
</script>
