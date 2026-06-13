<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="24" color="#fff"><VideoPlay /></el-icon>
        <span>短视频审稿系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-sub-menu index="content">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/contents">内容列表</el-menu-item>
          <el-menu-item index="/contents/create">新建内容</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/review-flows">
          <el-icon><Connection /></el-icon>
          <span>审稿流程</span>
        </el-menu-item>
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常池</span>
        </el-menu-item>
        <el-sub-menu index="operation">
          <template #title>
            <el-icon><Operation /></el-icon>
            <span>运营中心</span>
          </template>
          <el-menu-item index="/platform-accounts">平台账号</el-menu-item>
          <el-menu-item index="/materials">采访素材</el-menu-item>
          <el-menu-item index="/schedules">发布排期</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/settings/dict">字典项管理</el-menu-item>
          <el-menu-item index="/settings/config">系统配置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" style="background: #409EFF">
                {{ userStore.currentUser?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.currentUser?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
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
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const activeMenu = computed(() => route.path)

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100%;
}
.sidebar {
  background: #304156;
  color: #fff;
  overflow: hidden;
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    background: #2b3648;
  }
  .sidebar-menu {
    border: none;
  }
}
.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      .user-name {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}
.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
