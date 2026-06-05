<template>
  <el-container class="layout-container">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#409EFF"><Tickets /></el-icon>
        <span>通行证管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/pass-apply">
          <el-icon><EditPen /></el-icon>
          <span>访客申请</span>
        </el-menu-item>
        <el-menu-item index="/passes">
          <el-icon><Tickets /></el-icon>
          <span>通行证管理</span>
        </el-menu-item>
        <el-menu-item index="/approvals">
          <el-icon><Check /></el-icon>
          <span>审批管理</span>
          <el-badge :value="pendingCount" class="approval-badge" :hidden="pendingCount === 0" />
        </el-menu-item>
        <el-menu-item index="/gate">
          <el-icon><SwitchButton /></el-icon>
          <span>门岗放行</span>
        </el-menu-item>
        <el-menu-item index="/gate-logs">
          <el-icon><List /></el-icon>
          <span>门岗记录</span>
        </el-menu-item>
        <el-menu-item index="/people">
          <el-icon><User /></el-icon>
          <span>人员管理</span>
        </el-menu-item>
        <el-menu-item index="/credentials">
          <el-icon><Document /></el-icon>
          <span>证件管理</span>
        </el-menu-item>
        <el-menu-item index="/vehicles">
          <el-icon><Van /></el-icon>
          <span>车辆管理</span>
        </el-menu-item>
        <el-menu-item index="/work-zones">
          <el-icon><Connection /></el-icon>
          <span>作业区域</span>
        </el-menu-item>
        <el-menu-item index="/violations">
          <el-icon><Warning /></el-icon>
          <span>违规管理</span>
        </el-menu-item>
        <el-menu-item index="/import-export">
          <el-icon><Download /></el-icon>
          <span>导入导出</span>
        </el-menu-item>
        <el-menu-item index="/notifications">
          <el-icon><Bell /></el-icon>
          <span>通知中心</span>
          <el-badge :value="unreadCount" class="notification-badge" :hidden="unreadCount === 0" />
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userName }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { notificationsApi, approvalsApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const unreadCount = ref(0)
const pendingCount = ref(0)
let timer = null

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
const userName = computed(() => userStore.userName)

const fetchUnreadCount = async () => {
  try {
    const res = await notificationsApi.unreadCount()
    unreadCount.value = res.count
  } catch (e) {}
}

const fetchPendingCount = async () => {
  try {
    const res = await approvalsApi.pendingForMe({ per_page: 1 })
    pendingCount.value = res.meta?.total_count || 0
  } catch (e) {}
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (e) {}
  }
}

onMounted(() => {
  fetchUnreadCount()
  fetchPendingCount()
  timer = setInterval(() => {
    fetchUnreadCount()
    fetchPendingCount()
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.el-menu {
  border-right: none;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.main-content {
  background: #f5f7fa;
  overflow-y: auto;
}

.approval-badge,
.notification-badge {
  margin-left: 8px;
}
</style>
