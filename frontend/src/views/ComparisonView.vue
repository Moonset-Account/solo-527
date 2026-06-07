<template>
  <div class="comparison-view">
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">选择队员:</span>
        <el-select
          v-model="selectedAthletes"
          multiple
          placeholder="最多选择4名队员"
          style="width: 400px"
          :multiple-limit="4"
          @change="loadComparison"
        >
          <el-option v-for="a in athletes" :key="a.id" :label="`${a.name} (${a.sport})`" :value="a.id" />
        </el-select>
      </div>
      <div class="filter-item">
        <span class="filter-label">指标:</span>
        <el-select v-model="metric" style="width: 140px" @change="loadComparison">
          <el-option label="训练负荷" value="load" />
          <el-option label="训练强度" value="intensity" />
          <el-option label="完成率" value="completionRate" />
        </el-select>
      </div>
      <div class="filter-item" style="margin-left: auto">
        <el-button type="primary" @click="syncToLoadChart" size="small">
          同步到负荷曲线
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" v-if="selectedAthletes.length > 0">
      <el-col :span="16">
        <ComparisonChart
          :data="comparisonData"
          :metric="metric"
          :loading="loading"
        />
      </el-col>
      <el-col :span="8">
        <div class="chart-container">
          <div class="chart-title">
            <el-icon><DataLine /></el-icon>
            <span>统计摘要</span>
          </div>
          <el-table :data="summaryTable" size="small">
            <el-table-column prop="athleteName" label="队员" width="90" />
            <el-table-column prop="total" label="总量" align="right" />
            <el-table-column prop="average" label="均值" align="right" />
            <el-table-column label="排名" width="70" align="center">
              <template #default="{ $index }">
                <el-tag v-if="$index === 0" type="danger" size="small">1</el-tag>
                <el-tag v-else-if="$index === 1" type="warning" size="small">2</el-tag>
                <el-tag v-else type="info" size="small">{{ $index + 1 }}</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 16px">
            <el-alert type="info" :closable="false" size="small">
              <template #title>
                各图表筛选状态独立，切换仪表盘不会影响对比视图
              </template>
            </el-alert>
          </div>
        </div>
      </el-col>
    </el-col>

    <el-empty v-else description="请选择队员进行对比" style="margin-top: 80px" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
import ComparisonChart from '@/components/charts/ComparisonChart.vue'
import { athleteApi, trainingApi } from '@/api'
import { ElMessage } from 'element-plus'

const athletes = ref([])
const selectedAthletes = ref([])
const metric = ref('load')
const loading = ref(false)
const comparisonData = ref([])

const summaryTable = computed(() => {
  return [...comparisonData.value].sort((a, b) => b.total - a.total)
})

const loadComparison = async () => {
  if (selectedAthletes.value.length === 0) {
    comparisonData.value = []
    return
  }

  loading.value = true
  try {
    const res = await trainingApi.getComparison({
      athleteIds: selectedAthletes.value,
      metric: metric.value
    })
    comparisonData.value = res.data
  } finally {
    loading.value = false
  }
}

const syncToLoadChart = () => {
  ElMessage.success('已同步筛选条件（各图表状态独立管理）')
}

onMounted(async () => {
  const res = await athleteApi.getList()
  athletes.value = res.data
})
</script>

<style scoped>
.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}
</style>
