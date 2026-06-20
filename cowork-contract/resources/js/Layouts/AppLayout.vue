<script setup>
import { Link, usePage } from '@inertiajs/vue3'
import { ref } from 'vue'

const page = usePage()
const auth = page.props.auth
const sidebarOpen = ref(false)

const navItems = [
  { label: '合同管理', route: 'contracts.index', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: '账单管理', route: 'bills.index', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: '逾期账单', route: 'bills.overdue', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: '合同审核', route: 'reviews.pending', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { label: '风险清单', route: 'risks.index', icon: 'M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: '通知', route: 'notifications.index', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { label: '报表导出', route: 'reports.export', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="flex">
      <aside
        :class="[sidebarOpen ? 'translate-x-0' : '-translate-x-full', 'fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0']"
      >
        <div class="flex h-16 items-center justify-center border-b border-blue-800">
          <span class="text-lg font-bold text-white">联合办公合同管理系统</span>
        </div>
        <nav class="mt-4 px-2 space-y-1">
          <Link
            v-for="item in navItems"
            :key="item.route"
            :href="route(item.route)"
            :class="[route().current(item.route) ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white', 'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors']"
          >
            <svg class="mr-3 h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </Link>
        </nav>
      </aside>

      <div class="flex-1 flex flex-col min-h-screen">
        <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
          <button class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100" @click="sidebarOpen = !sidebarOpen">
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div class="hidden lg:block">
            <h2 class="text-sm font-medium text-gray-600">联合办公合同管理系统</h2>
          </div>
          <div class="flex items-center space-x-3">
            <span v-if="auth?.user" class="text-sm text-gray-600">{{ auth.user.name }}</span>
            <span v-if="auth?.user" class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{{ auth.user.role }}</span>
          </div>
        </header>

        <main class="flex-1 p-4 lg:p-6">
          <slot />
        </main>
      </div>
    </div>

    <div v-if="sidebarOpen" class="fixed inset-0 z-40 lg:hidden" @click="sidebarOpen = false">
      <div class="fixed inset-0 bg-gray-600 opacity-50"></div>
    </div>
  </div>
</template>
