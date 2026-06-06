<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">我的报名</h3>
      <el-table :data="myRegistrations" size="small">
        <el-table-column prop="activity_title" label="活动名称" />
        <el-table-column label="活动时间" width="160">
          <template #default="{ row }">{{ formatDate(row.activity_start_time) }}</template>
        </el-table-column>
        <el-table-column label="报名状态" width="140">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'confirmed' ? 'success' : (row.status === 'waitlist' ? 'warning' : 'info')" 
              size="small"
            >
              <template v-if="row.status === 'confirmed'">已确认</template>
              <template v-else-if="row.status === 'waitlist'">候补 #{{ row.waitlist_position }}</template>
              <template v-else>{{ row.status }}</template>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'confirmed' || row.status === 'waitlist'" 
              type="text" 
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!myRegistrations.length" description="暂无活动报名" :image-size="80" />
    </div>

    <div class="card">
      <h3 class="card-title">可报名活动</h3>
      <el-row :gutter="20">
        <el-col :span="8" v-for="activity in activities" :key="activity.id">
          <div class="activity-card">
            <h4>{{ activity.title }}</h4>
            <p class="desc">{{ activity.description }}</p>
            <div class="meta">
              <div><el-icon><Calendar /></el-icon> {{ formatDate(activity.start_time) }}</div>
              <div><el-icon><Location /></el-icon> {{ activity.location }}</div>
            </div>
            <div class="capacity">
              <el-progress :percentage="Math.round(activity.current_capacity / activity.max_capacity * 100)" :stroke-width="6" />
              <span>{{ activity.current_capacity }}/{{ activity.max_capacity }}人</span>
            </div>
            <el-button 
              type="primary" 
              class="register-btn"
              :disabled="activity.status !== 'upcoming' || isRegistered(activity.id)"
              @click="handleRegister(activity)"
            >
              <template v-if="isRegistered(activity.id)">已报名</template>
              <template v-else-if="activity.current_capacity >= activity.max_capacity">候补报名</template>
              <template v-else>立即报名</template>
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getActivities, registerActivity, getMyRegistrations, cancelRegistration } from '@/api/activities'

const activities = ref([])
const myRegistrations = ref([])
const loading = ref(false)

const registeredActivityIds = computed(() => {
  return myRegistrations.value
    .filter(r => r.status !== 'cancelled')
    .map(r => r.activity)
})

const isRegistered = (activityId) => {
  return registeredActivityIds.value.includes(activityId)
}

const fetchAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchActivities(),
      fetchMyRegistrations()
    ])
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchActivities = async () => {
  try {
    const data = await getActivities({ status: 'upcoming' })
    activities.value = data.results || data
  } catch (error) {
    console.error('获取活动列表失败:', error)
  }
}

const fetchMyRegistrations = async () => {
  try {
    const data = await getMyRegistrations()
    myRegistrations.value = data.results || data
  } catch (error) {
    console.error('获取我的报名失败:', error)
  }
}

const handleRegister = async (activity) => {
  try {
    const result = await registerActivity(activity.id)
    ElMessage.success(result.message || '报名成功')
    fetchAllData()
  } catch (error) {
    console.error('报名失败:', error)
  }
}

const handleCancel = async (registration) => {
  try {
    await ElMessageBox.confirm('确定要取消报名吗？', '提示', {
      type: 'warning'
    })
    await cancelRegistration(registration.id)
    ElMessage.success('已取消报名')
    fetchAllData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消失败:', error)
    }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.activity-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.activity-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.activity-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.meta div {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.capacity {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.capacity span {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.register-btn {
  width: 100%;
}
</style>
