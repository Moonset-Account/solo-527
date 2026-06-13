<template>
  <n-config-provider>
    <n-message-provider>
      <n-dialog-provider>
        <n-layout has-sider>
          <n-layout-sider
            :width="240"
            :collapsed-width="64"
            v-model:collapsed="collapsed"
            show-trigger
            collapse-mode="width"
            bordered
          >
            <div class="logo-area">
              <span class="logo-icon">🌱</span>
              <span v-if="!collapsed" class="logo-text">青禾质检台</span>
            </div>

            <n-menu
              :value="activeMenu"
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions"
              @update:value="handleMenuClick"
            />
          </n-layout-sider>

          <n-layout>
            <n-layout-header bordered class="header">
              <div class="header-left">
                <n-page-header :title="pageTitle" />
              </div>
              <div class="header-right">
                <n-space>
                  <n-tag v-if="auth.user" :type="roleTagType" size="small">
                    {{ roleLabel }}
                  </n-tag>
                  <n-dropdown :options="userOptions" @select="handleUserAction">
                    <n-button text>
                      <n-space>
                        <n-avatar round size="small">{{ auth.user?.username?.charAt(0).toUpperCase() }}</n-avatar>
                        <span>{{ auth.user?.full_name || auth.user?.username }}</span>
                      </n-space>
                    </n-button>
                  </n-dropdown>
                </n-space>
              </div>
            </n-layout-header>

            <n-layout-content class="main-content">
              <slot />
            </n-layout-content>
          </n-layout>
        </n-layout>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuOption, DropdownOption } from 'naive-ui'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const activeMenu = ref('dashboard')

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'dashboard': '工作台',
    'tickets': '工单管理',
    'knowledge-base': '知识库',
    'stats': '统计分析',
    'risk': '风险样本',
    'feedback': '客户反馈',
    'users': '用户管理'
  }
  const path = route.path.split('/')[1] || 'dashboard'
  return titles[path] || '工作台'
})

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    { label: '工作台', key: 'dashboard', icon: () => h('span', '📊') }
  ]

  if (!auth.isCustomer) {
    options.push({ label: '工单管理', key: 'tickets', icon: () => h('span', '🎫') })
  } else {
    options.push({ label: '我的工单', key: 'tickets', icon: () => h('span', '🎫') })
  }

  options.push({ label: '知识库', key: 'knowledge-base', icon: () => h('span', '📚') })

  if (auth.canViewStats) {
    options.push({ label: '统计分析', key: 'stats', icon: () => h('span', '📈') })
    options.push({ label: '风险样本', key: 'risk', icon: () => h('span', '⚠️') })
    options.push({ label: '客户反馈', key: 'feedback', icon: () => h('span', '💬') })
  }

  if (auth.isAdmin) {
    options.push({ label: '用户管理', key: 'users', icon: () => h('span', '👥') })
  }

  return options
})

const userOptions = computed<DropdownOption[]>(() => [
  { label: '个人设置', key: 'profile' },
  { label: '退出登录', key: 'logout' }
])

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    admin: '管理员',
    supervisor: '客服主管',
    agent: '客服',
    customer: '客户'
  }
  return labels[auth.userRole] || auth.userRole
})

const roleTagType = computed(() => {
  const types: Record<string, any> = {
    admin: 'error',
    supervisor: 'warning',
    agent: 'info',
    customer: 'default'
  }
  return types[auth.userRole] || 'default'
})

const handleMenuClick = (key: string) => {
  activeMenu.value = key
  if (key === 'dashboard') {
    router.push('/')
  } else {
    router.push(`/${key}`)
  }
}

const handleUserAction = (key: string) => {
  if (key === 'logout') {
    auth.clearAuth()
    router.push('/login')
  }
}

onMounted(() => {
  auth.restoreAuth()
  if (!auth.isLoggedIn) {
    router.push('/login')
  }
  const path = route.path.split('/')[1] || 'dashboard'
  activeMenu.value = path
})

watch(() => route.path, (newPath) => {
  const path = newPath.split('/')[1] || 'dashboard'
  activeMenu.value = path
})
</script>

<style scoped lang="scss">
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid #e8e8e8;

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #18a058;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
  }
}

.main-content {
  background-color: #f2f3f5;
  padding: 0;
}
</style>
