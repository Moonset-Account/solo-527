<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="sidebar-logo">
        <el-icon :size="24" class="logo-icon"><DataLine /></el-icon>
        <span v-show="!isCollapsed" class="logo-text">能耗看板</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        background-color="#0F4C5C"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <template #title>能耗看板</template>
        </el-menu-item>
        <el-menu-item index="/meters">
          <el-icon><Odometer /></el-icon>
          <template #title>表计管理</template>
        </el-menu-item>
        <el-menu-item index="/zones">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>分区管理</template>
        </el-menu-item>
        <el-sub-menu index="/alarms">
          <template #title>
            <el-icon><Bell /></el-icon>
            <span>告警管理</span>
          </template>
          <el-menu-item index="/alarms">告警列表</el-menu-item>
          <el-menu-item index="/alarms/review">月度复盘</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/subsidies">
          <el-icon><Wallet /></el-icon>
          <template #title>补贴记录</template>
        </el-menu-item>
        <el-menu-item index="/data-query">
          <el-icon><Search /></el-icon>
          <template #title>数据查询</template>
        </el-menu-item>
        <el-menu-item index="/sync">
          <el-icon><Refresh /></el-icon>
          <template #title>同步管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-icon
            :size="20"
            class="collapse-btn"
            @click="toggleCollapse"
          >
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon :size="18"><User /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userName }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleProfile">个人信息</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
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

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  DataLine,
  Odometer,
  OfficeBuilding,
  Bell,
  Wallet,
  Search,
  Refresh,
  Fold,
  Expand,
  User,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
const userName = computed(() => appStore.currentUser?.name || '管理员')

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta?.title)
  return matched.map((item) => ({
    path: item.path,
    title: item.meta.title as string,
  }))
})

function toggleCollapse() {
  appStore.toggleSidebar()
}

function handleProfile() {}

function handleLogout() {
  appStore.clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #0f4c5c;
  overflow: hidden;
  transition: width 0.3s;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  color: #ffffff;
  flex-shrink: 0;
}

.logo-text {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.main-container {
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e6e6e6;
  background-color: #ffffff;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: #333;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #0f4c5c;
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
}

.user-avatar {
  background-color: #0f4c5c;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.main-content {
  background-color: #f5f7fa;
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
