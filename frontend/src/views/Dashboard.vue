<template>
  <div class="dashboard">
    <FilterBar v-model="globalFilters" @change="handleGlobalFilterChange">
      <template #actions>
        <el-button type="primary" size="small" @click="handleExport">
          <el-icon><Download /></el-icon> 导出数据
        </el-button>
      </template>
    </FilterBar>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <div class="stat-value">{{ stats.totalLoad }}</div>
          <div class="stat-label">总训练负荷 (AU)</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-value">{{ stats.avgIntensity }}%</div>
          <div class="stat-label">平均训练强度</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-value">{{ stats.avgCompletion }}%</div>
          <div class="stat-label">平均完成率</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
          <div class="stat-value">{{ stats.avgRecovery }}</div>
          <div class="stat-label">平均恢复评分</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="12">
        <LoadCurveChart
          :data="loadData"
          :anomalies="loadAnomalies"
          :metric="globalFilters.metric"
          :loading="loading.load"
          @anomaly-click="handleAnomalyClick"
          @point-click="handleLoadPointClick"
        />
      </el-col>
      <el-col :span="12">
        <RadarChart
          v-if="radarData.length > 0"
          :data="radarData"
          :team-avg="teamAvg"
          :athlete-name="selectedAthlete?.name"
          :loading="loading.radar"
        />
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="12">
        <RecoveryTrendChart
          :data="recoveryData"
          :anomalies="recoveryAnomalies"
          :loading="loading.recovery"
          @point-click="handleRecoveryPointClick"
        />
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">
            <el-icon><Warning /></el-icon>
            <span>伤病记录 ({{ userRole === 'coach' ? '教练可见' : '仅公开信息' }})</span>
          </div>
          <el-table :data="injuryList" size="small" height="280" v-loading="loading.injuries">
            <el-table-column prop="date" label="日期" width="100" />
            <el-table-column prop="athleteName" label="队员" width="80" v-if="userRole === 'coach'" />
            <el-table-column prop="bodyPart" label="部位" width="80" />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="severity" label="严重程度" width="90">
              <template #default="{ row }">
                <el-tag :type="row.severity === '重度' ? 'danger' : row.severity === '中度' ? 'warning' : 'info'" size="small">
                  {{ row.severity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" />
            <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />
            <el-table-column prop="internalNotes" label="内部备注" min-width="120" show-overflow-tooltip v-if="userRole === 'coach'" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="detailVisible" title="训练详情" width="700px">
      <div v-if="currentDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="队员">{{ currentDetail.training?.athleteName }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentDetail.training?.date }}</el-descriptions-item>
          <el-descriptions-item label="动作">{{ currentDetail.training?.exercise }}</el-descriptions-item>
          <el-descriptions-item label="项目">{{ currentDetail.training?.sport }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 16px 0 8px">计划 vs 实际对比</h4>
        <el-table :data="comparisonRows" size="small">
          <el-table-column prop="item" label="项目" />
          <el-table-column prop="planned" label="计划" align="right" />
          <el-table-column prop="actual" label="实际" align="right" />
          <el-table-column prop="diff" label="差异" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.diff > 0 ? '#67c23a' : row.diff < 0 ? '#f56c6c' : '#909399' }">
                {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="currentDetail.planComparison?.adjusted" style="margin-top: 12px">
          <el-tag type="warning">
            计划已调整: 原强度 {{ currentDetail.planComparison.intensity.original }}%
            → 调整后 {{ currentDetail.planComparison.intensity.planned }}%
          </el-tag>
          <span style="margin-left: 8px; font-size: 12px; color: #909399">
            原因: {{ currentDetail.planComparison.adjustmentReason }}
          </span>
        </div>

        <h4 v-if="currentDetail.heartRate?.length" style="margin: 16px 0 8px">心率数据</h4>
        <div ref="hrChartRef" style="height: 150px"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { ElMessage } from 'element-plus'
import { Download, Warning } from '@element-plus/icons-vue'
import FilterBar from '@/components/FilterBar.vue'
import LoadCurveChart from '@/components/charts/LoadCurveChart.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import RecoveryTrendChart from '@/components/charts/RecoveryTrendChart.vue'
import { trainingApi, recoveryApi, injuryApi, exportApi, athleteApi } from '@/api'

const router = useRouter()

const userRole = computed(() => {
  const u = JSON.parse(localStorage.getItem('user') || '{}')
  return u.role || 'athlete'
})

const selectedAthlete = ref(null)
const globalFilters = ref({
  athleteId: null,
  sport: null,
  exercise: null,
  metric: 'load',
  startDate: null,
  endDate: null
})

const loading = reactive({
  load: false,
  radar: false,
  recovery: false,
  injuries: false
})

const loadData = ref([])
const loadAnomalies = ref([])
const radarData = ref([])
const teamAvg = ref([])
const recoveryData = ref([])
const recoveryAnomalies = ref([])
const injuryList = ref([])

const stats = reactive({
  totalLoad: 0,
  avgIntensity: 0,
  avgCompletion: 0,
  avgRecovery: 0
})

const detailVisible = ref(false)
const currentDetail = ref(null)
const comparisonRows = ref([])
const hrChartRef = ref(null)

const handleGlobalFilterChange = async (filters) => {
  if (filters.athleteId) {
    const athletes = await athleteApi.getList()
    selectedAthlete.value = athletes.data.find(a => a.id === filters.athleteId)
  } else {
    selectedAthlete.value = null
  }
  loadAllData()
}

const loadAllData = async () => {
  await Promise.all([
    loadLoadCurve(),
    loadRadar(),
    loadRecovery(),
    loadInjuries()
  ])
}

const loadLoadCurve = async () => {
  loading.load = true
  try {
    const res = await trainingApi.getLoadCurve(globalFilters.value)
    loadData.value = res.data.data
    loadAnomalies.value = res.data.anomalies
    if (res.data.summary) {
      stats.totalLoad = res.data.summary.totalLoad
      stats.avgIntensity = res.data.summary.avgIntensity
      stats.avgCompletion = res.data.summary.avgCompletion
    }
  } finally {
    loading.load = false
  }
}

const loadRadar = async () => {
  if (!globalFilters.value.athleteId) {
    radarData.value = []
    return
  }
  loading.radar = true
  try {
    const res = await trainingApi.getRadar({ athleteId: globalFilters.value.athleteId })
    radarData.value = res.data.radarData
    teamAvg.value = res.data.teamAvg
  } finally {
    loading.radar = false
  }
}

const loadRecovery = async () => {
  loading.recovery = true
  try {
    const res = await recoveryApi.getTrend({
      athleteId: globalFilters.value.athleteId,
      startDate: globalFilters.value.startDate,
      endDate: globalFilters.value.endDate
    })
    recoveryData.value = res.data.data
    recoveryAnomalies.value = res.data.anomalies
    if (res.data.summary) {
      stats.avgRecovery = res.data.summary.avgOverall
    }
  } finally {
    loading.recovery = false
  }
}

const loadInjuries = async () => {
  loading.injuries = true
  try {
    const res = await injuryApi.getList({
      athleteId: globalFilters.value.athleteId,
      role: userRole.value
    })
    injuryList.value = res.data
  } finally {
    loading.injuries = false
  }
}

const handleAnomalyClick = (d) => {
  ElMessage.warning(`检测到异常数据点: ${d.key}, 负荷: ${d.load}`)
}

const handleLoadPointClick = async (d) => {
  const pointTrainings = await trainingApi.getPlans({
    athleteId: globalFilters.value.athleteId,
    date: d.key
  })
  if (pointTrainings.data.length > 0) {
    const first = pointTrainings.data[0]
    if (first.actual) {
      await openTrainingDetail(first.actual.id)
    }
  }
}

const handleRecoveryPointClick = (d) => {
  ElMessage.info(`${d.date} 恢复评分: ${d.overallScore}`)
}

const openTrainingDetail = async (id) => {
  const res = await trainingApi.getDetail(id)
  currentDetail.value = res.data

  const pc = res.data.planComparison
  if (pc) {
    comparisonRows.value = [
      { item: '组数', planned: pc.sets.planned, actual: pc.sets.actual, diff: pc.sets.diff },
      { item: '次数', planned: pc.reps.planned, actual: pc.reps.actual, diff: pc.reps.diff },
      { item: '强度(%)', planned: pc.intensity.planned, actual: pc.intensity.actual, diff: pc.intensity.actual - pc.intensity.planned }
    ]
  }

  detailVisible.value = true

  await nextTick()
  renderHRChart(res.data.heartRate)
}

const renderHRChart = (data) => {
  if (!hrChartRef.value || !data.length) return
  const container = hrChartRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = 150
  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)

  const x = d3.scalePoint().domain(data.map(d => d.timestamp.split('T')[1])).range([40, width - 20])
  const y = d3.scaleLinear().domain([60, 200]).range([height - 30, 10])

  const line = d3.line().x((d, i) => x(d.timestamp.split('T')[1])).y(d => y(d.heartRate))
  svg.append('path').datum(data).attr('fill', 'none').attr('stroke', '#f56c6c').attr('d', line)

  svg.append('g').attr('transform', 'translate(0,120)').call(d3.axisBottom(x).ticks(5))
  svg.append('g').attr('transform', 'translate(40,0)').call(d3.axisLeft(y).ticks(4))
}

const handleExport = async () => {
  try {
    const res = await exportApi.downloadTraining({
      athleteId: globalFilters.value.athleteId,
      startDate: globalFilters.value.startDate,
      endDate: globalFilters.value.endDate
    })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `training-export-${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'coach') {
    globalFilters.value.athleteId = user.id
    const athletes = await athleteApi.getList()
    selectedAthlete.value = athletes.data.find(a => a.id === user.id)
  }
  loadAllData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 16px;
}

.charts-row {
  margin-bottom: 16px;
}

:deep(.stat-card) {
  color: white;
  border-radius: 8px;
  padding: 20px;
}

:deep(.stat-value) {
  font-size: 28px;
  font-weight: 700;
}

:deep(.stat-label) {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
}
</style>
