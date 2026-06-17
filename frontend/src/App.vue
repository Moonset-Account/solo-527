<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon :size="28" color="#409EFF"><ChatDotRound /></el-icon>
        <h1 class="title">销售邮件AI辅助工作台</h1>
      </div>
      <div class="header-right">
        <el-badge :value="pendingReviewCount" :hidden="pendingReviewCount === 0" class="review-badge">
          <el-button type="primary" link @click="$router.push('/review')">
            <el-icon><Bell /></el-icon>
            人工复核
          </el-button>
        </el-badge>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :style="{ backgroundColor: '#409EFF' }">
              {{ currentUser.realName ? currentUser.realName.charAt(0) : 'U' }}
            </el-avatar>
            <span class="username">{{ currentUser.realName || '用户' }}</span>
            <el-tag size="small" :type="roleTagType">{{ roleLabel }}</el-tag>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="switch">切换用户</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="app-aside">
        <el-menu
          :default-active="$route.path"
          class="aside-menu"
          router
          background-color="#001529"
          text-color="#b7c0cc"
          active-text-color="#ffffff">
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/draft">
            <el-icon><Edit /></el-icon>
            <span>邮件草稿</span>
          </el-menu-item>
          <el-menu-item index="/review">
            <el-icon><CircleCheck /></el-icon>
            <span>审核面板</span>
            <el-badge v-if="pendingReviewCount > 0" :value="pendingReviewCount" class="menu-badge" />
          </el-menu-item>
          <el-menu-item index="/trace">
            <el-icon><Search /></el-icon>
            <span>事后追踪</span>
          </el-menu-item>
          <el-menu-item index="/forbidden">
            <el-icon><Warning /></el-icon>
            <span>禁用词管理</span>
          </el-menu-item>
          <el-menu-item index="/prompt">
            <el-icon><MagicStick /></el-icon>
            <span>提示词版本</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    <el-dialog
      v-model="showUserDialog"
      title="切换用户"
      width="400px">
      <el-form label-width="80px">
        <el-form-item label="选择用户">
          <el-select v-model="selectedUserId" style="width: 100%" @change="switchUser">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="`${user.realName} (${user.role === 'ADMIN' ? '管理员' : user.role === 'SUPERVISOR' ? '主管' : '销售'} - ${user.department})`"
              :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { reviewApi, userApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const currentUser = computed(() => userStore.currentUser)
const userList = ref([])
const showUserDialog = ref(false)
const selectedUserId = ref(null)
const pendingReviewCount = ref(0)

const roleLabel = computed(() => {
  const map = { ADMIN: '管理员', SUPERVISOR: '主管', AGENT: '销售' }
  return map[currentUser.value.role] || '用户'
})

const roleTagType = computed(() => {
  const map = { ADMIN: 'danger', SUPERVISOR: 'warning', AGENT: 'success' }
  return map[currentUser.value.role] || 'info'
})

onMounted(async () => {
  if (!currentUser.value.id) {
    userStore.setUser({
      id: 4,
      username: 'agent01',
      realName: '王销售',
      role: 'AGENT',
      department: '销售一组'
    })
  }
  loadUserList()
  loadPendingCount()
})

async function loadUserList() {
  try {
    const res = await userApi.getAllUsers()
    if (res.success) {
      userList.value = res.data
    }
  } catch (e) {}
}

async function loadPendingCount() {
  try {
    const res = await reviewApi.getPendingCount(currentUser.value.role === 'SUPERVISOR' ? currentUser.value.id : null)
    if (res.success) {
      pendingReviewCount.value = res.data.count || 0
    }
  } catch (e) {}
}

function handleCommand(command) {
  if (command === 'switch') {
    showUserDialog.value = true
  } else if (command === 'profile') {
    ElMessage.info('个人信息功能')
  }
}

function switchUser() {
  const user = userList.value.find(u => u.id === selectedUserId.value)
  if (user) {
    userStore.setUser(user)
    showUserDialog.value = false
    loadPendingCount()
    ElMessage.success(`已切换到用户：${user.realName}`)
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
}
.app-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 24px;
    .review-badge {
      margin-right: 8px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      .username {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}
.app-aside {
  background: #001529;
  .aside-menu {
    border-right: none;
    height: calc(100vh - 60px);
    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      &.is-active {
        background: #409EFF !important;
      }
    }
    .menu-badge {
      margin-left: 8px;
    }
  }
}
.app-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
