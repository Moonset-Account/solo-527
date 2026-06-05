<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="220px" class="sidebar">
        <div class="logo">
          <h2>书店管理</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/admin/books">
            <el-icon><Reading /></el-icon>
            <span>图书管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/inventory">
            <el-icon><Goods /></el-icon>
            <span>库存管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/members">
            <el-icon><User /></el-icon>
            <span>会员管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/reservations">
            <el-icon><Tickets /></el-icon>
            <span>预留管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/events">
            <el-icon><Calendar /></el-icon>
            <span>活动管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/sales">
            <el-icon><TrendCharts /></el-icon>
            <span>销售分析</span>
          </el-menu-item>
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/admin/suppliers">供应商管理</el-menu-item>
            <el-menu-item index="/admin/users">用户管理</el-menu-item>
            <el-menu-item index="/admin/validation">数据校验</el-menu-item>
            <el-menu-item index="/admin/export">数据导出</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-badge :value="alertCount" class="alert-badge">
              <el-icon :size="20" style="cursor: pointer;" @click="showAlerts = true">
                <Bell />
              </el-icon>
            </el-badge>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" icon="User" />
                <span class="username">{{ user?.first_name || user?.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="password">修改密码</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>

    <el-drawer v-model="showAlerts" title="系统提醒" size="360px">
      <div class="alert-list">
        <div class="alert-item danger" v-if="alerts.expired_reservations_count > 0">
          <el-icon><Warning /></el-icon>
          <div class="alert-content">
            <div class="alert-title">过期预留单</div>
            <div class="alert-desc">有 {{ alerts.expired_reservations_count }} 个预留单已过期，请及时处理</div>
          </div>
        </div>
        <div class="alert-item warning" v-if="alerts.low_stock_count > 0">
          <el-icon><InfoFilled /></el-icon>
          <div class="alert-content">
            <div class="alert-title">库存预警</div>
            <div class="alert-desc">有 {{ alerts.low_stock_count }} 本图书库存不足</div>
          </div>
        </div>
        <div class="alert-item info" v-for="event in alerts.upcoming_events" :key="event.id">
          <el-icon><Calendar /></el-icon>
          <div class="alert-content">
            <div class="alert-title">{{ event.title }}</div>
            <div class="alert-desc">即将开始，剩余名额: {{ event.available_slots }}</div>
          </div>
        </div>
        <el-empty v-if="alertCount === 0" description="暂无提醒" />
      </div>
    </el-drawer>

    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.old" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.new" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirm" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis, Reading, Goods, User, Tickets, Calendar,
  TrendCharts, Setting, Bell, Warning, InfoFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '')
const showAlerts = ref(false)
const showPasswordDialog = ref(false)
const alerts = ref({ low_stock_count: 0, expired_reservations_count: 0, upcoming_events: [] })
const alertCount = computed(() => {
  return alerts.value.low_stock_count + alerts.value.expired_reservations_count + (alerts.value.upcoming_events?.length || 0)
})

const passwordForm = ref({
  old: '',
  new: '',
  confirm: ''
})

const loadAlerts = async () => {
  try {
    const { data } = await api.get('/sales/dashboard/alerts/')
    alerts.value = data
  } catch (e) {}
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中')
      break
    case 'password':
      showPasswordDialog.value = true
      break
    case 'logout':
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

const changePassword = async () => {
  if (!passwordForm.value.old || !passwordForm.value.new || !passwordForm.value.confirm) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  
  try {
    await userStore.changePassword(passwordForm.value.old, passwordForm.value.new)
    ElMessage.success('密码修改成功')
    showPasswordDialog.value = false
    passwordForm.value = { old: '', new: '', confirm: '' }
  } catch (e) {
    ElMessage.error('密码修改失败')
  }
}

onMounted(() => {
  loadAlerts()
  setInterval(loadAlerts, 60000)
})
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
  
  .sidebar {
    background: #001529;
    overflow-y: auto;
    
    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      h2 {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
    }
    
    .el-menu {
      border-right: none;
    }
  }
  
  .header {
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .alert-badge {
        margin-right: 10px;
      }
      
      .user-info {
        display: flex;
        align-items: center;
        cursor: pointer;
        
        .username {
          margin-left: 8px;
          font-size: 14px;
          color: #333;
        }
      }
    }
  }
  
  .main-content {
    background: #f0f2f5;
    overflow-y: auto;
    padding: 20px;
  }
}

.alert-list {
  .alert-item {
    display: flex;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 8px;
    background: #f5f7fa;
    
    &.danger {
      background: rgba(255, 77, 79, 0.1);
      .el-icon { color: #ff4d4f; }
    }
    &.warning {
      background: rgba(250, 173, 20, 0.1);
      .el-icon { color: #faad14; }
    }
    &.info {
      background: rgba(24, 144, 255, 0.1);
      .el-icon { color: #1890ff; }
    }
    
    .el-icon {
      font-size: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .alert-content {
      .alert-title {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .alert-desc {
        font-size: 13px;
        color: #666;
      }
    }
  }
}
</style>
