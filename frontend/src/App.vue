<template>
  <div id="app" class="app-layout">
    <el-header v-if="isLoggedIn" class="app-header">
      <div class="header-left">
        <el-icon :size="28" color="#fff"><TrendCharts /></el-icon>
        <h1 class="app-title">运动训练负荷可视化系统</h1>
      </div>
      <div class="header-right">
        <el-tag :type="userRole === 'coach' ? 'warning' : 'info'" size="small">
          {{ userRole === 'coach' ? '教练端' : '队员端' }}
        </el-tag>
        <span class="user-name">{{ currentUser?.name || currentUser?.athleteName }}</span>
        <el-button type="primary" link @click="logout" style="color: #fff">
          退出
        </el-button>
      </div>
    </el-header>
    <el-aside v-if="isLoggedIn" width="200px" class="app-aside">
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/athlete">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item index="/comparison" v-if="userRole === 'coach'">
          <el-icon><Rank /></el-icon>
          <span>训练对比</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TrendCharts, DataAnalysis, User, Rank } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const currentUser = ref(null)

const isLoggedIn = computed(() => !!currentUser.value)
const userRole = computed(() => currentUser.value?.role || 'athlete')
const activeMenu = computed(() => route.path)

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
})

const logout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  currentUser.value = null
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: white;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 14px;
}

.app-aside {
  background: #001529;
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f0f2f5;
}

:deep(.el-aside) {
  background: #001529;
}
</style>
