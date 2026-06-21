<template>
  <div class="app-header h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm">
    <div class="flex items-center gap-4">
      <n-button
        text
        size="small"
        @click="toggleSidebar"
        class="!p-2"
      >
        <template #icon>
          <n-icon :size="20">
            <MenuSharp />
          </n-icon>
        </template>
      </n-button>

      <n-breadcrumb>
        <n-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
          {{ item.label }}
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="flex items-center gap-3">
      <n-space align="center">
        <n-dropdown
          trigger="click"
          :options="notificationOptions"
          placement="bottom-end"
          @select="handleNotificationSelect"
        >
          <n-button text class="relative">
            <template #icon>
              <n-badge :value="3" type="error" :max="99">
                <n-icon :size="20" color="#666">
                  <NotificationsSharp />
                </n-icon>
              </n-badge>
            </template>
          </n-button>
        </n-dropdown>

        <n-button text>
          <template #icon>
            <n-icon :size="20" color="#666">
              <SearchSharp />
            </n-icon>
          </template>
        </n-button>

        <n-divider vertical class="!h-6" />

        <n-dropdown
          trigger="click"
          :options="userMenuOptions"
          placement="bottom-end"
          @select="handleUserMenuSelect"
        >
          <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors">
            <n-avatar
              round
              size="small"
              :src="authStore.userInfo?.avatar"
              :style="{ backgroundColor: '#1A8A7D' }"
            >
              <template #icon>
                <n-icon>
                  <PersonSharp />
                </n-icon>
              </template>
            </n-avatar>
            <div class="hidden md:block">
              <div class="text-sm font-medium text-gray-800">
                {{ authStore.userInfo?.realName || '管理员' }}
              </div>
              <div class="text-xs text-gray-500">
                {{ authStore.userInfo?.role || '系统管理员' }}
              </div>
            </div>
            <n-icon :size="16" color="#999" class="hidden md:block">
              <ChevronDownSharp />
            </n-icon>
          </div>
        </n-dropdown>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute } from 'vue-router'
import type { DropdownOption } from 'naive-ui'
import {
  MenuSharp,
  NotificationsSharp,
  SearchSharp,
  PersonSharp,
  ChevronDownSharp,
  LogOutSharp,
  SettingsSharp,
  PersonCircleSharp,
  HelpCircleSharp,
} from '@vicons/ionicons5'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const route = useRoute()
const authStore = useAuthStore()
const router = useRouter()

const breadcrumbs = computed(() => {
  const crumbs: { label: string }[] = [{ label: '首页' }]
  const pathMap: Record<string, string> = {
    '/dashboard': '仪表板',
    '/orders': '预约订单',
    '/orders/list': '全部订单',
    '/orders/pending': '待处理',
    '/orders/processing': '进行中',
    '/orders/completed': '已完成',
    '/pets': '宠物档案',
    '/pets/list': '宠物列表',
    '/pets/create': '新增宠物',
    '/pets/health': '健康记录',
    '/adoption': '领养审核',
    '/adoption/pending': '待审核',
    '/adoption/approved': '已通过',
    '/adoption/rejected': '已拒绝',
    '/follow-up': '回访提醒',
    '/schedule': '排班管理',
    '/users': '用户管理',
    '/logs': '操作日志',
    '/settings': '系统设置',
  }
  const pathSegments = route.path.split('/').filter(Boolean)
  let currentPath = ''
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    if (pathMap[currentPath]) {
      crumbs.push({ label: pathMap[currentPath] })
    }
  }
  return crumbs
})

const notificationOptions: DropdownOption[] = [
  {
    label: '新预约订单 #20240001',
    key: 'notify-1',
  },
  {
    label: '领养申请待审核',
    key: 'notify-2',
  },
  {
    label: '回访提醒：李小明 3天后到期',
    key: 'notify-3',
  },
  {
    type: 'divider',
    key: 'divider-1',
  },
  {
    label: '查看全部通知',
    key: 'view-all',
    props: { style: 'color: #1A8A7D; text-align: center;' },
  },
]

const userMenuOptions = computed<DropdownOption[]>(() => [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(PersonCircleSharp),
  },
  {
    label: '账户设置',
    key: 'settings',
    icon: () => h(SettingsSharp),
  },
  {
    label: '帮助中心',
    key: 'help',
    icon: () => h(HelpCircleSharp),
  },
  {
    type: 'divider',
    key: 'divider-1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutSharp),
    props: { style: 'color: #FF8C42;' },
  },
])

function toggleSidebar() {
  emit('toggle-sidebar')
}

function handleNotificationSelect(key: string | number) {
  if (key === 'view-all') {
    console.log('查看全部通知')
  }
}

function handleUserMenuSelect(key: string | number) {
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'help':
      console.log('帮助中心')
      break
    case 'logout':
      authStore.logout()
      break
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
