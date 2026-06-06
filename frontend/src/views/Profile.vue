<template>
  <div class="page-container">
    <div class="page-header">
      <h3>个人中心</h3>
    </div>

    <el-card v-if="userStore.user" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80" style="background-color: #409eff">
          {{ userStore.user.full_name ? userStore.user.full_name.charAt(0) : 'U' }}
        </el-avatar>
        <div class="profile-info">
          <h3>{{ userStore.user.full_name }}</h3>
          <p>
            <el-tag :type="getRoleType(userStore.user.role)" size="small">
              {{ getRoleText(userStore.user.role) }}
            </el-tag>
            <span style="margin-left: 10px; color: #909399">
              {{ userStore.user.email }}
            </span>
          </p>
        </div>
      </div>

      <el-divider />

      <el-descriptions :column="2" border label-width="100px">
        <el-descriptions-item label="用户名">
          {{ userStore.user.username }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ getRoleText(userStore.user.role) }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ userStore.user.email }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ userStore.user.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="跑步年限">
          {{ userStore.user.running_experience_years ? userStore.user.running_experience_years + ' 年' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="userStore.user.is_active ? 'success' : 'info'" size="small">
            {{ userStore.user.is_active ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDate(userStore.user.created_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="profile-footer">
        <el-button type="danger" @click="logout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const getRoleText = (role) => {
  const map = { admin: '管理员', coach: '教练', runner: '跑友' }
  return map[role] || role
}

const getRoleType = (role) => {
  const map = { admin: 'danger', coach: 'primary', runner: 'success' }
  return map[role] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.page-container {
  max-width: 700px;
  margin: 0 auto;
}

.page-header h3 {
  margin: 0 0 20px;
  color: #303133;
}

.profile-card {
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-info h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #303133;
}

.profile-info p {
  margin: 0;
  display: flex;
  align-items: center;
}

.profile-footer {
  margin-top: 30px;
  text-align: center;
}
</style>
