<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse" class="logo-text">青禾会员触达台</span>
        <span v-else class="logo-text">青禾</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="menu"
        background-color="#1f2937"
        text-color="#cbd5e1"
        active-text-color="#ec4899"
      >
        <template v-for="item in menuList" :key="item.path">
          <el-menu-item v-if="!item.hidden" :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag v-if="envLabel" :type="envTagType" size="small" effect="dark" round>
            {{ envLabelText }}
          </el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ user?.name || '用户' }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  角色: {{ roleText }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { user, envInfo } = storeToRefs(userStore)

const isCollapse = ref(false)

const menuList = computed(() => {
  const routes = router.options.routes.find(r => r.path === '/')?.children || []
  return routes
    .filter(r => r.meta && !r.meta.hidden)
    .filter(r => {
      if (!r.meta?.roles) return true
      return r.meta.roles.includes(user.value?.role)
    })
    .map(r => ({
      path: '/' + r.path,
      title: r.meta.title,
      icon: r.meta.icon,
      hidden: r.meta.hidden
    }))
})

const activeMenu = computed(() => route.path)

const currentTitle = computed(() => route.meta?.title || '')

const roleText = computed(() => {
  const map = {
    admin: '系统管理员',
    brand_operator: '品牌会员运营',
    store_guide: '门店导购'
  }
  return map[user.value?.role] || user.value?.role
})

const envLabel = computed(() => envInfo.value?.envLabel || '')

const envLabelText = computed(() => {
  const map = { dev: '开发环境', test: '测试环境', prod: '生产环境', staging: '预发布环境' }
  return map[envLabel.value] || envLabel.value
})

const envTagType = computed(() => {
  const map = { dev: 'info', test: 'warning', staging: 'warning', prod: 'success' }
  return map[envLabel.value] || 'info'
})

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  userStore.getEnvInfo()
})
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #1f2937;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  color: #ec4899;
  font-size: 18px;
  font-weight: bold;
}

.logo-text {
  white-space: nowrap;
}

.menu {
  border-right: none;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #374151;
}

.username {
  font-size: 14px;
}

.main-content {
  background: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
