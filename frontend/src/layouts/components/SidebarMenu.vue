<template>
  <div class="sidebar-menu">
    <div class="logo">
      <el-icon v-if="appStore.sidebarCollapsed" :size="28" color="#fff"><Promotion /></el-icon>
      <span v-else class="logo-text">{{ import.meta.env.VITE_APP_TITLE }}</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        unique-opened
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="hasVisibleChildren(route)"
            :index="resolvePath(route.path)"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in getVisibleChildren(route)"
              :key="child.path"
              :index="resolveChildPath(route.path, child.path)"
            >
              <el-icon v-if="child.meta?.icon"><component :is="child.meta.icon" /></el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="resolvePath(route.path)">
            <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const menuRoutes = computed<RouteRecordRaw[]>(() => {
  const layoutRoute = router.options.routes.find(r => r.path === '/')
  return (layoutRoute?.children || []).filter(r => r.meta?.title && !r.meta?.hidden)
})

const activeMenu = computed(() => {
  const matched = route.matched
  if (matched.length > 2) {
    return `/${matched[1].path}/${matched[2].path}`
  }
  return route.path
})

function hasVisibleChildren(route: RouteRecordRaw): boolean {
  return getVisibleChildren(route).length > 0
}

function getVisibleChildren(route: RouteRecordRaw): RouteRecordRaw[] {
  if (!route.children) return []
  return route.children.filter(r => r.meta?.title && !r.meta?.hidden)
}

function resolvePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function resolveChildPath(parentPath: string, childPath: string) {
  const parent = parentPath.startsWith('/') ? parentPath : `/${parentPath}`
  const child = childPath.startsWith('/') ? childPath.slice(1) : childPath
  if (!child) return parent
  return `${parent}/${child}`
}
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
}

.logo-text {
  white-space: nowrap;
}

:deep(.el-scrollbar) {
  flex: 1;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu--collapse .el-sub-menu__title) {
  padding-left: 20px !important;
}
</style>
