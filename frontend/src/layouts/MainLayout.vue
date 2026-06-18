<template>
  <el-container class="main-layout">
    <el-aside :width="sidebarWidth" class="layout-sidebar">
      <div class="logo">
        <el-icon :size="26" color="#fff"><DataAnalysis /></el-icon>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">增长异常监控</span>
      </div>
      <el-scrollbar class="menu-scroll">
        <el-menu
          :default-active="activeMenu"
          :collapse="appStore.sidebarCollapsed"
          :unique-opened="true"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
          router
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-sub-menu
              v-if="route.children && route.children.filter(c => !c.meta?.hidden).length > 0"
              :index="route.path"
            >
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in route.children.filter(c => !c.meta?.hidden)"
                :key="child.path"
                :index="resolvePath(route.path, child.path)"
              >
                {{ child.meta?.title }}
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="route.path">
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="toggle-btn" :size="20" @click="appStore.toggleSidebar()">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-center">
          <el-input
            v-model="searchInput"
            placeholder="搜索异常、数据集、报表..."
            clearable
            :prefix-icon="Search"
            class="global-search"
            @keyup.enter="goSearch"
            @clear="goSearch"
          >
            <template #prepend>
              <el-button @click="goSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>

        <div class="header-right">
          <el-badge
            :value="appStore.notificationCount"
            :hidden="appStore.notificationCount === 0"
            class="badge-item"
            type="danger"
          >
            <el-button link @click="router.push('/notifications')">
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>

          <el-dropdown trigger="click" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" style="background:#409eff" />
              <span class="user-name">{{ userStore.userInfo?.name }}</span>
              <el-tag :type="roleTagType" size="small" effect="plain">
                {{ roleLabel }}
              </el-tag>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item @click="goChangePassword">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { roleMap } from '@/utils'
import { getUnreadCount } from '@/api/notifications'
import {
  DataAnalysis, Fold, Expand, Search, Bell, UserFilled,
  ArrowDown, User, Lock, SwitchButton
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import type { RouteRecordRaw } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const sidebarWidth = computed(() => appStore.sidebarCollapsed ? '64px' : '220px')
const searchInput = ref('')

const roleLabel = computed(() => roleMap[userStore.userInfo?.role || '']?.label || '未知')
const roleTagType = computed(() => {
  const r = userStore.userInfo?.role
  if (r === 'admin') return 'danger'
  if (r === 'manager') return 'success'
  if (r === 'operator') return 'primary'
  return 'info'
})

const mainRoutes = router.options.routes.find(r => r.path === '/')?.children || []
const menuRoutes = computed(() => {
  return (mainRoutes as RouteRecordRaw[]).filter(r => {
    if (r.meta?.hidden) return false
    if (r.meta?.roles && !r.meta.roles.includes(userStore.userInfo?.role || '')) return false
    return true
  })
})

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title)
  return matched.map(r => ({
    path: r.path,
    title: r.meta?.title as string
  }))
})

function resolvePath(parent: string, child: string) {
  if (child.startsWith('/')) return child
  return `${parent}/${child}`.replace(/\/+/g, '/')
}

function goSearch() {
  router.push({ path: '/search', query: { q: searchInput.value } })
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
    await userStore.doLogout()
    router.push('/login')
  } catch (e) { /* cancelled */ }
}

function goChangePassword() {
  router.push('/profile?tab=password')
}

async function loadNotificationCount() {
  try {
    const count = await getUnreadCount()
    appStore.setNotificationCount(count)
  } catch (e) { /* ignore */ }
}

watch(
  () => route.fullPath,
  () => {
    loadNotificationCount()
  },
  { immediate: true }
)

onMounted(() => {
  loadNotificationCount()
  setInterval(loadNotificationCount, 60000)
})
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-sidebar {
  background: $sidebar-bg;
  transition: width 0.25s;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .logo {
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.15);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .menu-scroll {
    flex: 1;

    :deep(.el-menu) {
      border-right: none;
    }
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
    }
  }
}

.layout-header {
  background: $header-bg;
  border-bottom: 1px solid $border-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: $header-height;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 200px;

    .toggle-btn {
      cursor: pointer;
      color: $text-regular;
      padding: 6px;
      border-radius: 4px;
      transition: background 0.15s;

      &:hover {
        background: #f2f6fc;
      }
    }

    .breadcrumb {
      font-size: 14px;
    }
  }

  .header-center {
    flex: 1;
    max-width: 480px;
    padding: 0 24px;

    .global-search {
      :deep(.el-input-group__prepend) {
        padding: 0;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;
    justify-content: flex-end;

    .badge-item :deep(.el-badge__content) {
      top: 6px;
      right: 4px;
    }

    .user-dropdown {
      cursor: pointer;

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.15s;

        &:hover {
          background: #f2f6fc;
        }

        .user-name {
          font-weight: 500;
          color: $text-primary;
        }
      }
    }
  }
}

.layout-main {
  background: $bg-color;
  padding: 0;
  overflow-y: auto;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.25s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
