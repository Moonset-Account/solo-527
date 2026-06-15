<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        产业园工单中心
      </div>
      <ul class="sidebar-menu">
        <li
          v-for="item in menuItems"
          :key="item.path"
          :class="{ active: route.path === item.path }"
          @click="navigateTo(item.path)"
        >
          {{ item.name }}
          <span v-if="item.badge" class="badge" style="margin-left: 8px">{{ item.badge }}</span>
        </li>
      </ul>
    </aside>
    <div style="flex: 1; display: flex; flex-direction: column;">
      <header class="header">
        <div class="flex-center gap-16">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>
        <div class="flex-center gap-16">
          <div class="notification-bell" @click="showNotifications = !showNotifications">
            <span>🔔</span>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </div>
          <div class="user-info">
            <span>{{ user?.name }}</span>
            <span class="text-secondary" style="margin-left: 8px;">({{ roleName }})</span>
            <button class="btn" style="margin-left: 16px;" @click="handleLogout">退出</button>
          </div>
        </div>
      </header>
      <div v-if="showNotifications" class="notification-panel">
        <div class="notification-header">
          <span>消息通知</span>
          <button class="btn" @click="showNotifications = false">关闭</button>
        </div>
        <div v-if="notifications.length === 0" class="empty">
          暂无新消息
        </div>
        <div v-else class="notification-list">
          <div
            v-for="item in notifications"
            :key="item.id"
            class="notification-item"
            @click="goToWorkOrder(item.workOrderId)"
          >
            <div class="flex-between">
              <span class="font-medium">{{ item.content }}</span>
              <span class="text-secondary text-xs">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="text-secondary text-xs mt-4">
              工单：{{ item.workOrder?.orderNo }} - {{ item.workOrder?.title }}
            </div>
          </div>
        </div>
      </div>
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'

const route = useRoute()
const { user, logout, isLoggedIn, initAuth } = useAuth()

const showNotifications = ref(false)
const unreadCount = ref(0)
const notifications = ref<any[]>([])

const menuItems = computed(() => {
  const items: any[] = [
    { path: '/', name: '工作台' }
  ]

  if (user.value?.role === 'TENANT') {
    items.push(
      { path: '/workorders/create', name: '提交报修' },
      { path: '/workorders', name: '我的工单' },
      { path: '/visitors', name: '访客预约' }
    )
  } else {
    items.push(
      { path: '/workorders', name: '工单管理', badge: unreadCount.value > 0 ? unreadCount.value : undefined },
      { path: '/inspections', name: '巡检任务' },
      { path: '/visitors', name: '访客管理' },
      { path: '/engineering-repairs', name: '工程报修' },
      { path: '/exceptions', name: '异常处理' },
      { path: '/satisfaction', name: '满意度统计' }
    )
  }

  return items
})

const currentPageTitle = computed(() => {
  const item = menuItems.value.find(m => m.path === route.path)
  return item?.name || '产业园工单中心'
})

const roleName = computed(() => {
  const roles: any = {
    ADMIN: '管理员',
    OPERATOR: '运营专员',
    ENGINEER: '工程师',
    TENANT: '租户'
  }
  return roles[user.value?.role || ''] || ''
})

onMounted(() => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  loadNotifications()
  setInterval(loadNotifications, 30000)
})

async function loadNotifications() {
  try {
    const res: any = await useApiFetch('/notifications/unread')
    if (res.code === 200) {
      unreadCount.value = res.data.count
      notifications.value = res.data.list
    }
  } catch (e) {
    // ignore
  }
}

function handleLogout() {
  logout()
}

function goToWorkOrder(id: number) {
  showNotifications.value = false
  navigateTo(`/workorders/${id}`)
}

function formatTime(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}
</script>

<style scoped>
.notification-bell {
  position: relative;
  cursor: pointer;
  font-size: 20px;
}

.user-info {
  display: flex;
  align-items: center;
}

.font-medium {
  font-weight: 500;
}

.text-xs {
  font-size: 12px;
}

.mt-4 {
  margin-top: 4px;
}

.notification-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 400px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 500px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.notification-list {
  padding: 0;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.notification-item:hover {
  background: #f5f5f5;
}
</style>
