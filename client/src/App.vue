<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-logo">
        <el-icon :size="24"><Lock /></el-icon>
        <span class="header-title">社团活动交易保障平台</span>
      </div>
    </el-header>
    <el-container class="app-body">
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="aside-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/">
            <el-icon><List /></el-icon>
            <span>活动列表</span>
          </el-menu-item>
          <el-menu-item index="/activity/create">
            <el-icon><Plus /></el-icon>
            <span>发布活动</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><Warning /></el-icon>
            <span>举报管理</span>
          </el-menu-item>
          <el-menu-item index="/refunds">
            <el-icon><RefreshLeft /></el-icon>
            <span>退款管理</span>
          </el-menu-item>
          <el-menu-item index="/config">
            <el-icon><Setting /></el-icon>
            <span>配置中心</span>
          </el-menu-item>
          <el-menu-item index="/download">
            <el-icon><Download /></el-icon>
            <span>下载明细</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Lock,
  List,
  Plus,
  Warning,
  RefreshLeft,
  Setting,
  Download
} from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  if (route.path.startsWith('/activity/') && route.path !== '/activity/create') {
    return '/'
  }
  return route.path
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #1a3a5c 0%, #2b5f8a 100%);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 2px;
}

.app-body {
  flex: 1;
  overflow: hidden;
}

.app-aside {
  background-color: #304156;
  overflow-y: auto;
}

.aside-menu {
  border-right: none;
}

.aside-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.aside-menu .el-menu-item:hover {
  background-color: #263445 !important;
}

.aside-menu .el-menu-item.is-active {
  background-color: #263445 !important;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
