<template>
  <NNotificationProvider>
    <NMessageProvider>
      <NLayout has-sider style="height: 100vh">
        <NLayoutSider
          bordered
          collapse-mode="width"
          :collapsed-width="64"
          :width="220"
          show-trigger
          :native-scrollbar="false"
          style="background: #1a365d"
        >
          <div class="sider-logo">
            <span class="logo-icon">🔷</span>
            <span v-if="!collapsed" class="logo-text">网格事件闭环</span>
          </div>
          <NMenu
            v-model:value="activeKey"
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="menuOptions"
            :theme-overrides="menuThemeOverrides"
            @update:value="handleMenuSelect"
          />
        </NLayoutSider>
        <NLayout>
          <NLayoutHeader bordered style="height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #fff">
            <div style="font-size: 16px; font-weight: 500; color: #1a365d">
              {{ currentPageTitle }}
            </div>
            <div style="display: flex; align-items: center; gap: 16px">
              <NotificationBell />
              <div style="font-size: 14px; color: #2d3748">
                {{ authStore.currentUser?.name || '管理员' }}
              </div>
            </div>
          </NLayoutHeader>
          <NLayoutContent
            content-style="padding: 24px; background: #f5f7fa; min-height: calc(100vh - 56px)"
            :native-scrollbar="false"
          >
            <slot />
          </NLayoutContent>
        </NLayout>
      </NLayout>
    </NMessageProvider>
  </NNotificationProvider>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { NMenu, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NNotificationProvider, NMessageProvider } from 'naive-ui'
import NotificationBell from '~/components/NotificationBell.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const activeKey = ref('home')

const menuOptions = [
  { label: '首页', key: 'home', icon: () => h('span', { style: 'font-size:18px' }, '📊') },
  { label: '事件管理', key: 'events', icon: () => h('span', { style: 'font-size:18px' }, '📋') },
  { label: '整改复查', key: 'rectify', icon: () => h('span', { style: 'font-size:18px' }, '✅') },
  { label: '字典管理', key: 'dict', icon: () => h('span', { style: 'font-size:18px' }, '📖') },
  { label: '规则管理', key: 'rules', icon: () => h('span', { style: 'font-size:18px' }, '⚙️') }
]

const menuThemeOverrides = {
  itemTextColor: 'rgba(255,255,255,0.7)',
  itemTextColorHover: '#fff',
  itemTextColorActive: '#fff',
  itemTextColorChildActive: '#fff',
  itemIconColor: 'rgba(255,255,255,0.7)',
  itemIconColorHover: '#fff',
  itemIconColorActive: '#fff',
  itemColorActive: 'rgba(255,255,255,0.15)',
  itemColorHover: 'rgba(255,255,255,0.08)',
  arrowColor: 'rgba(255,255,255,0.7)'
}

const pageTitles: Record<string, string> = {
  home: '首页看板',
  events: '事件管理',
  rectify: '整改复查',
  dict: '字典管理',
  rules: '规则管理'
}

const currentPageTitle = computed(() => {
  const path = route.path
  if (path === '/') return '首页看板'
  if (path.startsWith('/events')) return '事件管理'
  if (path === '/rectify') return '整改复查'
  if (path === '/dict') return '字典管理'
  if (path === '/rules') return '规则管理'
  return '网格事件闭环看板'
})

watch(() => route.path, (path) => {
  if (path === '/') activeKey.value = 'home'
  else if (path.startsWith('/events')) activeKey.value = 'events'
  else if (path === '/rectify') activeKey.value = 'rectify'
  else if (path === '/dict') activeKey.value = 'dict'
  else if (path === '/rules') activeKey.value = 'rules'
}, { immediate: true })

const handleMenuSelect = (key: string) => {
  const routes: Record<string, string> = {
    home: '/',
    events: '/events',
    rectify: '/rectify',
    dict: '/dict',
    rules: '/rules'
  }
  if (routes[key]) router.push(routes[key])
}
</script>

<style scoped>
.sider-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo-icon {
  font-size: 24px;
}
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
</style>
