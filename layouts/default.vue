<template>
  <div class="min-h-screen bg-gray-100">
    <template v-if="isLoggedIn">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-800">{{ appName }}</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">{{ user?.name }} ({{ roleText }})</span>
            <button
              @click="logout"
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <div class="flex">
        <nav class="w-64 bg-white shadow-lg min-h-screen">
          <ul class="py-4">
            <li v-for="item in menuItems" :key="item.path">
              <NuxtLink
                :to="item.path"
                class="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                :class="{ 'bg-blue-100 text-blue-600 border-r-4 border-blue-600': route.path === item.path }"
              >
                {{ item.name }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <main class="flex-1 p-6">
          <slot />
        </main>
      </div>
    </template>

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
const { isLoggedIn, state, logout, hasRole } = useAuth()
const user = computed(() => state.value.user)
const appName = useRuntimeConfig().public.appName

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    ADMIN: '管理员',
    DOCTOR: '医生',
    OPERATOR: '运营负责人',
    FINANCE: '财务'
  }
  return roleMap[user.value?.role || ''] || user.value?.role
})

const menuItems = computed(() => {
  const items = [
    { path: '/', name: '首页' },
    { path: '/medical-records', name: '病历管理' },
    { path: '/follow-up', name: '随访任务' }
  ]

  if (hasRole(['ADMIN', 'OPERATOR'])) {
    items.push(
      { path: '/treatment-plans', name: '疗程方案配置' },
      { path: '/treatment-courses', name: '疗程管理' }
    )
  }

  if (hasRole(['ADMIN', 'OPERATOR', 'FINANCE'])) {
    items.push(
      { path: '/reconciliation', name: '月底核对' },
      { path: '/reports/billing', name: '收费报表' }
    )
  }

  if (hasRole(['ADMIN', 'OPERATOR'])) {
    items.push({ path: '/batch-operations', name: '批量操作记录' })
  }

  items.push({ path: '/patients', name: '患者档案' })

  return items
})
</script>
