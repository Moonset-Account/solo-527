<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, Package, ArrowLeftRight, AlertTriangle, ShoppingCart,
  CalendarCheck, BarChart3, DollarSign, Tag, TrendingUp, Search,
  Bell, Settings2, ChevronDown, ChevronRight,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

interface NavChild {
  label: string
  path: string
}

interface NavItem {
  label: string
  icon: any
  path?: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { label: '生产看板', icon: LayoutDashboard, path: '/' },
  {
    label: '耗材管理', icon: Package,
    children: [
      { label: '库存列表', path: '/inventory' },
      { label: '出入库记录', path: '/inventory/records' },
      { label: '报损登记', path: '/inventory/damage' },
      { label: '补货提醒', path: '/inventory/restock' },
    ],
  },
  { label: '预约订单', icon: CalendarCheck, path: '/appointments' },
  {
    label: '消耗分析', icon: BarChart3,
    children: [
      { label: '顾问提成', path: '/analytics/commission' },
      { label: '项目价格', path: '/analytics/pricing' },
      { label: '耗材排行', path: '/analytics/consumption' },
      { label: '异常追溯', path: '/analytics/anomaly' },
    ],
  },
  {
    label: '评价提醒', icon: Bell,
    children: [
      { label: '提醒列表', path: '/reminders' },
      { label: '规则配置', path: '/reminders/rules' },
    ],
  },
]

const expandedGroups = ref<string[]>(['耗材管理', '消耗分析', '评价提醒'])

function isGroupExpanded(label: string) {
  return expandedGroups.value.includes(label)
}

function toggleGroup(label: string) {
  const idx = expandedGroups.value.indexOf(label)
  if (idx >= 0) expandedGroups.value.splice(idx, 1)
  else expandedGroups.value.push(label)
}

function isActive(path?: string) {
  if (!path) return false
  return route.path === path || route.path.startsWith(path + '/')
}

function navigate(path: string) {
  router.push(path)
}

const sidebarCollapsed = ref(false)
</script>

<template>
  <aside
    :class="[
      'flex flex-col bg-white border-r border-rosegold/10 transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-60',
    ]"
  >
    <div class="h-16 flex items-center px-4 border-b border-rosegold/10">
      <div
        class="flex items-center gap-2 cursor-pointer"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <div class="w-8 h-8 rounded-lg bg-rosegold flex items-center justify-center">
          <Package class="w-5 h-5 text-white" />
        </div>
        <span v-if="!sidebarCollapsed" class="font-semibold text-rosegold text-lg whitespace-nowrap">美甲库存</span>
      </div>
    </div>

    <nav class="flex-1 overflow-auto py-4">
      <template v-for="item in navItems" :key="item.label">
        <div v-if="item.path" class="px-3 mb-1">
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive(item.path)
                ? 'bg-rosegold/10 text-rosegold font-medium'
                : 'text-grayrose hover:bg-rosegold/5 hover:text-rosegold',
            ]"
            @click="navigate(item.path!)"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </button>
        </div>

        <div v-else class="mb-1">
          <button
            class="w-full flex items-center gap-3 px-6 py-2.5 text-sm text-grayrose hover:text-rosegold transition-colors"
            @click="toggleGroup(item.label)"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!sidebarCollapsed" class="flex-1 text-left">{{ item.label }}</span>
            <component
              :is="isGroupExpanded(item.label) ? ChevronDown : ChevronRight"
              v-if="!sidebarCollapsed"
              class="w-4 h-4"
            />
          </button>
          <div v-if="isGroupExpanded(item.label) && !sidebarCollapsed" class="mt-1">
            <button
              v-for="child in item.children"
              :key="child.path"
              :class="[
                'w-full flex items-center gap-2 pl-12 pr-4 py-2 text-sm transition-colors',
                isActive(child.path)
                  ? 'text-rosegold font-medium bg-rosegold/5'
                  : 'text-grayrose/70 hover:text-rosegold',
              ]"
              @click="navigate(child.path)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="isActive(child.path) ? 'bg-rosegold' : 'bg-grayrose/40'" />
              {{ child.label }}
            </button>
          </div>
        </div>
      </template>
    </nav>

    <div class="border-t border-rosegold/10 p-3">
      <button
        class="w-full flex items-center gap-3 px-3 py-2 text-sm text-grayrose hover:text-rosegold transition-colors"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <Settings2 class="w-5 h-5 flex-shrink-0" />
        <span v-if="!sidebarCollapsed">收起侧栏</span>
      </button>
    </div>
  </aside>
</template>
