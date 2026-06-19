<template>
  <n-layout has-sider>
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="h-16 flex items-center justify-center border-b">
        <n-icon size="28" v-if="collapsed">
          <HeartOutline />
        </n-icon>
        <span v-else class="text-lg font-bold text-primary">心理咨询管理</span>
      </div>
      <n-menu
        :value="route.path"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuClick"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="h-16 flex items-center justify-between px-4">
        <div class="flex items-center space-x-4">
          <span class="text-lg font-semibold">{{ pageTitle }}</span>
        </div>
        <div class="flex items-center space-x-4">
          <n-dropdown :options="userMenuOptions" @select="handleUserAction">
            <div class="flex items-center cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg">
              <n-avatar size="small" :src="null">
                {{ user?.real_name?.charAt(0) || 'U' }}
              </n-avatar>
              <span class="ml-2">{{ user?.real_name }}</span>
              <n-icon class="ml-1">
                <ChevronDownOutline />
              </n-icon>
            </div>
          </n-dropdown>
        </div>
      </n-layout-header>
      <n-layout-content content-style="padding: 24px; min-height: calc(100vh - 64px);">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NIcon,
  NAvatar,
  NDropdown,
  MenuOption,
  DropdownOption
} from 'naive-ui'
import {
  HomeOutline,
  CalendarOutline,
  PeopleOutline,
  AddCircleOutline,
  SettingsOutline,
  BarChartOutline,
  HeartOutline,
  ChevronDownOutline,
  TimeOutline,
  AlertCircleOutline,
  ReceiptOutline
} from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const { user, logout } = useAuth()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

const menuOptions: MenuOption[] = [
  {
    label: '首页',
    key: '/',
    icon: () => h(HomeOutline)
  },
  {
    label: '预约管理',
    key: '/appointments',
    icon: () => h(CalendarOutline),
    children: [
      {
        label: '新建预约',
        key: '/appointments/new',
        icon: () => h(AddCircleOutline)
      },
      {
        label: '预约列表',
        key: '/appointments',
        icon: () => h(ReceiptOutline)
      }
    ]
  },
  {
    label: '排班管理',
    key: '/schedules',
    icon: () => h(TimeOutline),
    children: [
      {
        label: '班次设置',
        key: '/schedules/time-slots',
        icon: () => h(TimeOutline)
      },
      {
        label: '排班列表',
        key: '/schedules',
        icon: () => h(CalendarOutline)
      }
    ]
  },
  {
    label: '咨询师管理',
    key: '/counselors',
    icon: () => h(PeopleOutline)
  },
  {
    label: '系统配置',
    key: '/config',
    icon: () => h(SettingsOutline),
    children: [
      {
        label: '爽约名单',
        key: '/config/no-show',
        icon: () => h(AlertCircleOutline)
      },
      {
        label: '操作日志',
        key: '/config/logs',
        icon: () => h(ReceiptOutline)
      }
    ]
  },
  {
    label: '数据报表',
    key: '/reports',
    icon: () => h(BarChartOutline),
    children: [
      {
        label: '导出明细',
        key: '/reports/export',
        icon: () => h(BarChartOutline)
      },
      {
        label: '任务监控',
        key: '/reports/tasks',
        icon: () => h(TimeOutline)
      }
    ]
  }
]

const userMenuOptions: DropdownOption[] = [
  {
    label: '个人设置',
    key: 'profile'
  },
  {
    label: '退出登录',
    key: 'logout'
  }
]

const pageTitle = computed(() => {
  const findTitle = (options: MenuOption[], key: string): string => {
    for (const opt of options) {
      if (opt.key === key) return opt.label as string
      if (opt.children) {
        const found = findTitle(opt.children, key)
        if (found) return found
      }
    }
    return '首页'
  }
  return findTitle(menuOptions, route.path)
})

function handleMenuClick(key: string) {
  router.push(key)
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    logout()
  } else if (key === 'profile') {
    router.push('/profile')
  }
}
</script>
