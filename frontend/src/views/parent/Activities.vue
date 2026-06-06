<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">活动列表</h3>
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
              :disabled="activity.status !== 'upcoming'"
              @click="handleRegister(activity)"
            >
              {{ activity.current_capacity >= activity.max_capacity ? '候补报名' : '立即报名' }}
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getActivities, registerActivity } from '@/api/activities'

const activities = ref([])
const loading = ref(false)

const fetchActivities = async () => {
  loading.value = true
  try {
    const data = await getActivities({ status: 'upcoming' })
    activities.value = data.results || data
  } catch (error) {
    console.error('获取活动列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleRegister = async (activity) => {
  try {
    const result = await registerActivity(activity.id)
    ElMessage.success(result.message || '报名成功')
    fetchActivities()
  } catch (error) {
    console.error('报名失败:', error)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchActivities()
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
