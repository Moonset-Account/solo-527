<template>
  <el-container class="main-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon v-if="collapsed"><Box /></el-icon>
        <span v-else class="logo-text">试剂库存管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="collapsed"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <template v-for="group in menuGroups" :key="group.title">
          <el-sub-menu v-if="group.children && group.children.length > 1 && !collapsed" :index="group.key">
            <template #title>
              <el-icon><component :is="group.icon" /></el-icon>
              <span>{{ group.title }}</span>
            </template>
            <el-menu-item
              v-for="item in group.children"
              :key="item.path"
              :index="item.path"
              v-show="canAccess(item.roles)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <template v-else>
            <el-menu-item
              v-for="item in group.children"
              :key="item.path"
              :index="item.path"
              v-show="canAccess(item.roles)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">{{ item.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0" class="mr-4">
            <el-button :icon="Bell" circle @click="$router.push('/portal/notifications')" />
          </el-badge>
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #409eff">
                {{ userStore.user?.realName?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.user?.realName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/portal/profile')">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { UserRole } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const collapsed = ref(false)

const menuGroups = computed(() => [
  {
    key: 'portal',
    title: '门户',
    icon: 'House',
    children: [
      { path: '/portal/dashboard', title: '首页概览', icon: 'House' },
      { path: '/portal/applications', title: '我的申请', icon: 'Document' },
      { path: '/portal/reagents', title: '试剂查询', icon: 'Search' },
      { path: '/portal/instruments', title: '仪器预约', icon: 'Cpu' },
      { path: '/portal/notifications', title: '我的消息', icon: 'Bell' },
      { path: '/portal/profile', title: '个人中心', icon: 'User' },
    ],
  },
  {
    key: 'admin',
    title: '管理台',
    icon: 'Setting',
    children: [
      {
        path: '/admin/approvals',
        title: '审核预约',
        icon: 'Check',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
      {
        path: '/admin/reagents',
        title: '试剂管理',
        icon: 'Box',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
      {
        path: '/admin/samples',
        title: '样本管理',
        icon: 'Collection',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER],
      },
      {
        path: '/admin/users',
        title: '用户权限',
        icon: 'UserFilled',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        path: '/admin/audit',
        title: '审计追踪 / 复盘',
        icon: 'Tickets',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
      {
        path: '/admin/relations',
        title: '关联管理',
        icon: 'Link',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
    ],
  },
  {
    key: 'config',
    title: '配置中心',
    icon: 'Tools',
    children: [
      {
        path: '/config/dictionaries',
        title: '字典配置',
        icon: 'Grid',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
      {
        path: '/config/notifications',
        title: '提醒配置',
        icon: 'Setting',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
      {
        path: '/config/documents',
        title: '原始单据',
        icon: 'Files',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
      },
    ],
  },
  {
    key: 'maintenance',
    title: '运维',
    icon: 'Monitor',
    children: [
      {
        path: '/maintenance-board',
        title: '维保及时看板',
        icon: 'Monitor',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER],
      },
    ],
  },
])

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const crumbs: Array<{ path: string; title: string }> = []
  for (const group of menuGroups.value) {
    for (const item of group.children) {
      if (route.path.startsWith(item.path.split('/').slice(0, 3).join('/'))) {
        crumbs.push({ path: item.path, title: item.title })
        break
      }
    }
  }
  return crumbs.length > 0 ? crumbs : [{ path: route.path, title: route.meta.title as string }]
})

function canAccess(roles?: UserRole[]) {
  if (!roles) return true
  return userStore.roles.some((r) => roles.includes(r as UserRole))
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {}
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    notificationStore.fetchUnreadCount()
  }
})

watch(
  () => route.path,
  () => {
    if (userStore.isLoggedIn) {
      notificationStore.fetchUnreadCount()
    }
  }
)
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .logo-text {
      margin-left: 8px;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #606266;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
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
