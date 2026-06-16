<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  Odometer,
  Monitor,
  Moon,
  Box,
  DataLine,
  Document,
  Clock,
  User,
  UserFilled,
  Fold,
  Expand,
  CaretBottom,
  SwitchButton,
  Avatar
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const userDropdownVisible = ref(false)

const iconMap = {
  Odometer,
  Monitor,
  Moon,
  Box,
  DataLine,
  Document,
  Clock,
  User,
  UserFilled
}

const menuItems = computed(() => {
  const routes = router.options.routes
  const mainRoute = routes.find(r => r.path === '/' && r.children)
  if (!mainRoute) return []

  return mainRoute.children
    .filter(child => !child.meta?.hidden)
    .filter(child => {
      if (child.meta?.permission) {
        return userStore.hasPermission(child.meta.permission)
      }
      return true
    })
    .map(child => ({
      path: `/${child.path}`,
      name: child.name,
      title: child.meta?.title || child.name,
      icon: child.meta?.icon,
      permission: child.meta?.permission
    }))
})

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    router.push('/login')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Logout error:', e)
    }
  }
}

const handleMenuSelect = (index) => {
  router.push(index)
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse" class="logo-text">管理系统</span>
        <span v-else class="logo-icon">管</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        class="sidebar-menu"
        background-color="#001529"
        text-color="#b9c0cc"
        active-text-color="#ffffff"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <component v-if="item.icon && iconMap[item.icon]" :is="iconMap[item.icon]" />
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="(cmd) => cmd === 'logout' && handleLogout()">
            <div class="user-info">
              <el-avatar :size="32" :icon="Avatar">
                {{ userStore.userInfo?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.name || '用户' }}</span>
              <el-icon class="caret"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon style="margin-right: 8px"><SwitchButton /></el-icon>
                  退出登录
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

<style scoped>
.layout-container {
  height: 100%;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.logo-icon {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.sidebar-menu .el-menu-item.is-active {
  background-color: var(--primary-color);
}

.main-container {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-page);
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
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
  color: var(--text-regular);
  transition: color 0.3s;
}

.collapse-btn:hover {
  color: var(--primary-color);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: var(--border-extra-light);
}

.username {
  font-size: 14px;
  color: var(--text-regular);
}

.caret {
  font-size: 12px;
  color: var(--text-secondary);
}

.main-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
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
