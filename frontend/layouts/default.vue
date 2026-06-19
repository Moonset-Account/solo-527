<template>
  <client-only>
    <n-layout style="height: 100vh">
      <n-layout-sider
        :bordered="true"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
        style="background: #001529"
      >
        <div style="padding: 20px 16px; color: #fff; text-align: center">
          <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px" v-if="!collapsed">
            医药追溯系统
          </div>
          <div style="font-size: 24px" v-else>💊</div>
          <div style="font-size: 12px; color: #8ca6c7; opacity: 0.8" v-if="!collapsed">
            批次管理平台
          </div>
        </div>
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :options="menuOptions"
          :value="activeMenu"
          :default-expanded-keys="expandedKeys"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>
      <n-layout>
        <n-layout-header
          bordered
          style="height: 64px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 24px"
        >
          <div style="display: flex; align-items: center; gap: 12px">
            <n-space>
              <n-tag type="info" size="large">
                {{ currentTitle }}
              </n-tag>
            </n-space>
          </div>
          <div style="display: flex; align-items: center; gap: 16px">
            <n-badge :value="notifCount" :max="99" v-if="notifCount > 0">
              <n-button text @click="navigateTo('/reminders')">
                <template #icon>
                  <n-icon :size="20"><NotificationsOutline /></n-icon>
                </template>
              </n-button>
            </n-badge>
            <n-dropdown :options="userOptions" @select="handleUserAction">
              <n-button text style="padding: 0 12px">
                <n-space align="center">
                  <n-avatar :size="28" round>{{ auth.user?.full_name?.[0] || 'U' }}</n-avatar>
                  <span style="font-size: 14px">{{ auth.user?.full_name }}</span>
                  <n-tag size="small" :type="roleTagType">{{ roleText }}</n-tag>
                </n-space>
              </n-button>
            </n-dropdown>
          </div>
        </n-layout-header>
        <n-layout-content style="background: #f0f2f5; padding: 0">
          <slot />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NButton,
  NIcon,
  NTag,
  NAvatar,
  NSpace,
  NDropdown,
  NBadge,
  useMessage
} from 'naive-ui'
import {
  NotificationsOutline,
  HomeOutline,
  CubeOutline,
  CartOutline,
  GiftOutline,
  PeopleOutline,
  WarningOutline,
  AlertCircleOutline,
  BarChartOutline,
  ArchiveOutline,
  LayersOutline,
  TrendingDownOutline,
  FileTrayOutline,
  SettingsOutline,
  ConstructOutline,
  ColorFilterOutline
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const route = useRoute()
const message = useMessage()
const auth = useAuthStore()

const collapsed = ref(false)
const activeMenu = ref('')
const notifCount = ref(0)

const expandedKeys = computed(() => {
  const keys = ['main-menu', 'back-menu', 'admin-menu']
  return keys
})

const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions = computed(() => {
  const mainMenu = {
    label: '采购工作台',
    key: 'main-menu',
    children: [
      { label: '仪表盘', key: '/', icon: renderIcon(HomeOutline) },
      { label: '补货建议', key: '/replenish', icon: renderIcon(CartOutline) },
      { label: '批号流向追踪', key: '/trace', icon: renderIcon(GiftOutline) }
    ]
  }
  const backMenu = {
    label: '后台维护',
    key: 'back-menu',
    children: [
      { label: '供应商管理', key: '/suppliers', icon: renderIcon(PeopleOutline) },
      { label: '药品档案', key: '/medicines', icon: renderIcon(CubeOutline) },
      { label: '库位管理', key: '/locations', icon: renderIcon(LayersOutline) },
      { label: '批次效期维护', key: '/batches', icon: renderIcon(ArchiveOutline) },
      { label: '库存管理', key: '/stocks', icon: renderIcon(ColorFilterOutline) },
      { label: '近效期提醒', key: '/reminders', icon: renderIcon(WarningOutline) },
      { label: '缺货风险预警', key: '/risks', icon: renderIcon(AlertCircleOutline) },
      { label: '异常记录', key: '/abnormal', icon: renderIcon(TrendingDownOutline) },
      { label: '报表中心', key: '/reports', icon: renderIcon(BarChartOutline) }
    ]
  }
  const menus = [mainMenu, backMenu]
  if (auth.canAccessAdmin) {
    menus.push({
      label: '管理中心',
      key: 'admin-menu',
      children: [
        { label: '批次筛选入口', key: '/admin/batches', icon: renderIcon(FilterIcon) },
        { label: '补货筛选入口', key: '/admin/replenish', icon: renderIcon(FileTrayOutline) },
        { label: '签收差异管理', key: '/admin/sign-differences', icon: renderIcon(ConstructOutline) },
        { label: '字典管理', key: '/admin/dictionaries', icon: renderIcon(BarChartOutline) },
        { label: '提醒策略', key: '/admin/strategies', icon: renderIcon(SettingsOutline) },
        { label: '用户管理', key: '/admin/users', icon: renderIcon(PeopleOutline) }
      ]
    })
  }
  return menus
})

const currentTitle = computed(() => {
  const map: Record<string, string> = {
    '/': '仪表盘概览',
    '/replenish': '智能补货建议',
    '/trace': '批号流向追踪',
    '/suppliers': '供应商档案管理',
    '/medicines': '药品基础档案',
    '/locations': '仓库库位管理',
    '/batches': '批次效期维护',
    '/stocks': '实时库存监控',
    '/reminders': '近效期预警提醒',
    '/risks': '缺货风险预警',
    '/abnormal': '批次异常记录',
    '/reports': '报表导出中心',
    '/admin/batches': '批次效期筛选',
    '/admin/replenish': '补货建议筛选',
    '/admin/sign-differences': '签收差异管理',
    '/admin/dictionaries': '字典配置管理',
    '/admin/strategies': '提醒策略配置',
    '/admin/users': '系统用户管理'
  }
  return map[route.path] || '医药批次追溯系统'
})

const roleText = computed(() => {
  const m: Record<string, string> = {
    admin: '管理员',
    manager: '经理',
    purchaser: '采购员',
    warehouse: '库管员',
    viewer: '访客'
  }
  return m[auth.user?.role || ''] || auth.user?.role || ''
})

const roleTagType = computed(() => {
  const m: Record<string, any> = {
    admin: 'error',
    manager: 'warning',
    purchaser: 'success',
    warehouse: 'info',
    viewer: 'default'
  }
  return m[auth.user?.role || '']
})

const userOptions = computed(() => [
  { label: `账号: ${auth.user?.username}`, key: 'profile', disabled: true },
  { label: `部门: ${auth.user?.department || '-'}`, key: 'dept', disabled: true },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout' }
])

function handleMenuSelect(key: string) {
  activeMenu.value = key
  navigateTo(key)
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    auth.logout()
    message.success('已退出登录')
  }
}

onMounted(async () => {
  auth.init()
  if (!auth.isLoggedIn) {
    navigateTo('/login')
    return
  }
  if (!auth.user) {
    try {
      await auth.fetchCurrentUser()
    } catch (e) {}
  }
  activeMenu.value = route.path
  try {
    const stats = await apiClient.get<any>('/reminders/stats')
    notifCount.value = (stats?.pending || 0)
  } catch (e) {}
})

watch(() => route.path, (p) => {
  activeMenu.value = p
})

const FilterIcon = {
  name: 'FilterIcon',
  render() {
    return h('span', { style: { fontSize: '16px' } }, '⚙')
  }
}
</script>
