<script setup>
import { Link, usePage } from '@inertiajs/vue3'
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'

const props = defineProps({
  auth: Object,
  pageTitle: {
    type: String,
    default: '',
  },
})

const page = usePage()
const sidebarOpen = ref(false)

const flashSuccess = computed(() => page.props.flash?.success)
const flashError = computed(() => page.props.flash?.error)

const isAdminOrPrincipal = computed(() => {
  const role = props.auth?.user?.role
  return role === 'admin' || role === 'principal'
})

const navGroups = computed(() => {
  const groups = [
    {
      label: '概览',
      items: [
        { label: '仪表盘', route: 'dashboard', icon: 'dashboard' },
      ],
    },
    {
      label: '教学',
      items: [
        { label: '艺考班级', route: 'art-classes.index', icon: 'class' },
        { label: '作品反馈', route: 'artworks.index', icon: 'artwork' },
        { label: '阶段报告', route: 'stage-reports.index', icon: 'report' },
      ],
    },
    {
      label: '运营',
      items: [
        { label: '家校反馈', route: 'home-school-feedback.index', icon: 'feedback' },
        { label: '试听预约', route: 'trial-bookings.index', icon: 'trial' },
        { label: '老师课时', route: 'teacher-hours.index', icon: 'hours' },
        { label: '学生档案', route: 'students.index', icon: 'student' },
      ],
    },
  ]

  if (isAdminOrPrincipal.value) {
    groups.push({
      label: '管理',
      items: [
        { label: '排课冲突', route: 'schedule-conflicts.index', icon: 'conflict' },
        { label: '招生转化', route: 'enrollment-conversions.index', icon: 'conversion' },
        { label: '字典管理', route: 'admin.dictionaries.index', icon: 'dict' },
        { label: '临时策略', route: 'admin.temporary-strategies.index', icon: 'strategy' },
      ],
    })
  }

  return groups
})

const currentRoute = computed(() => page.url)

function isActive(routeName) {
  try {
    const url = route(routeName)
    return currentRoute.value === url
  } catch {
    return false
  }
}

function logout() {
  router.post('/logout')
}

const roleLabels = {
  admin: '管理员',
  principal: '校长',
  teacher: '教师',
  staff: '教务',
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/30 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center h-16 px-6 border-b border-gray-200 shrink-0">
          <Link href="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span class="text-lg font-bold text-gray-900">艺考报告中心</span>
          </Link>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-3">
          <div v-for="group in navGroups" :key="group.label" class="mb-4">
            <p class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ group.label }}</p>
            <ul class="space-y-0.5">
              <li v-for="item in group.items" :key="item.route">
                <Link
                  :href="route(item.route)"
                  :class="[
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.route)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  ]"
                  @click="sidebarOpen = false"
                >
                  {{ item.label }}
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div class="shrink-0 border-t border-gray-200 p-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-indigo-700">{{ auth?.user?.name?.charAt(0) || '?' }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ auth?.user?.name }}</p>
              <span class="inline-block px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                {{ roleLabels[auth?.user?.role] || auth?.user?.role }}
              </span>
            </div>
            <button
              @click="logout"
              class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="退出登录"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-30 flex items-center h-16 px-4 sm:px-6 bg-white border-b border-gray-200 gap-4">
        <button
          class="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>
      </header>

      <div v-if="flashSuccess" class="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
        {{ flashSuccess }}
      </div>
      <div v-if="flashError" class="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {{ flashError }}
      </div>

      <main class="p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
