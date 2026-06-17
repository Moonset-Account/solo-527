<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-indigo-600">社区治理平台</span>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link v-for="item in navItems" :key="item.href" :href="item.href"
                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
                :class="isCurrent(item.href) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'">
                {{ item.label }}
              </Link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">{{ $page.props.auth.user?.name }}（{{ roleLabel }}）</span>
            <button @click="logout" class="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded-md">
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="$page.props.flash.success"
        class="mb-6 p-4 border border-green-300 bg-green-50 text-green-800 rounded-md">
        {{ $page.props.flash.success }}
      </div>
      <div v-if="$page.props.flash.error"
        class="mb-6 p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        {{ $page.props.flash.error }}
      </div>
      <slot />
    </main>
  </div>
</template>

<script setup>
import { Link, router, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()

const roleMap = {
  admin: '管理员',
  department: '部门人员',
  representative: '居民代表',
  resident: '居民',
}

const roleLabel = computed(() => roleMap[page.props.auth.user?.role] || page.props.auth.user?.role)

const navItems = computed(() => {
  const role = page.props.auth.user?.role
  const items = [
    { href: '/grid-events', label: '网格事件台' },
    { href: '/issues', label: '居民议题' },
    { href: '/assistance', label: '帮扶需求' },
    { href: '/notices', label: '结果公示' },
  ]
  if (role === 'admin') {
    items.push({ href: '/exceptions', label: '异常列表' })
    items.push({ href: '/reports', label: '参与报表' })
  }
  return items
})

const isCurrent = (href) => {
  if (href === '/') return page.url === '/'
  return page.url.startsWith(href)
}

const logout = () => {
  router.post('/logout')
}
</script>
