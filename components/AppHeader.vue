<template>
  <header class="header">
    <div class="flex items-center gap-4">
      <h1 class="header-title">{{ ui.pageTitle }}</h1>
    </div>
    <div class="header-right">
      <div class="notification-bell" @click="toggleNotifications" title="通知">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px;color:var(--gray-600)">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span v-if="ui.unreadCount > 0" class="notification-badge">{{ ui.unreadCount > 99 ? '99+' : ui.unreadCount }}</span>
      </div>
      <div v-if="auth.user" class="flex items-center gap-3" style="cursor:pointer">
        <div class="text-right" style="line-height:1.2">
          <div style="font-size:14px;font-weight:600">{{ auth.user.name }}</div>
          <div style="font-size:12px;color:var(--gray-500)">{{ auth.user.department || '法务部' }}</div>
        </div>
        <div class="user-avatar">
          {{ auth.user.name?.charAt(0) || 'U' }}
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPanel" class="notification-panel">
          <div class="notification-header">
            <div class="font-semibold">通知提醒</div>
            <span class="text-sm text-gray-500">{{ ui.notifications.length }} 条</span>
          </div>
          <div class="notification-list">
            <div v-if="ui.notifications.length === 0" class="empty-state" style="padding:32px 16px">
              <div style="font-size:40px;margin-bottom:8px">📭</div>
              <div>暂无提醒</div>
            </div>
            <div
              v-for="n in ui.notifications"
              :key="n.id"
              class="notification-item"
              :class="{ urgent: isDeadlineNear(n.deadlineDate) || isDeadlineOverdue(n.deadlineDate) }"
            >
              <div class="notif-icon" :class="n.status === 'PENDING' ? 'pending' : 'sent'">
                {{ n.reminderType.includes('RECTIFY') ? '⚠️' : '⏰' }}
              </div>
              <div class="flex-1">
                <div class="notif-title">
                  {{ n.title }}
                  <span v-if="isManager && n.user && n.user.id !== currentUserId" class="ml-2" style="font-size:12px;font-weight:normal;color:var(--primary)">
                    · {{ n.user.name }}({{ getRoleShortLabel(n.user.role) }})
                  </span>
                </div>
                <div class="notif-msg">{{ n.message }}</div>
                <div class="notif-meta">
                  <span :class="{ 'text-danger': isDeadlineOverdue(n.deadlineDate) }">
                    截止: {{ formatDate(n.deadlineDate, false) }}
                    <span v-if="isDeadlineOverdue(n.deadlineDate)">(已逾期 {{ -daysFromNow(n.deadlineDate) }}天)</span>
                    <span v-else-if="isDeadlineNear(n.deadlineDate)">(还剩 {{ daysFromNow(n.deadlineDate) }}天)</span>
                  </span>
                  <span v-if="n.contract">合同: {{ n.contract.contractNo }}</span>
                </div>
              </div>
              <span class="badge" :class="n.status === 'PENDING' ? 'badge-error' : 'badge-info'">
                {{ n.status === 'PENDING' ? '待处理' : '已发送' }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'

const auth = useAuthStore()
const ui = useUiStore()

const showPanel = ref(false)

const isManager = computed(() => auth.hasRole('LEGAL_MANAGER', 'ADMIN'))
const currentUserId = computed(() => auth.user?.id || '')

function getRoleShortLabel(role: string): string {
  const map: Record<string, string> = {
    LEGAL_MANAGER: '法务负责人',
    LAWYER: '律师',
    REVIEWER: '复核人',
    ADMIN: '管理员'
  }
  return map[role] || role
}

function toggleNotifications(e: Event) {
  e.stopPropagation()
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    ui.fetchNotifications()
  }
}

function closePanel(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.notification-panel') && !target.closest('.notification-bell')) {
    showPanel.value = false
  }
}

onMounted(() => {
  ui.fetchNotifications()
  document.addEventListener('click', closePanel)
})

onUnmounted(() => {
  document.removeEventListener('click', closePanel)
})
</script>

<style scoped>
.notification-panel {
  position: fixed;
  top: 56px;
  right: 16px;
  width: 400px;
  max-height: calc(100vh - 100px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--gray-200);
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notification-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--gray-50);
}

.notification-list {
  flex: 1;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--gray-100);
  transition: background 0.2s;
}

.notification-item:hover {
  background: var(--gray-50);
}

.notification-item.urgent {
  background: #fffbeb;
}

.notif-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.notif-icon.pending {
  background: #fee2e2;
}

.notif-icon.sent {
  background: #dbeafe;
}

.notif-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.notif-msg {
  color: var(--gray-600);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-meta {
  font-size: 12px;
  color: var(--gray-500);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s;
  opacity: 1;
  transform: translateY(0);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
