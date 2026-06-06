<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filterRole" placeholder="角色筛选" clearable style="width: 150px">
          <el-option label="管理员" value="admin" />
          <el-option label="居民" value="resident" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索姓名/邮箱" style="width: 250px" clearable />
      </div>

      <el-table :data="filteredUsers" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'admin' ? '管理员' : '居民' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="认领地块" width="100">
          <template #default="{ row }">
            {{ row.plotIds?.length || 0 }} 块
          </template>
        </el-table-column>
        <el-table-column label="连续缺席" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.consecutiveAbsences >= 3" type="danger" size="small">
              {{ row.consecutiveAbsences }} 次
            </el-tag>
            <span v-else>{{ row.consecutiveAbsences || 0 }} 次</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewUserDetail(row)">
              详情
            </el-button>
            <el-button 
              v-if="row.role !== 'admin'" 
              type="warning" 
              size="small" 
              @click="toggleAdminRole(row)"
            >
              设为管理员
            </el-button>
            <el-button 
              v-if="row.consecutiveAbsences > 0" 
              type="danger" 
              size="small" 
              @click="resetAbsences(row)"
            >
              重置缺席
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDetail" title="用户详情" width="600px">
      <div v-if="selectedUser">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedUser.name }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ selectedUser.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ selectedUser.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="selectedUser.role === 'admin' ? 'danger' : 'primary'">
              {{ selectedUser.role === 'admin' ? '管理员' : '居民' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="连续缺席">
            <el-tag v-if="selectedUser.consecutiveAbsences >= 3" type="danger">
              {{ selectedUser.consecutiveAbsences || 0 }} 次
            </el-tag>
            <span v-else>{{ selectedUser.consecutiveAbsences || 0 }} 次</span>
          </el-descriptions-item>
          <el-descriptions-item label="上次检查">
            {{ selectedUser.lastAbsenceCheckDate ? formatDate(selectedUser.lastAbsenceCheckDate) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(selectedUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="认领地块" :span="2">
            <el-tag v-for="plotId in selectedUser.plotIds" :key="plotId" style="margin-right: 4px">
              {{ getPlotNumber(plotId) }}
            </el-tag>
            <span v-if="!selectedUser.plotIds?.length">暂无</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>操作记录</el-divider>
        <div class="user-stats">
          <el-statistic title="轮值总数" :value="userStats.rotationCount" />
          <el-statistic title="完成率" :value="userStats.completionRate" suffix="%" />
          <el-statistic title="收获记录" :value="userStats.harvestCount" />
          <el-statistic title="照片上传" :value="userStats.photoCount" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { userService, plotService, rotationService, harvestService, photoLogService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const users = ref([])
const plots = ref([])
const filterRole = ref('')
const searchKeyword = ref('')
const showDetail = ref(false)
const selectedUser = ref(null)
const userStats = ref({
  rotationCount: 0,
  completionRate: 0,
  harvestCount: 0,
  photoCount: 0
})

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    if (filterRole.value && user.role !== filterRole.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      return user.name?.toLowerCase().includes(keyword) || 
             user.email?.toLowerCase().includes(keyword)
    }
    return true
  })
})

onMounted(async () => {
  await loadUsers()
  await loadPlots()
})

async function loadUsers() {
  users.value = await userService.getAll({ orderBy: ['name', 'asc'] })
}

async function loadPlots() {
  plots.value = await plotService.getAll()
}

function getPlotNumber(plotId) {
  const plot = plots.value.find(p => p.id === plotId)
  return plot?.plotNumber || plotId
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD HH:mm')
}

async function viewUserDetail(user) {
  selectedUser.value = user
  
  const [rotations, harvests, photos] = await Promise.all([
    rotationService.getRotationsByAssignee(user.id),
    harvestService.getHarvestsByUser(user.id),
    photoLogService.getPhotosByUser(user.id)
  ])
  
  const completed = rotations.filter(r => r.status === 'completed').length
  const total = rotations.filter(r => r.status !== 'pending').length
  
  userStats.value = {
    rotationCount: rotations.length,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    harvestCount: harvests.length,
    photoCount: photos.length
  }
  
  showDetail.value = true
}

async function toggleAdminRole(user) {
  ElMessageBox.confirm(`确定要将 ${user.name} 设为管理员吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await userService.updateRole(user.id, 'admin')
      ElMessage.success('设置成功')
      await loadUsers()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

async function resetAbsences(user) {
  ElMessageBox.confirm(`确定要重置 ${user.name} 的连续缺席记录吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await userService.resetConsecutiveAbsences(user.id)
      ElMessage.success('已重置')
      await loadUsers()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.users-page {
  padding: 0;
}
.user-stats {
  display: flex;
  gap: 40px;
  justify-content: space-around;
}
</style>
