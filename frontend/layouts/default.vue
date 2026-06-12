<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div style="padding: 16px; text-align: center; font-weight: bold; font-size: 16px">
        <template v-if="!collapsed">宿舍报修系统</template>
        <template v-else>报修</template>
      </div>
      <NMenu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="currentRoute"
        @update:value="handleMenuClick"
      />
    </NLayoutSider>
    <NLayout>
      <NLayoutHeader bordered style="padding: 12px 24px; display: flex; align-items: center; justify-content: space-between">
        <span style="font-size: 14px; color: #666">{{ currentPath }}</span>
        <NSpace align="center">
          <span v-if="auth.user.value" style="font-size: 14px">
            {{ auth.user.value.real_name || auth.user.value.username }}
          </span>
          <NTag v-if="auth.user.value && auth.user.value.role" size="small" :type="auth.user.value.role === 'admin' ? 'error' : auth.user.value.role === 'staff' ? 'warning' : 'info'">
            {{ auth.user.value.role === 'admin' ? '管理员' : auth.user.value.role === 'staff' ? '工作人员' : '学生' }}
          </NTag>
          <NButton size="small" @click="auth.logout()">退出登录</NButton>
        </NSpace>
      </NLayoutHeader>
      <NLayoutContent style="padding: 24px; overflow: auto">
        <slot />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<script setup lang="ts">
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NSpace, NTag, NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  HomeOutline,
  ConstructOutline,
  ListOutline,
  ShieldCheckmarkOutline,
  StatsChartOutline,
  DownloadOutline,
  CalendarOutline,
  SwapHorizontalOutline
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const collapsed = ref(false)

const currentRoute = computed(() => route.path)

const currentPath = computed(() => {
  const map: Record<string, string> = {
    '/': '首页',
    '/repairs/submit': '提交报修',
    '/repairs': '我的报修',
    '/admin/reviews': '审核管理',
    '/admin/statistics': '统计面板',
    '/admin/export': '数据导出',
    '/activities': '社团活动',
    '/trades': '二手交易'
  }
  return map[route.path] || route.path
})

const isAdmin = computed(() => {
  return auth.user.value && (auth.user.value.role === 'admin' || auth.user.value.role === 'staff')
})

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const studentMenuOptions: MenuOption[] = [
  { label: '首页', key: '/', icon: renderIcon(HomeOutline) },
  { label: '提交报修', key: '/repairs/submit', icon: renderIcon(ConstructOutline) },
  { label: '我的报修', key: '/repairs', icon: renderIcon(ListOutline) },
  { label: '社团活动', key: '/activities', icon: renderIcon(CalendarOutline) },
  { label: '二手交易', key: '/trades', icon: renderIcon(SwapHorizontalOutline) }
]

const adminMenuOptions: MenuOption[] = [
  { label: '审核管理', key: '/admin/reviews', icon: renderIcon(ShieldCheckmarkOutline) },
  { label: '统计面板', key: '/admin/statistics', icon: renderIcon(StatsChartOutline) },
  { label: '数据导出', key: '/admin/export', icon: renderIcon(DownloadOutline) }
]

const menuOptions = computed<MenuOption[]>(() => {
  const options = [...studentMenuOptions]
  if (isAdmin.value) {
    options.push({ key: 'divider', type: 'divider' })
    options.push(...adminMenuOptions)
  }
  return options
})

function handleMenuClick(key: string) {
  router.push(key)
}

onMounted(() => {
  if (auth.isAuthenticated.value && !auth.user.value) {
    auth.fetchUser()
  }
})
</script>
