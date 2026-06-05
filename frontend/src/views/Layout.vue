<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28" color="#fff"><OfficeBuilding /></el-icon>
        <span>物业报修系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#b9bdc5"
        active-text-color="#fff"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" class="message-badge" @click="goToMessages">
            <el-icon size="20" style="cursor: pointer;"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background: #409eff;">
                {{ userInfo?.realName?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userInfo?.realName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  角色：{{ roleText }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
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
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUnreadCount } from '@/api/message'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const unreadCount = ref(0)

const allMenuItems = [
  { path: '/dashboard', title: '首页概览', icon: 'HomeFilled', roles: ['ADMIN', 'PROPERTY', 'MAINTENANCE', 'INSPECTOR', 'OWNER'] },
  { path: '/orders', title: '工单管理', icon: 'Document', roles: ['ADMIN', 'PROPERTY', 'MAINTENANCE', 'OWNER'] },
  { path: '/orders/create', title: '提交报修', icon: 'Edit', roles: ['OWNER', 'PROPERTY', 'ADMIN'] },
  { path: '/inspection', title: '巡检管理', icon: 'Location', roles: ['ADMIN', 'PROPERTY', 'INSPECTOR'] },
  { path: '/expenses', title: '费用管理', icon: 'Money', roles: ['ADMIN', 'PROPERTY', 'OWNER'] },
  { path: '/satisfaction', title: '回访评价', icon: 'Star', roles: ['ADMIN', 'PROPERTY', 'OWNER'] },
  { path: '/messages', title: '消息中心', icon: 'Bell', roles: ['ADMIN', 'PROPERTY', 'MAINTENANCE', 'INSPECTOR', 'OWNER'] }
]

const menuItems = computed(() => {
  const role = userInfo.value?.role
  return allMenuItems.filter(item => item.roles.includes(role))
})

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const item = allMenuItems.find(m => m.path === route.path)
  return item?.title || '首页'
})

const roleText = computed(() => {
  const roleMap = {
    ADMIN: '物业主管',
    PROPERTY: '物业人员',
    MAINTENANCE: '维修人员',
    INSPECTOR: '巡检人员',
    OWNER: '业主'
  }
  return roleMap[userInfo.value?.role] || userInfo.value?.role
})

function goToMessages() {
  router.push('/messages')
}

async function loadUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data.count
  } catch (e) {
    console.error(e)
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('退出成功')
      router.push('/login')
    }).catch(() => {})
  }
}

onMounted(() => {
  loadUnreadCount()
  setInterval(loadUnreadCount, 30000)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #001529;
  overflow: hidden;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-menu) {
  border-right: none;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.message-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: #606266;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
