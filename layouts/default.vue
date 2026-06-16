<template>
  <div class="min-h-screen bg-gray-50 flex">
    <aside class="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 class="text-lg font-bold text-primary-700">技术面试管道</h1>
      </div>
      <nav class="p-4 space-y-1">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': $route.path === item.to }"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>
    <div class="flex-1 ml-64">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">管理员</span>
        </div>
      </header>
      <main class="p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const menuItems = [
  { to: '/', label: '数据看板', icon: '📊' },
  { to: '/candidates', label: '候选人管理', icon: '👥' },
  { to: '/interviews', label: '面试安排', icon: '📅' },
  { to: '/assessments', label: '测评中心', icon: '📝' },
  { to: '/reminders', label: '提醒中心', icon: '🔔' },
  { to: '/reminder-configs', label: '提醒规则配置', icon: '⚙️' },
  { to: '/retry-logs', label: '接口重试日志', icon: '🔄' },
  { to: '/reports', label: '报表中心', icon: '📈' }
]
const pageTitle = computed(() => {
  const item = menuItems.find(m => m.to === route.path)
  return item?.label || '技术面试管道系统'
})
</script>
