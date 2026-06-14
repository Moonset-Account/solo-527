<template>
  <el-container class="main-layout">
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#67c23a"><Aim /></el-icon>
        <span>青禾收入结算台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#b0c4de"
        active-text-color="#67c23a"
        class="menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/partnerships">
          <el-icon><Handshake /></el-icon>
          <span>品牌合作</span>
        </el-menu-item>
        <el-menu-item index="/benefits">
          <el-icon><Present /></el-icon>
          <span>赞助权益</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/subscriptions">
          <el-icon><Vip /></el-icon>
          <span>会员订阅</span>
        </el-menu-item>
        <el-menu-item index="/refunds">
          <el-icon><Warning /></el-icon>
          <span>退款异常池</span>
        </el-menu-item>
        <el-menu-item index="/configs">
          <el-icon><Setting /></el-icon>
          <span>系统配置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="warningCount" :hidden="warningCount === 0" class="mr-8">
            <el-button link type="primary" @click="goToWarnings">
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatarUrl">
                {{ userStore.userInfo?.username?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.username }}</span>
              <span class="role-tag">{{ getRoleLabel(userStore.userInfo?.role || '') }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="subscribe" divided>
                  <el-icon><Vip /></el-icon> 会员订阅
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDictStore } from '@/stores/dict'
import { getRoleLabel } from '@/utils'
import { dashboardApi } from '@/api/modules'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const dictStore = useDictStore()

const activeMenu = computed(() => route.path)
const warningCount = ref(0)

const handleCommand = (cmd: string) => {
  if (cmd === 'logout') {
    userStore.logout()
  } else if (cmd === 'subscribe') {
    window.open('/subscribe', '_blank')
  }
}

const goToWarnings = () => {
  router.push('/dashboard')
}

onMounted(async () => {
  if (!dictStore.loaded) {
    await dictStore.loadAll()
  }
  if (!userStore.userInfo && userStore.token) {
    await userStore.fetchUserInfo()
  }
  try {
    const warnings: any = await dashboardApi.warnings({ status: 'pending' })
    warningCount.value = warnings.data?.length || 0
  } catch {}
})
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100%;
}

.sidebar {
  background-color: #001529;
  display: flex;
  flex-direction: column;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    gap: 10px;
    border-bottom: 1px solid #1f3a5f;
  }

  .menu {
    flex: 1;
    border-right: none;
    border-radius: 0;
  }
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 0 8px;

      .username {
        font-size: 14px;
        color: #303133;
      }

      .role-tag {
        font-size: 12px;
        padding: 2px 8px;
        background-color: #ecf5ff;
        color: #409eff;
        border-radius: 4px;
      }
    }
  }
}

.main-content {
  padding: 0;
  background-color: #f5f7fa;
  overflow-y: auto;
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
