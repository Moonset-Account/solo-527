<template>
  <el-container class="layout-container">
    <el-header v-if="isLoggedIn" class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon :size="28" color="#409eff"><Reading /></el-icon>
          <span class="title">绘本馆借阅与活动平台</span>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              <el-icon><User /></el-icon>
              {{ userInfo?.family_name || '用户' }}
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
      </div>
    </el-header>
    <el-container>
      <el-aside v-if="isLoggedIn" width="220px" class="aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <template v-if="userRole === 'librarian'">
            <el-menu-item index="/librarian/dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>工作台</span>
            </el-menu-item>
            <el-menu-item index="/librarian/books">
              <el-icon><Notebook /></el-icon>
              <span>绘本管理</span>
            </el-menu-item>
            <el-menu-item index="/librarian/borrows">
              <el-icon><Tickets /></el-icon>
              <span>借阅管理</span>
            </el-menu-item>
            <el-menu-item index="/librarian/repairs">
              <el-icon><Tools /></el-icon>
              <span>修复管理</span>
            </el-menu-item>
            <el-menu-item index="/librarian/activities">
              <el-icon><Calendar /></el-icon>
              <span>活动管理</span>
            </el-menu-item>
            <el-menu-item index="/librarian/deposits">
              <el-icon><Wallet /></el-icon>
              <span>押金管理</span>
            </el-menu-item>
            <el-menu-item index="/librarian/members">
              <el-icon><UserFilled /></el-icon>
              <span>会员管理</span>
            </el-menu-item>
          </template>
          <template v-else>
            <el-menu-item index="/parent/dashboard">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/parent/borrows">
              <el-icon><Notebook /></el-icon>
              <span>我的借阅</span>
            </el-menu-item>
            <el-menu-item index="/parent/activities">
              <el-icon><Calendar /></el-icon>
              <span>活动报名</span>
            </el-menu-item>
            <el-menu-item index="/parent/deposits">
              <el-icon><Wallet /></el-icon>
              <span>押金账户</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isLoggedIn = ref(true)
const userInfo = ref(null)
const userRole = ref('librarian')

const activeMenu = computed(() => route.path)

onMounted(() => {
  const mockUser = {
    family_name: '李馆员',
    role: 'librarian'
  }
  userInfo.value = mockUser
  userRole.value = mockUser.role
})

const handleCommand = (command) => {
  if (command === 'logout') {
    isLoggedIn.value = false
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0;
  height: 60px;
  line-height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}

.aside {
  background: #304156;
  overflow-x: hidden;
}

.sidebar-menu {
  border: none;
  height: calc(100vh - 60px);
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
