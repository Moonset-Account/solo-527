<template>
  <n-layout has-sider position="absolute" style="height: 100vh;">
    <n-layout-sider
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      :collapse-mode="'width'"
      bordered
    >
      <div class="logo">
        <n-text v-if="!collapsed" style="font-size: 18px; font-weight: bold;">采购询价比价</n-text>
        <n-text v-else style="font-size: 18px;">耗材</n-text>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :options="menuOptions"
        :value="activeMenu"
        @update:value="handleMenuClick"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered style="height: 64px; padding: 0 24px;">
        <div class="header">
          <div class="header-left">
            <n-breadcrumb>
              <n-breadcrumb-item>首页</n-breadcrumb-item>
              <n-breadcrumb-item>{{ currentPageTitle }}</n-breadcrumb-item>
            </n-breadcrumb>
          </div>
          <div class="header-right">
            <n-badge :value="unreadCount" :max="99" processing>
              <n-button quaternary @click="showNotifications = true">
                <template #icon>
                  <n-icon><NotificationsOutline /></n-icon>
                </template>
              </n-button>
            </n-badge>
            <n-dropdown :options="userOptions" @select="handleUserAction">
              <div class="user-info">
                <n-avatar round>
                  {{ userStore.userInfo?.full_name?.[0] || 'U' }}
                </n-avatar>
                <span v-if="!collapsed" style="margin-left: 8px;">
                  {{ userStore.userInfo?.full_name || '用户' }}
                </span>
              </div>
            </n-dropdown>
          </div>
        </div>
      </n-layout-header>
      <n-layout-content content-style="padding: 24px;">
        <slot />
      </n-layout-content>
    </n-layout>

    <n-drawer v-model:show="showNotifications" :width="420" placement="right">
      <n-drawer-content title="消息通知" closable>
        <n-list bordered>
          <n-list-item v-for="notif in notifications" :key="notif.id">
            <template #prefix>
              <n-tag :type="getNotifTagType(notif.alert_type)" size="small">
                {{ getNotifTypeLabel(notif.alert_type) }}
              </n-tag>
            </template>
            <n-list-item-meta :title="notif.title" :description="notif.content" />
            <n-text depth="3" style="font-size: 12px;">
              {{ formatDate(notif.created_at) }}
            </n-text>
          </n-list-item>
          <n-list-item v-if="notifications.length === 0">
            <n-empty description="暂无通知" />
          </n-list-item>
        </n-list>
      </n-drawer-content>
    </n-drawer>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NotificationsOutline, LogOutOutline, PersonOutline, HomeOutline, FileTrayOutline, CartOutline, ReceiptOutline, PeopleOutline, DocumentTextOutline, BarChartOutline, ClipboardOutline } from '@vicons/ionicons5'
import { useUserStore } from '~/stores/user'
import { listNotifications, markNotificationRead } from '~/api'
import dayjs from 'dayjs'

defineProps<{
  title?: string
}>()

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const collapsed = ref(false)
const showNotifications = ref(false)
const notifications = ref<any[]>([])
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)

const menuOptions = computed(() => {
  const role = userStore.userRole
  const baseOptions = [
    { label: '数据看板', key: '/dashboard', icon: () => h(BarChartOutline) },
  ]
  if (['frontline', 'procurement', 'manager', 'admin'].includes(role)) {
    baseOptions.push(
      { label: '耗材管理', key: '/materials', icon: () => h(FileTrayOutline) },
      { label: '月度用量', key: '/monthly-usage', icon: () => h(ClipboardOutline) },
      { label: '采购需求', key: '/purchase-requests', icon: () => h(DocumentTextOutline) }
    )
  }
  if (['procurement', 'manager', 'admin'].includes(role)) {
    baseOptions.push(
      { label: '供应商管理', key: '/suppliers', icon: () => h(PeopleOutline) },
      { label: '报价管理', key: '/quotes', icon: () => h(ReceiptOutline) },
      { label: '报价比价', key: '/quote-comparison', icon: () => h(BarChartOutline) },
      { label: '采购订单', key: '/purchase-orders', icon: () => h(CartOutline) },
      { label: '框架协议', key: '/agreements', icon: () => h(DocumentTextOutline) }
    )
  }
  if (['manager', 'admin'].includes(role)) {
    baseOptions.push(
      { label: '操作日志', key: '/audit-logs', icon: () => h(ClipboardOutline) }
    )
  }
  return baseOptions
})

const userOptions = [
  { label: '个人信息', key: 'profile', icon: () => h(PersonOutline) },
  { label: '退出登录', key: 'logout', icon: () => h(LogOutOutline) }
]

const currentPageTitle = computed(() => {
  const found = menuOptions.value.find((o: any) => o.key === route.path)
  return found ? found.label : ''
})

function handleMenuClick(key: string) {
  router.push(key)
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    userStore.logout()
    message.success('已退出登录')
    router.push('/login')
  } else if (key === 'profile') {
    message.info('个人信息功能开发中')
  }
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function getNotifTagType(type: string) {
  const map: Record<string, any> = {
    delivery_delay: 'error',
    delivery_date_change: 'warning',
    quote_expiring: 'warning',
    agreement_expiring: 'info',
    supplier_risk: 'error',
    stock_low: 'warning',
    price_abnormal: 'warning'
  }
  return map[type] || 'default'
}

function getNotifTypeLabel(type: string) {
  const map: Record<string, string> = {
    delivery_delay: '交货延期',
    delivery_date_change: '交期变更',
    quote_expiring: '报价到期',
    agreement_expiring: '协议到期',
    supplier_risk: '供应商风险',
    stock_low: '库存预警',
    price_abnormal: '价格异常'
  }
  return map[type] || type
}

async function loadNotifications() {
  try {
    const res = await listNotifications({ status: 'unread', page_size: 50 })
    if (res.code === 200) {
      notifications.value = res.data.items
      unreadCount.value = res.data.total
    }
  } catch (e) {}
}

import { h } from 'vue'

watch(showNotifications, (val) => {
  if (val) loadNotifications()
})

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  userStore.initFromStorage()
  loadNotifications()
  setInterval(loadNotifications, 60000)
})
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
}
.header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  flex: 1;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.user-info:hover {
  background: #f0f0f0;
}
</style>
