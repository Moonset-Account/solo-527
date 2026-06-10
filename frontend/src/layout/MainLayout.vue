<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo-wrap">
        <div class="logo">
          <el-icon :size="24" color="#fff"><FirstAidKit /></el-icon>
          <span v-if="!isCollapse" class="logo-text">青禾预约候补台</span>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#0f2433"
        text-color="#a3b1c3"
        active-text-color="#ffffff"
        class="sidebar-menu"
      >
        <template v-for="item in menuList" :key="item.path">
          <el-menu-item :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
          <div v-if="item.group" class="menu-group" v-show="!isCollapse">
            {{ item.group }}
          </div>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="top-header">
        <div class="header-left">
          <el-icon class="toggle-btn" :size="20" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(c, i) in breadcrumbTrail" :key="i">{{ c }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="pendingExceptions" :hidden="pendingExceptions === 0" class="exception-badge">
            <el-button :icon="BellFilled" circle @click="router.push('/exceptions')" />
          </el-badge>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" style="background: #2ab99f">
                {{ userStore.userInfo?.real_name?.[0] || 'U' }}
              </el-avatar>
              <span class="user-name">{{ userStore.userInfo?.real_name || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
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
            <keep-alive :include="keepAliveList">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Fold, Expand, BellFilled, ArrowDown, FirstAidKit,
  DataAnalysis, Calendar, Plus, Warning, Clock,
  UserFilled, User, Avatar, Tools, TrendCharts
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getExceptionPendingCount } from '@/api/exception'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const pendingExceptions = ref(0)

const menuList = [
  { path: '/dashboard', title: '运营工作台', icon: DataAnalysis },
  { path: '/bookings', title: '预约管理', icon: Calendar },
  { path: '/bookings/create', title: '新建预约', icon: Plus, group: '列表入口' },
  { path: '/no-show', title: '爽约名单', icon: Warning },
  { path: '/available-slots', title: '可约时段', icon: Clock },
  { path: '/staff-schedule', title: '技师排班', icon: UserFilled, group: '系统管理' },
  { path: '/exceptions', title: '异常待办池', icon: BellFilled },
  { path: '/customers', title: '客户管理', icon: User },
  { path: '/staff', title: '人员管理', icon: Avatar },
  { path: '/services', title: '服务配置', icon: Tools },
  { path: '/conversion', title: '预约转化分析', icon: TrendCharts },
]

const keepAliveList = ['Dashboard', 'Bookings']

const activeMenu = computed(() => {
  if (route.path.startsWith('/bookings/') && route.params.id) {
    return '/bookings'
  }
  return route.path
})

const breadcrumbTrail = computed(() => {
  const matched = route.matched.filter(r => r.meta.title && r.path !== '/')
  return matched.map(r => r.meta.title as string)
})

const loadPendingExceptions = async () => {
  try {
    const res = await getExceptionPendingCount()
    pendingExceptions.value = res.data?.total || 0
  } catch (_) {
    // ignore
  }
}

const handleCommand = async (cmd: string) => {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确认要退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  } else if (cmd === 'profile') {
    ElMessage.info('个人中心建设中')
  }
}

onMounted(() => {
  loadPendingExceptions()
  userStore.loadUserInfo()
})

watch(() => route.path, () => {
  loadPendingExceptions()
})
</script>

<style scoped>
.main-layout {
  height: 100%;
}

.sidebar {
  background: #0f2433;
  transition: width 0.2s;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.logo-wrap {
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.logo-text {
  letter-spacing: 1px;
}

.sidebar-menu {
  border: none;
  flex: 1;
}
:deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: 6px;
  height: 44px;
  line-height: 44px;
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #2ab99f 0%, #53d2bb 100%) !important;
  color: #fff !important;
}
:deep(.el-menu-item:hover) {
  background: rgba(42, 185, 159, 0.15) !important;
}

.menu-group {
  padding: 18px 20px 8px;
  font-size: 11px;
  color: #4d6278;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.top-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px !important;
  height: 56px !important;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.toggle-btn {
  cursor: pointer;
  color: #606266;
}
.toggle-btn:hover { color: #2ab99f; }

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.exception-badge :deep(.el-button) {
  background: #f5f7fa;
  border: none;
}
.exception-badge :deep(.el-button:hover) {
  background: #ecf5ff;
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f5f7fa;
}
.user-name {
  font-size: 14px;
  color: #606266;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  padding: 0 !important;
  background: #f0f2f5;
  overflow: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
