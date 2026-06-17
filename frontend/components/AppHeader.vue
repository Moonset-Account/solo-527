<template>
  <div style="display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 20px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <n-button quaternary circle @click="appStore.toggleCollapsed()">
        <template #icon>
          <n-icon>
            <component :is="appStore.collapsed ? MenuOutline : ArrowUndoOutline" />
          </n-icon>
        </template>
      </n-button>
      <n-breadcrumb>
        <n-breadcrumb-item
          v-for="item in appStore.breadcrumb"
          :key="item.key"
          @click="() => navigateTo(item.key)"
          style="cursor: pointer;"
        >
          {{ item.label }}
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>
    <div style="display: flex; align-items: center; gap: 16px;">
      <n-select
        v-if="userStore.campuses.length > 1"
        v-model:value="selectedCampus"
        :options="campusOptions"
        style="width: 160px;"
        size="small"
        @update:value="onCampusChange"
      />
      <n-badge :value="unreadCount" :max="99" :show-zero="false" processing>
        <n-button quaternary circle @click="openReminders">
          <template #icon>
            <n-icon size="18"><NotificationsOutline /></n-icon>
          </template>
        </n-button>
      </n-badge>
      <n-dropdown
        trigger="click"
        :options="userOptions"
        @select="handleUserAction"
      >
        <div style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.2s;" :style="{ background: hovered ? 'rgba(0,0,0,0.04)' : 'transparent' }" @mouseenter="hovered = true" @mouseleave="hovered = false">
          <n-avatar round :size="32" style="background: linear-gradient(135deg, #2080f0, #18a058);">
            <n-icon size="18"><PersonCircleOutline /></n-icon>
          </n-avatar>
          <div style="display: flex; flex-direction: column; line-height: 1.2;">
            <n-text strong style="font-size: 13px;">{{ user?.real_name || '未登录' }}</n-text>
            <n-text depth="3" style="font-size: 11px;">{{ roleLabel }}</n-text>
          </div>
        </div>
      </n-dropdown>
    </div>
  </div>
  <n-drawer v-model:show="reminderVisible" :width="420" placement="right">
    <n-drawer-content title="提醒中心" closable>
      <div v-if="reminders.length === 0" style="padding: 40px 0; text-align: center;">
        <n-empty description="暂无提醒" />
      </div>
      <n-list v-else bordered>
        <n-list-item v-for="r in reminders.slice(0, 20)" :key="r.id">
          <template #prefix>
            <n-tag :type="reminderTagType(r.priority)" size="small" round>
              {{ priorityLabel(r.priority) }}
            </n-tag>
          </template>
          <template #header>
            <n-space justify="space-between" align="center" style="width: 100%;">
              <n-text strong style="font-size: 13px;">{{ r.title }}</n-text>
              <n-badge v-if="r.is_overdue" :value="'逾期'" color="#d03050" />
            </n-space>
          </template>
          <n-text depth="3" style="font-size: 12px;">{{ r.content }}</n-text>
          <template #suffix>
            <n-text depth="3" style="font-size: 11px;">
              {{ formatDate(r.created_at) }}
            </n-text>
          </template>
        </n-list-item>
      </n-list>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  MenuOutline,
  ArrowUndoOutline,
  NotificationsOutline,
  PersonCircleOutline,
  LogOutOutline,
  SettingsOutline,
  HelpCircleOutline,
  RefreshOutline,
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import type { ReminderItem } from '~/types'
import { apiGet, apiPost } from '~/composables/useApi'

const appStore = useAppStore()
const userStore = useUserStore()

const hovered = ref(false)
const reminderVisible = ref(false)
const reminders = ref<ReminderItem[]>([])
const unreadCount = ref(0)

const user = computed(() => userStore.user)
const roleLabel = computed(() => {
  const map: Record<string, string> = {
    admin: '超级管理员',
    principal: '校区校长',
    teacher: '授课教师',
    parent: '家长用户',
    operator: '运营专员',
  }
  return map[user.value?.role || ''] || '用户'
})

const selectedCampus = ref<number | null>(null)
const campusOptions = computed(() =>
  userStore.campuses.map(c => ({ label: c.name, value: c.id }))
)

watch(() => userStore.selectedCampusId, (v) => {
  selectedCampus.value = v
}, { immediate: true })

function onCampusChange(val: number) {
  userStore.setSelectedCampus(val)
  window.location.reload()
}

const userOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(SettingsOutline),
  },
  {
    label: '刷新数据',
    key: 'refresh',
    icon: () => h(RefreshOutline),
  },
  {
    label: '帮助文档',
    key: 'help',
    icon: () => h(HelpCircleOutline),
  },
  {
    type: 'divider' as const,
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutOutline),
  },
]

function handleUserAction(key: string) {
  if (key === 'logout') {
    userStore.logout()
    navigateTo('/login')
  } else if (key === 'refresh') {
    window.location.reload()
  } else if (key === 'profile') {
    message.info('个人中心功能开发中')
  } else if (key === 'help') {
    message.info('请联系系统管理员获取帮助')
  }
}

function openReminders() {
  reminderVisible.value = true
  loadReminders()
}

function priorityLabel(p: string) {
  return { urgent: '紧急', high: '高', normal: '普通', low: '低' }[p] || p
}

function reminderTagType(p: string) {
  return { urgent: 'error', high: 'warning', normal: 'info', low: 'default' }[p] as any || 'default'
}

function formatDate(s?: string) {
  if (!s) return ''
  return new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadReminders() {
  try {
    const data = await apiGet<any>('/reminders', { status: 'pending', page_size: 50 })
    if (data && data.items) {
      reminders.value = data.items
      unreadCount.value = data.items.filter((r: any) => r.status === 'pending' || r.status === 'sent').length
    }
  } catch (e) {
    console.warn('load reminders error', e)
  }
}

const message = useMessage()

onMounted(async () => {
  if (!userStore.user) {
    try {
      const me: any = await apiGet('/common/users/me')
      if (me) {
        userStore.setUser(me)
      }
    } catch (e) {
      console.warn('auto login me failed', e)
    }
  }
  if (userStore.campuses.length === 0) {
    try {
      const campuses: any = await apiGet('/common/campuses')
      if (campuses && campuses.length) {
        userStore.setCampuses(campuses)
      }
    } catch (e) {
      console.warn('load campuses failed', e)
    }
  }
  loadReminders()
  setInterval(loadReminders, 60000)
})
</script>
