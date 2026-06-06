<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-left">
        <el-icon class="logo-icon"><Reading /></el-icon>
        <span class="title">儿童绘本馆</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="user?.avatar">
              {{ user?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span class="username">{{ user?.username }}</span>
            <span class="role-badge">{{ roleLabel }}</span>
            <el-icon><ArrowDown /></el-icon>
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
    
    <el-container>
      <el-aside width="220px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/books">
            <el-icon><Reading /></el-icon>
            <span>绘本浏览</span>
          </el-menu-item>
          <el-menu-item index="/activities">
            <el-icon><Calendar /></el-icon>
            <span>活动中心</span>
          </el-menu-item>
          
          <el-sub-menu index="my">
            <template #title>
              <el-icon><User /></el-icon>
              <span>我的</span>
            </template>
            <el-menu-item index="/my/borrowing">我的借阅</el-menu-item>
            <el-menu-item index="/my/activities">我的活动</el-menu-item>
            <el-menu-item index="/my/deposit">押金账户</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu v-if="isLibrarian" index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>后台管理</span>
            </template>
            <el-menu-item index="/admin/books">绘本管理</el-menu-item>
            <el-menu-item index="/admin/borrowing">借阅管理</el-menu-item>
            <el-menu-item index="/admin/repairs">修复管理</el-menu-item>
            <el-menu-item index="/admin/activities">活动管理</el-menu-item>
            <el-menu-item index="/admin/deposits">押金管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isLibrarian = computed(() => userStore.isLibrarian)

const activeMenu = computed(() => route.path)

const roleLabel = computed(() => {
  const roles = {
    admin: '管理员',
    librarian: '馆员',
    parent: '家长'
  }
  return roles[user.value?.role] || ''
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.title {
  font-size: 20px;
  font-weight: 600;
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
  border-radius: 20px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
}

.username {
  font-size: 14px;
}

.role-badge {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border-right: none;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
