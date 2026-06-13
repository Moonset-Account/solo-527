<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="logo">
        <el-icon><Cup /></el-icon>
        <span style="margin-left: 8px">茶饮库存管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页概览</span>
        </el-menu-item>

        <el-sub-menu index="operations">
          <template #title>
            <el-icon><Edit /></el-icon>
            <span>操作入口</span>
          </template>
          <el-menu-item index="/operations/sales">
            <el-icon><Money /></el-icon>
            <span>营业录入</span>
          </el-menu-item>
          <el-menu-item index="/operations/exceptions">
            <el-icon><Warning /></el-icon>
            <span>异常录入</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="process">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>处理记录</span>
          </template>
          <el-menu-item index="/process/records">
            <el-icon><List /></el-icon>
            <span>全部记录</span>
          </el-menu-item>
          <el-menu-item index="/process/inspections">
            <el-icon><Search /></el-icon>
            <span>巡店任务</span>
          </el-menu-item>
          <el-menu-item index="/process/cash-flows">
            <el-icon><Wallet /></el-icon>
            <span>现金流水</span>
          </el-menu-item>
          <el-menu-item index="/process/inventory-logs">
            <el-icon><Box /></el-icon>
            <span>食材库存</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/rectifications">
          <el-icon><Tools /></el-icon>
          <span>整改管理</span>
        </el-menu-item>

        <el-sub-menu index="reports">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>报表中心</span>
          </template>
          <el-menu-item index="/reports/profit">
            <el-icon><TrendCharts /></el-icon>
            <span>利润报表</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="admin">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>管理设置</span>
          </template>
          <el-menu-item index="/admin/safety-stocks">
            <el-icon><Shield /></el-icon>
            <span>安全库存</span>
          </el-menu-item>
          <el-menu-item index="/admin/loss-reasons">
            <el-icon><Memo /></el-icon>
            <span>报损原因</span>
          </el-menu-item>
          <el-menu-item index="/admin/ingredients">
            <el-icon><Coffee /></el-icon>
            <span>食材管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>

    <div class="main-content">
      <div class="top-header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              <el-icon><UserFilled /></el-icon>
              {{ authStore.currentUser?.fullName || '用户' }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  return route.meta.title || '首页'
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await authStore.logout()
      router.push('/login')
    } catch (e) {
      // cancelled
    }
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background: #001529;
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #1f3a5c;
  color: #fff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title) {
  color: #fff;
}
</style>
