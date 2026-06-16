<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <h2 v-show="!isCollapse">🏸 羽毛球馆</h2>
        <h2 v-show="isCollapse">🏸</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="item in menuList" :key="item.path">
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
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-if="isCollapse" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle !== '首页'">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="todoCount" class="badge-item" v-if="todoCount > 0">
            <el-button type="primary" link @click="goToTodo">
              <el-icon><Bell /></el-icon>
              <span style="margin-left: 4px;">待办</span>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.username || '用户' }}</span>
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
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  HomeFilled,
  DataBoard,
  OfficeBuilding,
  Tools,
  CircleCheck,
  Repair,
  User,
  Reading,
  List,
  DataLine,
  Document,
  Calendar,
  Tickets,
  UserFilled,
  Fold,
  Expand,
  ArrowDown,
  Bell
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)
const todoCount = ref(0)

const adminMenus = [
  { path: '/home', title: '工作台', icon: DataBoard },
  { path: '/court', title: '场地管理', icon: OfficeBuilding },
  { path: '/equipment', title: '设备管理', icon: Tools },
  { path: '/inspection', title: '巡检管理', icon: CircleCheck },
  { path: '/repair', title: '维修管理', icon: Repair },
  { path: '/coach', title: '教练管理', icon: User },
  { path: '/course', title: '课程管理', icon: Reading },
  { path: '/course-schedule', title: '课程排班', icon: Calendar },
  { path: '/todo', title: '待办事项', icon: List },
  { path: '/report/court-usage', title: '场地利用', icon: DataLine },
  { path: '/report/inventory', title: '库存报表', icon: Document },
  { path: '/log/api-log', title: '系统日志', icon: Document }
]

const userMenus = [
  { path: '/home', title: '首页', icon: HomeFilled },
  { path: '/court-booking', title: '场地预约', icon: Calendar },
  { path: '/my-bookings', title: '我的预约', icon: Tickets },
  { path: '/course-center', title: '课程中心', icon: Reading },
  { path: '/my-courses', title: '我的课程', icon: List }
]

const menuList = computed(() => {
  return userStore.isAdmin ? adminMenus : userMenus
})

const activeMenu = computed(() => {
  const path = route.path
  const item = menuList.value.find(m => path.startsWith(m.path) || m.path === path)
  return item?.path || '/home'
})

const currentTitle = computed(() => {
  const path = route.path
  const item = menuList.value.find(m => path.startsWith(m.path) || m.path === path)
  return item?.title || '首页'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      userStore.logout()
      ElMessage.success('退出成功')
      router.push('/login')
    } catch (e) {
      if (e !== 'cancel') {
        console.error('Logout error:', e)
      }
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}

const goToTodo = () => {
  router.push('/todo')
}

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchUserInfo().catch(() => {})
  }
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b2f3a;
}

.logo h2 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

:deep(.el-menu) {
  border-right: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

.collapse-btn:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.badge-item {
  margin-right: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
