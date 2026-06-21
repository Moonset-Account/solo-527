<template>
  <n-layout style="min-height: 100vh">
    <client-only>
      <n-layout-header style="background: #fff; border-bottom: 1px solid #eee">
        <div style="display: flex; justify-content: space-between; align-items: center; height: 64px; padding: 0 24px">
          <div style="display: flex; align-items: center; gap: 16px">
            <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #18a058">
              🍞 烘焙门店巡店整改系统
            </h1>
          </div>
          <div style="display: flex; align-items: center; gap: 16px">
            <n-tag v-if="currentStore" type="info">
              {{ currentStore.name }}
            </n-tag>
            <n-dropdown trigger="click" :options="userMenuOptions" @select="handleUserMenuSelect">
              <div style="display: flex; align-items: center; gap: 8px; cursor: pointer">
                <n-avatar size="small" style="background-color: #18a058">
                  {{ user?.full_name?.charAt(0) || 'U' }}
                </n-avatar>
                <span style="color: #333">{{ user?.full_name }}</span>
                <n-tag :type="getRoleTagType(user?.role)" size="small">
                  {{ getRoleLabel(user?.role) }}
                </n-tag>
              </div>
            </n-dropdown>
          </div>
        </div>
      </n-layout-header>

      <n-layout has-sider>
        <n-layout-sider
          width="240"
          :collapsed-width="64"
          show-trigger
          collapse-mode="width"
          style="background: #001529"
        >
          <n-scrollbar>
            <n-menu
              :value="activeMenu"
              :options="menuOptions"
              :collapsed="false"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              @update:value="handleMenuSelect"
              style="border-right: none; background: transparent"
            />
          </n-scrollbar>
        </n-layout-sider>

        <n-layout-content style="background: #f5f5f5">
          <div class="page-container">
            <slot />
          </div>
        </n-layout-content>
      </n-layout>
    </client-only>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeOutline,
  FileTrayOutline,
  AlertCircleOutline,
  StorefrontOutline,
  DocumentTextOutline,
  ConstructOutline,
  CashOutline,
  PeopleOutline,
  SettingsOutline,
  LogOutOutline,
  PersonOutline
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const { user, logout, isSupervisor, isStoreManager, isBaker } = useAuth()
const { getStores } = useMasterApi()

const stores = ref<Store[]>([])
const currentStore = ref<Store | null>(null)
const activeMenu = ref('dashboard')

const menuOptions = computed(() => {
  const options: any[] = [
    {
      label: '工作台',
      key: 'dashboard',
      icon: () => h(HomeOutline)
    }
  ]

  if (isBaker()) {
    options.push(
      {
        label: '烘焙批次',
        key: 'batch',
        icon: () => h(FileTrayOutline)
      },
      {
        label: '报损登记',
        key: 'loss',
        icon: () => h(AlertCircleOutline)
      }
    )
  }

  if (isStoreManager()) {
    options.push(
      {
        label: '库存管理',
        key: 'inventory',
        icon: () => h(StorefrontOutline)
      },
      {
        label: '库存预警',
        key: 'alerts',
        icon: () => h(AlertCircleOutline)
      }
    )
  }

  if (isSupervisor()) {
    options.push(
      {
        label: '巡店任务',
        key: 'inspection',
        icon: () => h(DocumentTextOutline)
      },
      {
        label: '整改管理',
        key: 'rectification',
        icon: () => h(ConstructOutline)
      }
    )
  }

  if (isStoreManager()) {
    options.push(
      {
        label: '现金流水',
        key: 'cashflow',
        icon: () => h(CashOutline)
      },
      {
        label: '人力成本',
        key: 'labor',
        icon: () => h(PeopleOutline)
      }
    )
  }

  if (isSupervisor()) {
    options.push(
      {
        label: '系统设置',
        key: 'settings',
        icon: () => h(SettingsOutline)
      }
    )
  }

  return options
})

const userMenuOptions = computed(() => [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(PersonOutline)
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(LogOutOutline)
  }
])

const getRoleLabel = (role?: string) => {
  const map: Record<string, string> = {
    admin: '系统管理员',
    supervisor: '区域督导',
    store_manager: '店长',
    baker: '烘焙师',
    cashier: '收银员'
  }
  return map[role || ''] || role
}

const getRoleTagType = (role?: string) => {
  const map: Record<string, string> = {
    admin: 'error',
    supervisor: 'warning',
    store_manager: 'info',
    baker: 'success',
    cashier: 'default'
  }
  return map[role || ''] as any || 'default'
}

const handleMenuSelect = (key: string) => {
  activeMenu.value = key
  router.push(`/${key}`)
}

const handleUserMenuSelect = (key: string) => {
  if (key === 'logout') {
    logout()
  } else if (key === 'profile') {
    router.push('/profile')
  }
}

onMounted(async () => {
  activeMenu.value = route.path.substring(1) || 'dashboard'
  try {
    stores.value = await getStores()
    if (user.value?.store_id) {
      currentStore.value = stores.value.find(s => s.id === user.value?.store_id) || null
    }
  } catch (e) {
    console.error('Failed to load stores:', e)
  }
})
</script>
