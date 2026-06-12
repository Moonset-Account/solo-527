<template>
  <n-layout has-sider>
    <n-layout-sider
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="240"
      :native-scrollbar="false"
      show-trigger
      collapse-mode="width"
      bordered
      style="background: #1d2b26;"
    >
      <div class="sider-header">
        <div class="brand-logo">青</div>
        <span v-if="!collapsed" class="brand-name">青禾合规清单台</span>
      </div>
      <n-menu
        :value="route.path"
        :collapsed="collapsed"
        :collapsed-width="64"
        :options="menuOptions"
        @update:value="navTo"
        style="background: transparent; border: none; color: #cbd5e1;"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered style="background: #fff; padding: 0 24px;">
        <div class="header-inner">
          <div class="header-left">
            <h2 class="page-title">{{ currentPageTitle }}</h2>
          </div>
          <div class="header-right">
            <n-popover trigger="click" placement="bottom-end" style="width: 420px; padding: 0;">
              <template #trigger>
                <n-badge :value="unreadCount" :max="99" :hidden="!unreadCount" processing>
                  <n-button quaternary circle>
                    <n-icon size="20"><NotificationsOutline /></n-icon>
                  </n-button>
                </n-badge>
              </template>
              <ReminderPanel />
            </n-popover>
            <n-dropdown :options="userMenuOptions" @select="onUserSelect" trigger="click">
              <div class="user-info">
                <n-avatar round size="small" style="background: #2d8a5e;">{{ auth.user?.full_name?.charAt(0) || 'U' }}</n-avatar>
                <div class="user-text">
                  <div class="user-name">{{ auth.user?.full_name }}</div>
                  <div class="user-role">{{ roleLabel }}</div>
                </div>
              </div>
            </n-dropdown>
          </div>
        </div>
      </n-layout-header>

      <n-layout-content content-style="padding: 0; min-height: calc(100vh - 64px);">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeOutline, FileTrayOutline, ShieldCheckmarkOutline,
  PeopleOutline, SettingsOutline, GridOutline, NotificationsOutline,
  WarningOutline, DocumentTextOutline,
} from '@vicons/ionicons5'
import { h } from 'vue'
import { useAuthStore } from '~/stores/auth'

const ReminderPanel = defineAsyncComponent(() => import('~/components/ReminderPanel.vue'))

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)
const unreadCount = ref(0)

onMounted(() => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  loadUnread()
  setInterval(loadUnread, 30000)
})

async function loadUnread() {
  try {
    const api = useApi()
    const d = await api.get('/reminders', { unread_only: true, page_size: 1 })
    unreadCount.value = d.unread_count || 0
  } catch (_) {}
}

const menuOptions = computed(() => {
  const base = [
    {
      label: '工作台',
      key: '/',
      icon: () => h(HomeOutline),
    },
    {
      label: '检查清单',
      key: '/checklists',
      icon: () => h(FileTrayOutline),
      children: [
        { label: '我的提交', key: '/checklists/submissions' },
        { label: '新建检查', key: '/checklists/create' },
        { label: '模板管理', key: '/checklists/templates' },
      ],
    },
    {
      label: '合规缺口',
      key: '/gaps',
      icon: () => h(WarningOutline),
      children: [
        { label: '缺口列表', key: '/gaps' },
        { label: '期限风险看板', key: '/gaps/risk-board' },
      ],
    },
    {
      label: '分派管理',
      key: '/assignments',
      icon: () => h(PeopleOutline),
      show: auth.canManage || auth.isLawyer || auth.isReviewer,
      children: [
        { label: '分派审核', key: '/assignments' },
        { label: '我的任务', key: '/assignments/mine' },
      ],
    },
    {
      label: '用户管理',
      key: '/users',
      icon: () => h(DocumentTextOutline),
      show: auth.canManage,
    },
    {
      label: '系统配置',
      key: '/configs',
      icon: () => h(SettingsOutline),
      show: auth.isAdmin,
    },
  ]
  return base.filter((x: any) => x.show !== false).map((x: any) => {
    const o = { label: x.label, key: x.key, icon: x.icon } as any
    if (x.children) o.children = x.children.filter((c: any) => c.show !== false)
    return o
  })
})

function navTo(key: string) {
  if (key !== route.path) router.push(key)
}

const currentPageTitle = computed(() => {
  const m = {
    '/': '工作台',
    '/checklists': '检查清单',
    '/checklists/submissions': '我的提交',
    '/checklists/create': '新建合规检查',
    '/checklists/templates': '模板管理',
    '/gaps': '合规缺口',
    '/gaps/risk-board': '期限风险看板',
    '/assignments': '分派审核',
    '/assignments/mine': '我的任务',
    '/users': '用户管理',
    '/configs': '系统配置',
  }
  return (m as any)[route.path] || '青禾合规清单台'
})

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    admin: '系统管理员',
    compliance_manager: '合规经理',
    lawyer: '律师',
    reviewer: '复核人',
    submitter: '业务提交人',
  }
  return map[auth.user?.role || ''] || '成员'
})

const userMenuOptions = [
  { label: '个人中心', key: 'profile' },
  { label: '退出登录', key: 'logout' },
]

function onUserSelect(key: string) {
  if (key === 'logout') {
    auth.logout()
    router.push('/login')
  }
}

watch(() => auth.isLoggedIn, (v) => {
  if (!v && route.path !== '/login') router.push('/login')
})
</script>

<style scoped>
.sider-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 18px;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.brand-logo {
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  background: linear-gradient(135deg, #2d8a5e, #52b788);
  border-radius: 10px;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}
.brand-name {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.header-inner {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s;
}
.user-info:hover { background: #f4f6f5; }
.user-text { line-height: 1.2; }
.user-name { font-size: 14px; font-weight: 500; color: #1f2937; }
.user-role { font-size: 12px; color: #6b7280; }
:deep(.n-menu-item) { color: #cbd5e1 !important; }
:deep(.n-menu-item-content-header) { color: #cbd5e1 !important; }
:deep(.n-menu-item.n-menu-item--selected) { background: rgba(45, 138, 94, 0.2) !important; }
:deep(.n-menu-item.n-menu-item--selected .n-menu-item-content-header) { color: #52b788 !important; }
:deep(.n-menu-item:hover) { background: rgba(255,255,255,0.05) !important; }
:deep(.n-menu-children-wrapper) { background: #1a2621 !important; }
</style>
