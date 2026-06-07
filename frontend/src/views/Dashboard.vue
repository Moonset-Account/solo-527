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
        <div class="chart-container" style="position: relative">
          <div class="chart-title">
            <el-icon><TrendCharts /></el-icon>
            <span>训练负荷曲线</span>
            <el-tag v-if="highlightedDate" type="warning" size="small" style="margin-left: 12px">
              联动选中: {{ highlightedDate }}
            </el-tag>
            <span class="title-extra" v-if="summary.load">(总负荷: {{ summary.load.totalLoad }} | 均强: {{ summary.load.avgIntensity }}%)</span>
          </div>
          <div class="chart-wrapper" ref="loadChartRef">
            <div class="loading-overlay" v-if="loading.load"><el-icon class="is-loading"><Loading /></el-icon></div>
          </div>
          <div v-if="loadAnomalies.length > 0" class="anomaly-tip">
            <el-tag type="danger" size="small">⚠️ 检测到 {{ loadAnomalies.length }} 个异常数据点，点击红色圆环可下钻</el-tag>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <RadarChart
          v-if="radarData.length > 0"
          :data="radarData"
          :team-avg="teamAvg"
          :athlete-name="selectedAthlete?.name"
          :loading="loading.radar"
        />
        <el-empty v-else description="请选择队员查看能力雷达" :image-size="80" />
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="12">
        <div class="chart-container" style="position: relative">
          <div class="chart-title">
            <el-icon><MoonNight /></el-icon>
            <span>恢复趋势</span>
            <el-tag v-if="highlightedDate" type="info" size="small" style="margin-left: 12px">
              已联动负荷曲线
            </el-tag>
            <span class="title-extra" v-if="summary.recovery">(均分: {{ summary.recovery.avgOverall }} | HRV: {{ summary.recovery.avgHRV }})</span>
          </div>
          <div class="chart-wrapper" ref="recoveryChartRef">
            <div class="loading-overlay" v-if="loading.recovery"><el-icon class="is-loading"><Loading /></el-icon></div>
          </div>
          <div class="linkage-tip">
            <el-tag type="info" size="small">💡 点击恢复数据点可联动定位对应日期的负荷数据</el-tag>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <div class="chart-title">
            <el-icon><Warning /></el-icon>
            <span>伤病记录 ({{ canViewInternal ? '教练可见内部备注' : '仅公开信息' }})</span>
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
            <el-table-column prop="internalNotes" label="内部备注" min-width="120" show-overflow-tooltip v-if="canViewInternal" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="dayDetailVisible" :title="`${selectedDayDate} 训练记录详情`" width="900px">
      <div v-if="selectedDayTrainings.length > 0">
        <el-alert v-if="selectedDayHasAdjusted" type="warning" :closable="false" style="margin-bottom: 16px">
          <template #title>
            当日存在计划调整，下表已标注原计划强度以便比较偏差
          </template>
        </el-alert>
        <el-table :data="selectedDayTrainings" size="small" border>
          <el-table-column prop="exercise" label="动作" width="120" fixed />
          <el-table-column label="计划强度" width="180">
            <template #default="{ row }">
              <template v-if="row.plan?.adjusted">
                <span style="text-decoration: line-through; color: #f56c6c">{{ row.plan.originalIntensity }}%</span>
                <el-icon style="vertical-align: middle"><ArrowRight /></el-icon>
                <span style="color: #e6a23c; font-weight: 600">{{ row.plan.adjustedIntensity }}%</span>
                <el-tag size="small" type="warning">已调整</el-tag>
              </template>
              <span v-else>{{ row.plan?.plannedIntensity }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="实际强度" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: getDeviationColor(row.deviation?.intensityDeviation) }">
                {{ row.training?.actualIntensity }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="强度偏差" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: getDeviationColor(row.deviation?.intensityDeviation) }">
                {{ row.deviation?.intensityDeviation > 0 ? '+' : '' }}{{ row.deviation?.intensityDeviation || 0 }}%
              </span>
              <div style="font-size: 10px; color: #909399">
                较原计划: {{ row.deviation?.originalIntensityDeviation > 0 ? '+' : '' }}{{ row.deviation?.originalIntensityDeviation || 0 }}%
              </div>
            </template>
          </el-table-column>
          <el-table-column label="组数 (计划/实际)" width="120" align="center">
            <template #default="{ row }">
              {{ row.plan?.plannedSets }} / {{ row.training?.actualSets }}
            </template>
          </el-table-column>
          <el-table-column label="次数 (计划/实际)" width="120" align="center">
            <template #default="{ row }">
              {{ row.plan?.plannedReps }} / {{ row.training?.actualReps }}
            </template>
          </el-table-column>
          <el-table-column label="负荷偏差" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: getDeviationColor(row.deviation?.loadDeviation) }">
                {{ row.deviation?.loadDeviation > 0 ? '+' : '' }}{{ row.deviation?.loadDeviation || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="goToDetail(row.training?.id)">
                原始记录
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="当日无训练记录" />
    </el-dialog>

    <el-dialog v-model="detailVisible" title="原始训练记录详情" width="800px">
      <div v-if="currentDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="队员">{{ currentDetail.training?.athleteName }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentDetail.training?.date }}</el-descriptions-item>
          <el-descriptions-item label="动作">{{ currentDetail.training?.exercise }}</el-descriptions-item>
          <el-descriptions-item label="项目">{{ currentDetail.training?.sport }}</el-descriptions-item>
          <el-descriptions-item label="计算负荷">{{ currentDetail.rawRecord?.calculatedLoad }} AU</el-descriptions-item>
          <el-descriptions-item label="完成率">
            <span :style="{ color: currentDetail.training?.completionRate >= 90 ? '#67c23a' : '#f56c6c' }">
              {{ currentDetail.training?.completionRate }}%
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 20px 0 12px; font-size: 15px; border-left: 3px solid #409eff; padding-left: 8px">
          训练计划 vs 实际完成 偏差分析
        </h4>

        <div v-if="currentDetail.deviationAnalysis" class="deviation-analysis">
          <el-row :gutter="12">
            <el-col :span="8" v-for="item in deviationItems" :key="item.key">
              <div class="deviation-card">
                <div class="dc-label">{{ item.label }}</div>
                <div class="dc-values">
                  <div class="dc-plan">
                    <span class="dcv-label">计划</span>
                    <span class="dcv-value">{{ item.planned }}</span>
                  </div>
                  <el-icon color="#909399" :size="16"><ArrowRight /></el-icon>
                  <div class="dc-actual">
                    <span class="dcv-label">实际</span>
                    <span class="dcv-value" :style="{ color: item.color }">{{ item.actual }}</span>
                  </div>
                </div>
                <div class="dc-deviation" :style="{ color: item.color }">
                  {{ item.deviationText }}
                </div>
                <div v-if="item.extraInfo" class="dc-extra">
                  {{ item.extraInfo }}
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <h4 v-if="currentDetail.heartRate?.length" style="margin: 20px 0 12px; font-size: 15px; border-left: 3px solid #409eff; padding-left: 8px">
          心率原始数据
        </h4>
        <div ref="hrChartRef" style="height: 180px; background: #fafafa; border-radius: 6px; padding: 10px"></div>

        <h4 style="margin: 20px 0 12px; font-size: 15px; border-left: 3px solid #409eff; padding-left: 8px">
          原始记录字段
        </h4>
        <el-table :data="rawRecordRows" size="small" border>
          <el-table-column prop="field" label="字段" width="180" />
          <el-table-column prop="value" label="值" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { ElMessage } from 'element-plus'
import {
  Download, Warning, TrendCharts, Loading, MoonNight, ArrowRight
} from '@element-plus/icons-vue'
import FilterBar from '@/components/FilterBar.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import { trainingApi, recoveryApi, injuryApi, exportApi, athleteApi } from '@/api'

const router = useRouter()

const currentUser = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
const userRole = computed(() => currentUser.value.role || 'athlete')
const canViewInternal = computed(() =>
  ['coach', 'rehab', 'head'].includes(userRole.value)
)

const selectedAthlete = ref(null)
const globalFilters = ref({
  athleteId: null,
  sport: null,
  exercise: null,
  metric: 'load',
  startDate: null,
  endDate: null
})

const highlightedDate = ref(null)

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

const summary = reactive({
  load: { totalLoad: 0, avgIntensity: 0 },
  recovery: { avgOverall: 0, avgHRV: 0 }
})

const loadChartRef = ref(null)
const recoveryChartRef = ref(null)
const hrChartRef = ref(null)

const detailVisible = ref(false)
const dayDetailVisible = ref(false)
const currentDetail = ref(null)
const selectedDayDate = ref('')
const selectedDayTrainings = ref([])
const selectedDayHasAdjusted = ref(false)
const deviationItems = ref([])
const rawRecordRows = ref([])

const metricColors = {
  load: '#409eff',
  intensity: '#67c23a',
  completionRate: '#e6a23c'
}

const getDeviationColor = (val) => {
  if (val > 0) return '#67c23a'
  if (val < 0) return '#f56c6c'
  return '#909399'
}

const handleGlobalFilterChange = async (filters) => {
  if (filters.athleteId) {
    const athletes = await athleteApi.getList()
    selectedAthlete.value = athletes.data.find(a => a.id === filters.athleteId)
  } else {
    selectedAthlete.value = null
  }
  highlightedDate.value = null
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
      summary.load = res.data.summary
    }
    await nextTick()
    renderLoadChart()
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
      summary.recovery = res.data.summary
    }
    await nextTick()
    renderRecoveryChart()
  } finally {
    loading.recovery = false
  }
}

const loadInjuries = async () => {
  loading.injuries = true
  try {
    const res = await injuryApi.getList({
      athleteId: globalFilters.value.athleteId
    })
    injuryList.value = res.data
  } finally {
    loading.injuries = false
  }
}

const renderLoadChart = () => {
  if (!loadChartRef.value || !loadData.value.length) return

  const container = loadChartRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 30, bottom: 50, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scalePoint()
    .domain(loadData.value.map(d => d.key))
    .range([0, innerWidth])
    .padding(0.3)

  const y = d3.scaleLinear()
    .domain([0, d3.max(loadData.value, d => d.load) * 1.15])
    .range([innerHeight, 0])
    .nice()

  const area = d3.area()
    .x(d => x(d.key))
    .y0(innerHeight)
    .y1(d => y(d.load))
    .curve(d3.curveMonotoneX)

  const line = d3.line()
    .x(d => x(d.key))
    .y(d => y(d.load))
    .curve(d3.curveMonotoneX)

  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'loadGradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')

  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#409eff').attr('stop-opacity', 0.4)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#409eff').attr('stop-opacity', 0.05)

  g.append('path').datum(loadData.value).attr('fill', 'url(#loadGradient)').attr('d', area)
  g.append('path').datum(loadData.value).attr('fill', 'none').attr('stroke', '#409eff').attr('stroke-width', 2.5).attr('d', line)

  const xAxis = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x))
  xAxis.selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end').style('font-size', '10px')
  g.append('g').call(d3.axisLeft(y).ticks(6))

  if (highlightedDate.value) {
    const hx = x(highlightedDate.value)
    if (hx !== undefined) {
      g.append('line')
        .attr('class', 'highlight-line')
        .attr('x1', hx).attr('x2', hx)
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', '#e6a23c').attr('stroke-width', 2).attr('stroke-dasharray', '4,4')
    }
  }

  const tooltip = d3.select(container).append('div').attr('class', 'tooltip').style('opacity', 0)

  g.selectAll('.data-point')
    .data(loadData.value)
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => x(d.key))
    .attr('cy', d => y(d.load))
    .attr('r', d => d.key === highlightedDate.value ? 7 : 4)
    .attr('fill', d => d.key === highlightedDate.value ? '#e6a23c' : '#409eff')
    .attr('cursor', 'pointer')
    .on('click', async (event, d) => {
      await openDayDetail(d.key)
    })
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 7)
      tooltip.transition().duration(200).style('opacity', .9)
      tooltip.html(`
        <div>日期: ${d.key}</div>
        <div>负荷: ${d.load} AU</div>
        <div>强度: ${d.intensity}%</div>
        <div>完成率: ${d.completionRate}%</div>
        <div style="color:#e6a23c;margin-top:4px">点击查看当日训练 →</div>
      `).style('left', (event.offsetX + 10) + 'px').style('top', (event.offsetY - 60) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('r', d.key === highlightedDate.value ? 7 : 4)
      tooltip.transition().duration(500).style('opacity', 0)
    })

  const anomalyKeys = new Set(loadAnomalies.value.map(a => a.key))
  g.selectAll('.anomaly-point')
    .data(loadData.value.filter(d => anomalyKeys.has(d.key)))
    .enter()
    .append('circle')
    .attr('class', 'anomaly-dot')
    .attr('cx', d => x(d.key))
    .attr('cy', d => y(d.load))
    .attr('r', 10)
    .attr('fill', 'none')
    .attr('stroke', '#f56c6c')
    .attr('stroke-width', 2.5)
    .attr('cursor', 'pointer')
    .on('click', async (event, d) => {
      ElMessage.warning(`检测到异常数据点: ${d.key}，负荷值偏离均值较大`)
      await openDayDetail(d.key)
    })
}

const renderRecoveryChart = () => {
  if (!recoveryChartRef.value || !recoveryData.value.length) return

  const container = recoveryChartRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 120, bottom: 50, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scalePoint()
    .domain(recoveryData.value.map(d => d.date))
    .range([0, innerWidth])
    .padding(0.3)

  const y = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])

  const metrics = [
    { key: 'overallScore', name: '综合', color: '#409eff', width: 2.5 },
    { key: 'sleepScore', name: '睡眠', color: '#67c23a', width: 1.5 },
    { key: 'fatigueScore', name: '疲劳', color: '#e6a23c', width: 1.5 },
    { key: 'sorenessScore', name: '酸痛', color: '#f56c6c', width: 1.5 }
  ]

  metrics.forEach(metric => {
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d[metric.key]))
      .curve(d3.curveMonotoneX)
    g.append('path').datum(recoveryData.value)
      .attr('fill', 'none').attr('stroke', metric.color)
      .attr('stroke-width', metric.width).attr('d', line)
  })

  if (highlightedDate.value) {
    const hx = x(highlightedDate.value)
    if (hx !== undefined) {
      g.append('line')
        .attr('x1', hx).attr('x2', hx)
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', '#409eff').attr('stroke-width', 2).attr('stroke-dasharray', '4,4')
    }
  }

  const xAxis = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x))
  xAxis.selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end').style('font-size', '10px')
  g.append('g').call(d3.axisLeft(y).ticks(5))

  const legend = svg.append('g').attr('transform', `translate(${innerWidth + 10}, 15)`)
  metrics.forEach((m, i) => {
    legend.append('line').attr('x1', 0).attr('x2', 20).attr('y1', i * 18 + 8).attr('y2', i * 18 + 8)
      .attr('stroke', m.color).attr('stroke-width', m.width)
    legend.append('text').attr('x', 28).attr('y', i * 18 + 12).style('font-size', '11px').style('fill', '#606266').text(m.name)
  })

  const tooltip = d3.select(container).append('div').attr('class', 'tooltip').style('opacity', 0)

  g.selectAll('.recovery-point')
    .data(recoveryData.value)
    .enter()
    .append('circle')
    .attr('class', 'recovery-point')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.overallScore))
    .attr('r', d => d.date === highlightedDate.value ? 7 : 4)
    .attr('fill', d => d.date === highlightedDate.value ? '#409eff' : '#409eff')
    .attr('fill-opacity', d => d.date === highlightedDate.value ? 1 : 0.8)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      highlightedDate.value = highlightedDate.value === d.date ? null : d.date
      ElMessage.info(highlightedDate.value
        ? `已选中 ${d.date}，已联动定位负荷曲线`
        : '已取消联动选中'
      )
      renderLoadChart()
      renderRecoveryChart()
    })
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 7)
      tooltip.transition().duration(200).style('opacity', .9)
      tooltip.html(`
        <div>日期: ${d.date}</div>
        <div>综合: ${d.overallScore}</div>
        <div>睡眠: ${d.sleepScore}</div>
        <div>疲劳: ${d.fatigueScore}</div>
        <div>HRV: ${d.hrv}</div>
        <div style="color:#409eff;margin-top:4px">点击联动负荷曲线 →</div>
      `).style('left', (event.offsetX + 10) + 'px').style('top', (event.offsetY - 80) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('r', d.date === highlightedDate.value ? 7 : 4)
      tooltip.transition().duration(500).style('opacity', 0)
    })

  const anomalyKeys = new Set(recoveryAnomalies.value.map(a => a.date))
  g.selectAll('.recovery-anomaly')
    .data(recoveryData.value.filter(d => anomalyKeys.has(d.date)))
    .enter()
    .append('circle')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.overallScore))
    .attr('r', 9)
    .attr('fill', 'none')
    .attr('stroke', '#f56c6c')
    .attr('stroke-width', 2)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      highlightedDate.value = d.date
      ElMessage.warning(`检测到恢复异常: ${d.date}，综合评分 ${d.overallScore}`)
      renderLoadChart()
      renderRecoveryChart()
    })
}

const openDayDetail = async (date) => {
  selectedDayDate.value = date
  try {
    const res = await trainingApi.getDayTrainings(date)
    const result = res.data
    selectedDayTrainings.value = result.data
    selectedDayHasAdjusted.value = result.hasAdjusted
    dayDetailVisible.value = true
  } catch (e) {
    ElMessage.error('获取当日训练记录失败')
  }
}

const goToDetail = async (id) => {
  if (!id) return
  dayDetailVisible.value = false
  await openTrainingDetail(id)
}

const openTrainingDetail = async (id) => {
  const res = await trainingApi.getDetail(id)
  currentDetail.value = res.data

  const da = res.data.deviationAnalysis
  if (da) {
    deviationItems.value = [
      {
        key: 'sets',
        label: '组数',
        planned: da.sets.planned,
        actual: da.sets.actual,
        color: getDeviationColor(da.sets.diff),
        deviationText: `${da.sets.diff > 0 ? '超量 +' : da.sets.diff < 0 ? '不足 ' : '持平 '}${Math.abs(da.sets.deviationPercent)}%`,
        extraInfo: ''
      },
      {
        key: 'reps',
        label: '次数',
        planned: da.reps.planned,
        actual: da.reps.actual,
        color: getDeviationColor(da.reps.diff),
        deviationText: `${da.reps.diff > 0 ? '超量 +' : da.reps.diff < 0 ? '不足 ' : '持平 '}${Math.abs(da.reps.deviationPercent)}%`,
        extraInfo: ''
      },
      {
        key: 'intensity',
        label: '强度',
        planned: da.intensity.adjustedPlanned + '%',
        actual: da.intensity.actual + '%',
        color: getDeviationColor(da.intensity.diffFromAdjusted),
        deviationText: `${da.intensity.diffFromAdjusted > 0 ? '超量 +' : da.intensity.diffFromAdjusted < 0 ? '不足 ' : '持平 '}${Math.abs(da.intensity.diffFromAdjusted)}%`,
        extraInfo: da.intensity.wasAdjusted
          ? `原计划: ${da.intensity.originalPlanned}% → 偏差 ${da.intensity.diffFromOriginal > 0 ? '+' : ''}${da.intensity.diffFromOriginal}%`
          : ''
      },
      {
        key: 'load',
        label: '总负荷',
        planned: da.load.planned,
        actual: da.load.actual,
        color: getDeviationColor(da.load.deviationPercent),
        deviationText: `${da.load.deviationPercent > 0 ? '超量 +' : da.load.deviationPercent < 0 ? '不足 ' : '持平 '}${Math.abs(da.load.deviationPercent)}%`,
        extraInfo: da.intensity.wasAdjusted
          ? `原计划负荷: ${da.load.originalPlannedLoad}`
          : ''
      }
    ]
  }

  if (res.data.rawRecord) {
    rawRecordRows.value = Object.entries(res.data.rawRecord).map(([k, v]) => ({
      field: k,
      value: String(v)
    }))
  }

  detailVisible.value = true

  await nextTick()
  renderHRChart(res.data.heartRate)
}

const renderHRChart = (data) => {
  if (!hrChartRef.value || !data?.length) return
  const container = hrChartRef.value
  container.innerHTML = ''

  const width = container.clientWidth - 20
  const height = 160

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)

  const x = d3.scalePoint().domain(data.map((d, i) => i)).range([50, width - 20])
  const y = d3.scaleLinear().domain([60, d3.max(data, d => d.heartRate) + 10]).range([height - 30, 10])

  const zones = [
    { key: 'warmup', name: '热身', color: '#67c23a', range: [80, 120] },
    { key: 'training', name: '训练', color: '#e6a23c', range: [120, 170] },
    { key: 'recovery', name: '恢复', color: '#409eff', range: [170, 200] }
  ]

  zones.forEach(zone => {
    svg.append('rect')
      .attr('x', 50).attr('y', y(zone.range[1]))
      .attr('width', width - 70).attr('height', y(zone.range[0]) - y(zone.range[1]))
      .attr('fill', zone.color).attr('opacity', 0.08)
  })

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d.heartRate))
    .curve(d3.curveMonotoneX)

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#f56c6c')
    .attr('stroke-width', 2)
    .attr('d', line)

  svg.append('g').attr('transform', `translate(0,${height - 30})`).call(d3.axisBottom(x).ticks(5))
  svg.append('g').attr('transform', 'translate(50,0)').call(d3.axisLeft(y).ticks(5))

  const legend = svg.append('g').attr('transform', 'translate(60, 10)')
  zones.forEach((z, i) => {
    legend.append('rect').attr('x', i * 70).attr('width', 12).attr('height', 12)
      .attr('fill', z.color).attr('opacity', 0.3)
    legend.append('text').attr('x', i * 70 + 18).attr('y', 10).style('font-size', '10px').text(z.name)
  })
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
  const user = currentUser.value
  if (user.role !== 'coach' && user.role !== 'rehab' && user.role !== 'head') {
    globalFilters.value.athleteId = user.id
    const athletes = await athleteApi.getList()
    selectedAthlete.value = athletes.data.find(a => a.id === user.id)
  }
  loadAllData()
})
</script>

<style scoped>
.dashboard { padding: 0; }
.stats-row { margin-bottom: 16px; }
.charts-row { margin-bottom: 16px; }

.anomaly-tip {
  position: absolute;
  bottom: 12px;
  left: 16px;
  z-index: 10;
}

.linkage-tip {
  position: absolute;
  bottom: 12px;
  left: 16px;
  z-index: 10;
}

.deviation-analysis {
  margin-top: 8px;
}

.deviation-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.dc-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.dc-values {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dc-plan, .dc-actual {
  display: flex;
  flex-direction: column;
}

.dcv-label { font-size: 11px; color: #909399; }
.dcv-value { font-size: 20px; font-weight: 700; }

.dc-deviation {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
}

.dc-extra {
  margin-top: 4px;
  font-size: 11px;
  color: #909399;
}

.title-extra {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: auto;
}

.chart-title {
  display: flex;
  align-items: center;
}
</style>
