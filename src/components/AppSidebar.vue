<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  FlaskConical,
  FileText,
  BarChart3,
  Shield,
  Wallet,
  UserCheck,
  Package,
  Monitor,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()

const navItems = [
  { path: '/inventory', label: '库存统计', icon: FlaskConical },
  { path: '/requisition', label: '领用申请', icon: FileText },
  { path: '/project-report', label: '课题报表', icon: BarChart3 },
  { path: '/compliance', label: '安全合规', icon: Shield },
  { path: '/finance', label: '经费管理', icon: Wallet },
  { path: '/permission', label: '权限审核', icon: UserCheck },
  { path: '/batch', label: '试剂批次', icon: Package },
  { path: '/equipment', label: '设备看板', icon: Monitor },
  { path: '/history', label: '操作历史', icon: Clock },
]

const sidebarWidth = computed(() =>
  props.collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
)
</script>

<template>
  <aside
    class="sidebar"
    :style="{ width: sidebarWidth }"
  >
    <div class="sidebar-header">
      <FlaskConical v-if="!collapsed" :size="24" class="text-accent-400" />
      <FlaskConical v-else :size="20" class="text-accent-400" />
      <span v-if="!collapsed" class="sidebar-title">试剂管理系统</span>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <component :is="item.icon" :size="20" />
        <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <button class="collapse-btn" @click="emit('toggle')">
      <ChevronLeft v-if="!collapsed" :size="18" />
      <ChevronRight v-else :size="18" />
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  height: 100vh;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 30;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  min-height: 56px;
}

.sidebar-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 2px;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: rgba(13, 148, 136, 0.15);
  color: #2DD4BF;
}

.nav-label {
  font-size: 14px;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  background: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: var(--color-text-primary);
}
</style>
