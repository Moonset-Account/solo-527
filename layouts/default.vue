<template>
  <div style="min-height: 100vh; display: flex; flex-direction: column;">
    <header style="background: #001529; color: white; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 56px;">
      <div style="display: flex; align-items: center; gap: 32px;">
        <h2 style="font-size: 18px; font-weight: 600; margin: 0;">服务器告警变更审批系统</h2>
        <nav style="display: flex; gap: 4px;">
          <NuxtLink to="/" :class="['nav-link', $route.path === '/' ? 'active' : '']">告警中心</NuxtLink>
          <NuxtLink to="/changes" :class="['nav-link', $route.path.startsWith('/changes') ? 'active' : '']">变更管理</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin" :class="['nav-link', $route.path.startsWith('/admin') ? 'active' : '']">管理后台</NuxtLink>
        </nav>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="notify-wrapper" @click="showNotify = !showNotify">
          <span style="cursor: pointer; position: relative;">
            🔔
            <span v-if="unreadCount > 0" class="notify-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span :class="`badge badge-${user?.role}`">{{ user?.role === 'ADMIN' ? '管理员' : '门店运维' }}</span>
          <span>{{ user?.realName }}</span>
          <button class="btn btn-sm" @click="logout">退出</button>
        </div>
      </div>
    </header>

    <div v-if="showNotify" class="notify-panel">
      <div style="display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <strong>通知消息</strong>
        <a href="#" @click.prevent="handleMarkAll" style="font-size: 12px; color: #1677ff;">全部已读</a>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        <div v-if="notification.loading.value" style="padding: 20px; text-align: center; color: #999;">加载中...</div>
        <div v-else-if="notification.list.value.length === 0" style="padding: 40px; text-align: center; color: #999;">暂无消息</div>
        <div v-else>
          <div
            v-for="item in notification.list.value"
            :key="item.id"
            class="notify-item"
            :class="{ unread: !item.isRead }"
            @click="handleNotifyClick(item)"
          >
            <div style="font-weight: 500; font-size: 13px;">{{ item.title }}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">{{ item.content }}</div>
            <div style="color: #9ca3af; font-size: 11px; margin-top: 4px;">{{ formatDate(item.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <main style="flex: 1; padding: 20px;">
      <slot />
    </main>

    <footer style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      服务器告警变更审批系统 &copy; 2025
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { NotificationItem } from '~/composables/useNotification'

const { user, isAdmin, logout } = useAuth()
const notification = useNotification()
const showNotify = ref(false)
const unreadCount = ref(0)

function formatDate(s: string) {
  return new Date(s).toLocaleString()
}

async function handleMarkAll() {
  await notification.markAllRead()
}

async function handleNotifyClick(item: NotificationItem) {
  if (!item.isRead) {
    await notification.markRead(item.id)
  }
  if (item.alertId) {
    await navigateTo(`/alerts/${item.alertId}`)
  } else if (item.changeId) {
    await navigateTo(`/changes/${item.changeId}`)
  }
  showNotify.value = false
}

onMounted(async () => {
  await notification.fetchList({ unread: true })
  unreadCount.value = notification.unreadCount.value
  setInterval(async () => {
    await notification.fetchList({ unread: true })
    unreadCount.value = notification.unreadCount.value
  }, 30000)
})

useHead({
  style: [
    {
      children: `
        .nav-link { padding: 0 16px; color: rgba(255,255,255,0.75); font-size: 14px; line-height: 56px; display: inline-block; }
        .nav-link:hover { color: white; }
        .nav-link.active { color: white; border-bottom: 2px solid #1677ff; }
        .notify-wrapper { position: relative; }
        .notify-badge { position: absolute; top: -8px; right: -12px; background: #ff4d4f; color: white; font-size: 10px; border-radius: 10px; padding: 0 5px; min-width: 16px; text-align: center; line-height: 16px; }
        .notify-panel { position: absolute; top: 56px; right: 120px; width: 360px; background: white; border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); z-index: 1000; border: 1px solid #e5e7eb; }
        .notify-item { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
        .notify-item.unread { background: #e6f4ff; }
        .notify-item:hover { background: #f5f5f5; }
      `
    }
  ]
})
</script>
