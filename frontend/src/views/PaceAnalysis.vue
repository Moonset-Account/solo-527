<template>
  <div class="page-container">
    <div class="page-header">
      <h3>配速分析</h3>
    </div>

    <el-alert
      title="配速分析功能说明"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      教练可以对跑友的打卡数据进行配速分析，评估训练效果并给出改进建议。
    </el-alert>

    <el-card>
      <el-table :data="checkins" v-loading="loading">
        <el-table-column label="跑友" prop="runner_id" width="120">
          <template #default="{ row }">
            <el-tag size="small">跑友 #{{ row.runner_id }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="距离" prop="distance_km" width="100" />
        <el-table-column label="配速" prop="avg_pace" width="100" />
        <el-table-column label="心率" prop="avg_heart_rate" width="100" />
        <el-table-column label="RPE" prop="perceived_effort" width="80" />
        <el-table-column label="时间" prop="checkin_date" />
        <el-table-column label="分析状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.pace_analysis" type="success" size="small">已分析</el-tag>
            <el-tag v-else type="info" size="small">待分析</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              v-if="userStore.isCoach"
              size="small"
              type="primary"
              link
              @click="analyzePace(row)"
            >
              分析
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showResultDialog" title="配速分析结果" width="550px">
      <template v-if="analysisResult">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="平均配速">
            <strong>{{ analysisResult.avg_pace }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="训练强度">
            <el-tag :type="getIntensityType(analysisResult.training_intensity)">
              {{ analysisResult.training_intensity }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="配速区间覆盖">
            <div v-for="(value, key) in analysisResult.pace_zones_coverage" :key="key" class="zone-item">
              <span>{{ key }}:</span>
              <el-progress :percentage="value" :stroke-width="8" style="width: 200px" />
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="改进建议">
            <ul class="suggestions">
              <li v-for="(s, i) in analysisResult.improvement_suggestions" :key="i">
                {{ s }}
              </li>
            </ul>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const checkins = ref([])
const loading = ref(false)
const showResultDialog = ref(false)
const analysisResult = ref(null)

const loadCheckins = async () => {
  loading.value = true
  try {
    const data = await request.get('/checkins/')
    checkins.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const analyzePace = async (row) => {
  try {
    const data = await request.post(`/pace-analysis/${row.id}`)
    analysisResult.value = data
    showResultDialog.value = true
    loadCheckins()
  } catch (error) {
    ElMessage.error('分析失败，请稍后重试')
  }
}

const getIntensityType = (intensity) => {
  const map = {
    '低强度': 'success',
    '中等': 'warning',
    '高强度': 'danger'
  }
  return map[intensity] || 'info'
}

onMounted(() => {
  loadCheckins()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header h3 {
  margin: 0 0 20px;
  color: #303133;
}

.zone-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.zone-item span {
  width: 80px;
  font-size: 13px;
}

.suggestions {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
  color: #606266;
}
</style>
