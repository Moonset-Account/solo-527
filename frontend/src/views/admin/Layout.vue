<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="220px" class="sidebar">
        <div class="sidebar-logo">
          <el-icon :size="28" color="#409eff"><Tools /></el-icon>
          <span class="logo-text">维修管理系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#001529"
          text-color="#b9bbbe"
          active-text-color="#ffffff"
          router
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/orders">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/technicians">
            <el-icon><User /></el-icon>
            <span>师傅管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/price-rules">
            <el-icon><PriceTag /></el-icon>
            <span>价格规则</span>
          </el-menu-item>
          <el-menu-item index="/admin/configs">
            <el-icon><Setting /></el-icon>
            <span>配置管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/statistics">
            <el-icon><TrendCharts /></el-icon>
            <span>统计分析</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <span v-if="isDemoMode" class="demo-badge">
              <el-tag type="warning">演示数据</el-tag>
            </span>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32">
                  {{ adminStore.adminInfo?.nickname?.charAt(0) || '管' }}
                </el-avatar>
                <span class="username">{{ adminStore.adminInfo?.nickname || '管理员' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="home">返回前台</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Tools, DataAnalysis, Document, User, PriceTag, Setting,
  TrendCharts, ArrowDown
} from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const appStore = useAppStore()

const isDemoMode = computed(() => appStore.isDemoMode)

const activeMenu = computed(() => {
  return route.path
})

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      break
    case 'home':
      router.push('/')
      break
    case 'logout':
      adminStore.logout()
      ElMessage.success('已退出登录')
      router.push('/admin/login')
      break
  }
}
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;

  :deep(.el-container) {
    height: 100%;
  }

  .sidebar {
    background-color: #001529;
    transition: width 0.3s;

    .sidebar-logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border-bottom: 1px solid #1f2d3d;

      .logo-text {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .sidebar-menu {
      border-right: none;
      height: calc(100vh - 60px);
    }

    :deep(.el-menu) {
      border-right: none;
    }

    :deep(.el-menu-item) {
      &:hover {
        background-color: #1890ff !important;
      }

      &.is-active {
        background-color: #1890ff !important;
      }
    }
  }

  .header {
    background: #fff;
    padding: 0 24px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;

    .header-left {
      display: flex;
      align-items: center;
    }

    .header-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .username {
          color: #606266;
        }
      }
    }

    .demo-badge {
      margin-left: 16px;
    }
  }

  .main-content {
    background: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}
</style>
