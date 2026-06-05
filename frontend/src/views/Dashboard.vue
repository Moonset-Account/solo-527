<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card people-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.people?.total || 0 }}</div>
              <div class="stat-label">人员总数</div>
              <div class="stat-sub">
                活跃: {{ stats.people?.active || 0 }} | 黑名单: {{ stats.people?.blacklisted || 0 }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pass-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.passes?.total || 0 }}</div>
              <div class="stat-label">通行证总数</div>
              <div class="stat-sub">
                有效: {{ stats.passes?.active || 0 }} | 待审: {{ stats.passes?.pending || 0 }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card violation-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.violations?.total || 0 }}</div>
              <div class="stat-label">违规记录</div>
              <div class="stat-sub">
                本月: {{ stats.violations?.this_month || 0 }} | 待处理: {{ stats.violations?.pending || 0 }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card gate-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><SwitchButton /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.gate_logs?.total || 0 }}</div>
              <div class="stat-label">今日通行</div>
              <div class="stat-sub">
                进场: {{ stats.gate_logs?.in_count || 0 }} | 出场: {{ stats.gate_logs?.out_count || 0 }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>最近动态</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="formatTime(activity.time)"
              :type="getActivityType(activity.type)"
            >
              <div class="activity-item">
                <span class="activity-title">{{ activity.title }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" style="width: 100%; margin-bottom: 10px" @click="$router.push('/pass-apply')">
              <el-icon><EditPen /></el-icon>
              访客申请
            </el-button>
            <el-button type="success" size="large" style="width: 100%; margin-bottom: 10px" @click="$router.push('/gate')">
              <el-icon><SwitchButton /></el-icon>
              门岗放行
            </el-button>
            <el-button type="warning" size="large" style="width: 100%; margin-bottom: 10px" @click="$router.push('/approvals')">
              <el-icon><Check /></el-icon>
              待我审批
              <el-badge :value="stats.approvals?.pending || 0" class="ml-2" />
            </el-button>
            <el-button type="info" size="large" style="width: 100%" @click="$router.push('/violations')">
              <el-icon><Warning /></el-icon>
              违规上报
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { dashboardApi } from '@/api'

const stats = ref({})
const activities = ref([])

const fetchStats = async () => {
  try {
    stats.value = await dashboardApi.stats()
  } catch (e) {}
}

const fetchActivities = async () => {
  try {
    activities.value = await dashboardApi.recentActivities()
  } catch (e) {}
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getActivityType = (type) => {
  const map = {
    pass: 'primary',
    violation: 'danger',
    gate: 'success'
  }
  return map[type] || 'info'
}

onMounted(() => {
  fetchStats()
  fetchActivities()
})
</script>

<style scoped>
.stat-card {
  border: none;
  border-radius: 8px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.people-card .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pass-card .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.violation-card .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.gate-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 4px 0;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
}

.activity-item {
  font-size: 14px;
}

.activity-title {
  color: #303133;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

.ml-2 {
  margin-left: 8px;
}
</style>
