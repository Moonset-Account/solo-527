<script setup>
import { Link, usePage, router } from '@inertiajs/vue3'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const sidebarOpen = ref(false)
const configOpen = ref(false)

const page = usePage()
const flash = computed(() => page.props.flash || {})
const auth = computed(() => page.props.auth || {})

const logout = () => {
  router.post('/logout')
}

const currentPath = computed(() => page.url)

const isActive = (path) => {
  if (path === '/') return currentPath.value === '/'
  return currentPath.value.startsWith(path)
}

const isConfigActive = computed(() => {
  return ['/service-items', '/inspection-templates', '/cashier-orders', '/technicians', '/work-stations']
    .some(p => currentPath.value.startsWith(p))
})

const navItems = [
  { label: '仪表盘', href: '/', icon: 'dashboard' },
  { label: '工单管理', href: '/work-orders', icon: 'orders' },
  { label: '车辆记录', href: '/vehicles', icon: 'vehicles' },
  { label: '检测管理', href: '/work-orders?tab=inspection', icon: 'inspection' },
  {
    label: '配置管理', icon: 'config', children: [
      { label: '服务项目', href: '/service-items' },
      { label: '检测模板', href: '/inspection-templates' },
      { label: '收银单', href: '/cashier-orders' },
      { label: '技师管理', href: '/technicians' },
      { label: '工位管理', href: '/work-stations' },
    ]
  },
  { label: '质量报表', href: '/quality-reports', icon: 'reports' },
  { label: 'API故障', href: '/api-failure-logs', icon: 'api' },
  { label: '配置日志', href: '/config-audit-logs', icon: 'audit' },
]

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const toggleConfig = () => {
  configOpen.value = !configOpen.value
}

const handleEscape = (e) => {
  if (e.key === 'Escape') sidebarOpen.value = false
}

onMounted(() => document.addEventListener('keydown', handleEscape))
onUnmounted(() => document.removeEventListener('keydown', handleEscape))
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      <div class="flex items-center justify-between h-full px-4">
        <div class="flex items-center gap-3">
          <button @click="toggleSidebar" class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <Link href="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span class="text-lg font-semibold text-gray-900 hidden sm:block">洗车门店工单检测系统</span>
          </Link>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600 hidden sm:block">{{ auth.user?.name || '管理员' }}</span>
          <button @click="logout" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            退出
          </button>
        </div>
      </div>
    </nav>

    <aside :class="[sidebarOpen ? 'translate-x-0' : '-translate-x-full', 'lg:translate-x-0']" class="fixed top-16 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 overflow-y-auto">
      <div class="p-4" @click="closeSidebar">
        <nav class="space-y-1">
          <template v-for="item in navItems" :key="item.label">
            <div v-if="item.children">
              <button @click.stop="toggleConfig" :class="[isConfigActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50']" class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
                <span class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ item.label }}
                </span>
                <svg :class="[configOpen || isConfigActive ? 'rotate-90' : '']" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <div v-show="configOpen || isConfigActive" class="ml-8 mt-1 space-y-1">
                <Link v-for="child in item.children" :key="child.href" :href="child.href" :class="[isActive(child.href) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900']" class="block px-3 py-2 rounded-lg text-sm transition-colors">
                  {{ child.label }}
                </Link>
              </div>
            </div>

            <Link v-else :href="item.href" :class="[isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50']" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <svg v-if="item.icon === 'dashboard'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <svg v-else-if="item.icon === 'orders'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <svg v-else-if="item.icon === 'vehicles'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
              </svg>
              <svg v-else-if="item.icon === 'inspection'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <svg v-else-if="item.icon === 'reports'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <svg v-else-if="item.icon === 'api'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg v-else-if="item.icon === 'audit'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
              {{ item.label }}
            </Link>
          </template>
        </nav>
      </div>
    </aside>

    <div v-if="sidebarOpen" @click="closeSidebar" class="fixed inset-0 z-30 bg-black/25 lg:hidden"></div>

    <main class="lg:ml-64 pt-16">
      <div class="p-6">
        <div v-if="flash.success" class="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <svg class="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm text-green-800">{{ flash.success }}</span>
        </div>

        <div v-if="flash.error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm text-red-800">{{ flash.error }}</span>
        </div>

        <slot />
      </div>
    </main>
  </div>
</template>
