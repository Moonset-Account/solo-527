<template>
  <el-container class="admin-layout">
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="logo">
        <el-icon :size="24" color="#fff"><NailPolish /></el-icon>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">美甲店管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        router
        background-color="#001529"
        text-color="#bfcbd9"
        active-text-color="#fff"
      >
        <template v-for="item in menuItems" :key="item.path">
          <el-menu-item :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar()">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                {{ userStore.userInfo?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.name || userStore.userInfo?.username }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
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
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Odometer,
  Calendar,
  Goods,
  UserFilled,
  Clock,
  Finished,
  Money,
  CreditCard,
  Avatar,
  Bell,
  Collection,
  Setting,
  Document,
  Fold,
  Expand,
  CaretBottom,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const sidebarWidth = computed(() => appStore.sidebarCollapsed ? '64px' : '220px')

const menuItems = [
  { path: '/admin/dashboard', title: '工作台', icon: 'Odometer' },
  { path: '/admin/appointments', title: '预约管理', icon: 'Calendar' },
  { path: '/admin/services', title: '服务项目', icon: 'Goods' },
  { path: '/admin/technicians', title: '技师管理', icon: 'UserFilled' },
  { path: '/admin/schedule', title: '排班管理', icon: 'Clock' },
  { path: '/admin/checkin', title: '到店核销', icon: 'Finished' },
  { path: '/admin/cashier', title: '收银记录', icon: 'Money' },
  { path: '/admin/memberships', title: '会员卡', icon: 'CreditCard' },
  { path: '/admin/customer-memberships', title: '会员管理', icon: 'Avatar' },
  { path: '/admin/reminders', title: '提醒规则', icon: 'Bell' },
  { path: '/admin/dictionary', title: '字典管理', icon: 'Collection' },
  { path: '/admin/settings', title: '系统设置', icon: 'Setting' },
  { path: '/admin/logs', title: '操作日志', icon: 'Document' },
]

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item?.title || ''
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    // 跳转到个人中心
  }
}
</script>

<script lang="js">
export default {
  components: {
    NailPolish: {
      template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 11V2h-2v9H7v2h3v9h2v-9h3v-2h-3z"/></svg>'
    }
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 16px;
    font-weight: bold;

    .logo-text {
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #666;

      &:hover {
        color: #e91e63;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        font-size: 14px;
        color: #333;
      }
    }
  }
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
