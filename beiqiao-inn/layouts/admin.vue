<script setup lang="ts">
const sidebarItems = [
  { label: '仪表盘', path: '/admin', icon: 'dashboard' },
  { label: '房态管理', path: '/admin/rooms', icon: 'rooms' },
  { label: '待办中心', path: '/admin/todos', icon: 'todos' },
  { label: '提醒规则', path: '/admin/reminders', icon: 'reminders' },
  { label: '报表导出', path: '/admin/reports', icon: 'reports' },
]

const collapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-cream flex">
    <aside
      class="bg-pine text-cream flex-shrink-0 transition-all duration-300 sticky top-0 h-screen"
      :class="collapsed ? 'w-16' : 'w-56'"
    >
      <div class="flex items-center justify-between h-16 px-4 border-b border-pine-light/30">
        <NuxtLink to="/" class="flex items-center gap-2" v-if="!collapsed">
          <div class="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
            <span class="text-pine font-serif font-bold">北</span>
          </div>
          <span class="font-serif text-sm font-semibold">管理后台</span>
        </NuxtLink>
        <button
          class="p-1.5 rounded hover:bg-pine-light transition-colors"
          @click="collapsed = !collapsed"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>
      </div>

      <nav class="mt-4 space-y-1 px-2">
        <NuxtLink
          v-for="item in sidebarItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-pine-light transition-colors"
          active-class="bg-pine-light"
          :title="collapsed ? item.label : ''"
        >
          <span class="text-base">{{ item.label.charAt(0) }}</span>
          <span v-if="!collapsed">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="absolute bottom-4 left-0 right-0 px-2" v-if="!collapsed">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-cream/60 hover:text-cream hover:bg-pine-light transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回前台
        </NuxtLink>
      </div>
    </aside>

    <div class="flex-1 min-w-0">
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
