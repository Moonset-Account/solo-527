<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="side-menu">
      <div class="logo">
        <el-icon :size="28" color="#4CAF50"><Collection /></el-icon>
        <span class="logo-text">青禾选题协作台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#4CAF50"
      >
        <template v-for="item in menuList" :key="item.path">
          <el-menu-item v-if="!item.meta?.hidden" :index="item.path">
            <el-icon v-if="item.meta?.icon"><component :is="item.meta.icon" /></el-icon>
            <template #title>{{ item.meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                {{ userStore.userInfo?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.nickname }}</span>
              <el-tag v-if="roleLabel" size="small" :type="roleTagType" style="margin-left:8px;">
                {{ roleLabel }}
              </el-tag>
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
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const roleMap = { 1: '创作者', 2: '审核员', 3: '运营', 4: '负责人' }
const roleTagMap = { 1: 'success', 2: 'warning', 3: 'primary', 4: 'danger' }
const roleLabel = computed(() => roleMap[userStore.userInfo?.role])
const roleTagType = computed(() => roleTagMap[userStore.userInfo?.role] || 'info')

const routes = router.options.routes
const menuList = computed(() => {
  const layoutRoute = routes.find(r => r.path === '/')
  return layoutRoute?.children?.filter(c => !c.meta?.hidden) || []
})

const activeMenu = computed(() => route.path)

async function handleCommand(cmd) {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (e) {}
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.side-menu {
  background-color: #304156;
  overflow: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    background-color: #2b3648;
    color: #fff;

    .logo-text {
      margin-left: 10px;
      font-size: 16px;
      font-weight: 600;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  .breadcrumb {
    font-size: 14px;
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .username {
        margin: 0 8px;
        font-size: 14px;
      }
    }
  }
}

.main-content {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
