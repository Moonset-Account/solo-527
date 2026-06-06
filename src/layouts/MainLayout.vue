<template>
  <el-container class="main-layout">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <h2>社区菜园</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/plots">
          <el-icon><Grid /></el-icon>
          <span>地块地图</span>
        </el-menu-item>
        <el-menu-item index="/claims">
          <el-icon><Document /></el-icon>
          <span>认领申请</span>
        </el-menu-item>
        <el-menu-item index="/crops">
          <el-icon><Grape /></el-icon>
          <span>作物管理</span>
        </el-menu-item>
        <el-menu-item index="/rotation">
          <el-icon><Calendar /></el-icon>
          <span>轮值表</span>
        </el-menu-item>
        <el-menu-item index="/tools">
          <el-icon><Tools /></el-icon>
          <span>公共工具</span>
        </el-menu-item>
        <el-menu-item index="/announcements">
          <el-icon><Bell /></el-icon>
          <span>公共公告</span>
        </el-menu-item>
        <el-menu-item index="/harvest">
          <el-icon><ShoppingBasket /></el-icon>
          <span>收获记录</span>
        </el-menu-item>
        <el-menu-item index="/photo-log">
          <el-icon><Picture /></el-icon>
          <span>照片日志</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button circle :icon="Bell" @click="showNotifications = true" />
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userData?.avatar">
                {{ userData?.name?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userData?.name }}</span>
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
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    
    <el-drawer v-model="showNotifications" title="通知中心" size="400px">
      <div v-if="notifications.length === 0" class="empty-notifications">
        <el-empty description="暂无通知" />
      </div>
      <div v-else class="notification-list">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="notification-item"
          :class="{ unread: !notif.read }"
          @click="markAsRead(notif.id)"
        >
          <div class="notification-header">
            <el-tag :type="getNotificationType(notif.type)" size="small">
              {{ getNotificationTypeText(notif.type) }}
            </el-tag>
            <span class="notification-time">{{ formatDate(notif.createdAt) }}</span>
          </div>
          <div class="notification-title">{{ notif.title }}</div>
          <div class="notification-content">{{ notif.content }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="markAllAsRead" :disabled="unreadCount === 0">
          全部标为已读
        </el-button>
      </template>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { notificationService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  DataLine, Grid, Document, Grape, Calendar, Tools, Bell,
  ShoppingBasket, Picture, User, ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

const isAdmin = computed(() => authStore.isAdmin)
const userData = computed(() => authStore.userData)

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '首页')

onMounted(async () => {
  await loadNotifications()
})

async function loadNotifications() {
  if (authStore.userId) {
    notifications.value = await notificationService.getNotificationsByUser(authStore.userId)
    unreadCount.value = await notificationService.getUnreadCount(authStore.userId)
  }
}

async function markAsRead(id) {
  await notificationService.markAsRead(id)
  await loadNotifications()
}

async function markAllAsRead() {
  await notificationService.markAllAsRead(authStore.userId)
  await loadNotifications()
  ElMessage.success('已全部标为已读')
}

function getNotificationType(type) {
  const typeMap = {
    warning: 'warning',
    error: 'danger',
    info: 'info',
    reminder: 'primary'
  }
  return typeMap[type] || 'info'
}

function getNotificationTypeText(type) {
  const typeMap = {
    warning: '警告',
    error: '错误',
    info: '通知',
    reminder: '提醒'
  }
  return typeMap[type] || '通知'
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('MM-DD HH:mm')
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await authStore.logout()
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
.sidebar {
  background: #001529;
  color: #fff;
}
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #002140;
}
.logo h2 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}
:deep(.el-menu) {
  border-right: none;
}
.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: #303133;
}
.main-content {
  padding: 20px;
  background: #f5f7fa;
}
.notification-list {
  max-height: 600px;
  overflow-y: auto;
}
.notification-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.notification-item.unread {
  background: #f0f9ff;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.notification-time {
  font-size: 12px;
  color: #909399;
}
.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.notification-content {
  font-size: 13px;
  color: #606266;
}
.empty-notifications {
  padding: 40px 0;
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
