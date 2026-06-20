<template>
  <el-container class="main-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon :size="32" color="#409eff"><Calendar /></el-icon>
        <span v-if="!isCollapse" class="logo-text">面试管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'interviewer', 'hr'])" index="/interviews">
          <el-icon><Calendar /></el-icon>
          <template #title>面试管理</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'interviewer'])" index="/assessments">
          <el-icon><Star /></el-icon>
          <template #title>测评管理</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'interviewer'])" index="/question-bank">
          <el-icon><Reading /></el-icon>
          <template #title>测评题库</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'hr'])" index="/schedules">
          <el-icon><Clock /></el-icon>
          <template #title>讲师档期</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'interviewer', 'hr'])" index="/check-in">
          <el-icon><Finished /></el-icon>
          <template #title>签到记录</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'interviewer', 'hr'])" index="/hire-results">
          <el-icon><Medal /></el-icon>
          <template #title>录用结果</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'hr'])" index="/exports">
          <el-icon><Download /></el-icon>
          <template #title>数据导出</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin', 'hr'])" index="/reminders">
          <el-icon><Bell /></el-icon>
          <template #title>提醒配置</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin'])" index="/operation-logs">
          <el-icon><Document /></el-icon>
          <template #title>操作日志</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasRole(['admin'])" index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" /><Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleReminderCommand">
            <el-badge :value="reminderStore.blockingCount" class="reminder-badge" type="danger">
              <el-icon :size="20"><BellFilled /></el-icon>
            </el-badge>
            <template #dropdown>
              <el-dropdown-menu>
              <el-dropdown-item divided>
                <div class="reminder-dropdown-header">
                  <span>阻断告警</span>
                  <el-tag type="danger" size="small">{{ reminderStore.blockingCount }} 条</el-tag>
                </div>
              </el-dropdown-item>
              <el-dropdown-item v-for="item in reminderStore.blockingReminders.slice(0, 5)" :key="item._id" :command="'markRead:' + item._id">
                <div class="reminder-item blocking">
                  <div class="reminder-title">{{ item.title }}</div>
                  <div class="reminder-content">{{ item.content }}</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided command="viewAll">
                <el-icon><View /></el-icon> 查看全部
              </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="user-name">{{ userStore.user?.name }}</span>
              <el-tag :type="userRoleTagType" size="small">{{ userRoleLabel }}</el-tag>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                <div class="user-dropdown-info">
                  <p><strong>{{ userStore.user?.name }}</strong></p>
                  <p class="user-email">{{ userStore.user?.email }}</p>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  HomeFilled, Calendar, Star, Reading, Clock, Finished, Medal,
  Download, Bell, Document, User, Fold, Expand, BellFilled, View,
  UserFilled, SwitchButton
} from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';
import { useReminderStore } from '../stores/reminder';
import { RoleLabel } from '../types';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const reminderStore = useReminderStore();

const isCollapse = ref(false);

const activeMenu = computed(() => route.path);
const currentPageTitle = computed(() => route.meta.title as string || '');

const userRoleLabel = computed(() => {
  if (userStore.user) return RoleLabel[userStore.user.role as keyof typeof RoleLabel] || '';
  return '';
});

const userRoleTagType = computed(() => {
  switch (userStore.user?.role) {
    case 'admin': return 'danger';
    case 'interviewer': return 'primary';
    case 'hr': return 'success';
    default: return 'info';
  }
});

async function handleReminderCommand(command: string) {
  if (command === 'viewAll') {
    router.push('/reminders');
  } else if (command.startsWith('markRead:')) {
    const id = command.split(':')[1];
    await reminderStore.markAsRead(id);
  }
}

async function handleUserCommand(command: string) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      await userStore.logout();
      ElMessage.success('已退出登录');
      router.push('/login');
    }).catch(() => {});
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    reminderStore.fetchReminders();
    if (userStore.isAdmin || userStore.isHR) {
      reminderStore.fetchBlockingReminders();
    }
  }
});
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.sidebar {
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #1f2d3d;
}

.logo-text {
  color: white;
}

.header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  font-size: 20px;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.reminder-badge {
  margin-right: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.reminder-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 280px;
}

.reminder-item {
  padding: 8px 0;
}

.reminder-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.reminder-content {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.reminder-item.blocking .reminder-title {
  color: #f56c6c;
}

.user-dropdown-info p {
  margin: 0;
  font-size: 14px;
}

.user-email {
  color: #909399;
  font-size: 12px !important;
  margin-top: 4px !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
