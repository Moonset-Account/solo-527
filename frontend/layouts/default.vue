<script setup lang="ts">
import { NLayout, NLayoutSider, NMenu, NIcon, NAvatar, NSpace, NText, NBadge } from 'naive-ui'
import {
  HomeOutline,
  WalletOutline,
  CardOutline,
  TrendingUpOutline,
  ReturnDownBackOutline,
  TrashOutline,
  NotificationsOutline,
} from '@vicons/ionicons5'
import type { MenuOption } from 'naive-ui'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  { label: '工作台', key: '/', icon: renderIcon(HomeOutline) },
  { label: '应收管理', key: '/ar', icon: renderIcon(WalletOutline) },
  { label: '收款记录', key: '/payments', icon: renderIcon(CardOutline) },
  { label: '资金缺口', key: '/cash-gap', icon: renderIcon(TrendingUpOutline) },
  { label: '退款管理', key: '/refunds', icon: renderIcon(ReturnDownBackOutline) },
  { label: '冲销记录', key: '/writeoffs', icon: renderIcon(TrashOutline) },
  { label: '提醒中心', key: '/reminders', icon: renderIcon(NotificationsOutline) },
]

const activeKey = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  const match = menuOptions.find((m) => m.key !== '/' && path.startsWith(m.key as string))
  return match?.key ?? '/'
})

function handleMenuUpdate(key: string) {
  router.push(key)
}
</script>

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
      <div style="padding: 16px; text-align: center">
        <NText strong style="font-size: 16px" v-if="!collapsed">应收对账台</NText>
        <NText strong style="font-size: 16px" v-else>AR</NText>
      </div>
      <NMenu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </NLayoutSider>
    <NLayout>
      <NLayout content-style="padding: 24px; background: #f5f5f5; min-height: 100vh">
        <slot />
      </NLayout>
    </NLayout>
  </NLayout>
</template>
