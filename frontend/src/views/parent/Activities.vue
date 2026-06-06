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
              <div><el-icon><Calendar /></el-icon> {{ activity.start_time }}</div>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const activities = ref([
  { id: 1, title: '周六海洋主题故事会', description: '通过绘本探索神秘的海洋世界', start_time: '2024-01-13 10:00', location: '活动室A', current_capacity: 18, max_capacity: 20, status: 'upcoming' },
  { id: 2, title: '周日手工绘本课', description: '动手制作自己的小绘本', start_time: '2024-01-14 14:00', location: '活动室B', current_capacity: 10, max_capacity: 15, status: 'upcoming' },
  { id: 3, title: '周三亲子阅读会', description: '家长和孩子一起读绘本', start_time: '2024-01-17 10:00', location: '阅读区', current_capacity: 16, max_capacity: 20, status: 'upcoming' }
])

const handleRegister = (activity) => {
  if (activity.current_capacity >= activity.max_capacity) {
    ElMessage.success('已加入候补列表，请等待名额释放')
  } else {
    ElMessage.success('报名成功！')
    activity.current_capacity += 1
  }
}
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
