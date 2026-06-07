<template>
  <div class="athlete-view">
    <div class="profile-card">
      <el-avatar :size="80" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
        {{ currentUser?.name?.charAt(0) || currentUser?.athleteName?.charAt(0) }}
      </el-avatar>
      <div class="profile-info">
        <h2>{{ currentUser?.name || currentUser?.athleteName }}</h2>
        <p>
          <el-tag size="small" type="success">{{ currentUser?.sport }}</el-tag>
          <el-tag size="small" type="info">{{ currentUser?.position }}</el-tag>
          <el-tag size="small">{{ currentUser?.level }}</el-tag>
        </p>
        <p class="meta">年龄: {{ currentUser?.age }} | 性别: {{ currentUser?.gender }}</p>
      </div>
      <div class="profile-stats">
        <div class="ps-item">
          <div class="ps-value">{{ acwr.acwr || '-' }}</div>
          <div class="ps-label">ACWR 负荷比</div>
          <div class="ps-tag">
            <el-tag :type="acwrRiskType" size="small">{{ acwr.risk || '-' }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="chart-container" style="position: relative">
          <div class="chart-title">
            <el-icon><TrendCharts /></el-icon>
            <span>我的训练负荷曲线</span>
            <span v-if="loadAnomalies.length > 0" class="anomaly-count">
              <el-tag type="danger" size="small">{{ loadAnomalies.length }} 个异常</el-tag>
            </span>
          </div>
          <div class="chart-wrapper" ref="loadChartRef">
            <div class="loading-overlay" v-if="loading.load"><el-icon class="is-loading"><Loading /></el-icon></div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <RadarChart
          :data="radarData"
          :team-avg="teamAvg"
          :athlete-name="currentUser?.name"
          :loading="loading.radar"
        />
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-container" style="position: relative">
          <div class="chart-title">
            <el-icon><MoonNight /></el-icon>
            <span>我的恢复趋势</span>
            <el-tag v-if="highlightedDate" type="info" size="small" style="margin-left: 12px">
              已选中: {{ highlightedDate }}
            </el-tag>
          </div>
          <div class="chart-wrapper" ref="recoveryChartRef">
            <div class="loading-overlay" v-if="loading.recovery"><el-icon class="is-loading"><Loading /></el-icon></div>
          </div>
          <div class="chart-tip">
            <el-tag type="info" size="small">💡 点击数据点可查看当日详细训练记录</el-tag>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="chart-container">
          <div class="chart-title">
            <el-icon><List /></el-icon>
            <span>训练计划与完成情况</span>
            <el-tag type="warning" size="small" style="margin-left: 12px" v-if="adjustedCount > 0">
              {{ adjustedCount }} 个计划已调整，保留原强度供比较
            </el-tag>
          </div>
          <el-table :data="planList" size="small" v-loading="loading.plans" row-key="id">
            <el-table-column prop="date" label="日期" width="110" fixed />
            <el-table-column prop="exercise" label="动作" width="100" />
            <el-table-column label="原计划强度" width="110" align="center">
              <template #default="{ row }">
                <span v-if="row.adjusted" class="original-intensity">
                  {{ row.originalIntensity }}%
                </span>
                <span v-else class="normal-intensity">
                  {{ row.plannedIntensity }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="调整后强度" width="110" align="center">
              <template #default="{ row }">
                <span v-if="row.adjusted" class="adjusted-intensity">
                  {{ row.adjustedIntensity }}%
                  <el-tag size="small" type="warning" style="margin-left: 4px">调</el-tag>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="实际强度" width="100" align="right">
              <template #default="{ row }">
                <span v-if="row.actual" :style="{ color: getDeviationColor(row.deviation?.intensityDeviation), fontWeight: 600 }">
                  {{ row.actual.actualIntensity }}%
                </span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="强度偏差" width="110" align="right">
              <template #default="{ row }">
                <template v-if="row.actual">
                  <div>
                    <span :style="{ color: getDeviationColor(row.deviation?.intensityDeviation) }">
                      {{ row.deviation?.intensityDeviation > 0 ? '+' : '' }}{{ row.deviation?.intensityDeviation || 0 }}%
                    </span>
                  </div>
                  <div v-if="row.adjusted" class="dev-sub">
                    较原计划:
                    <span :style="{ color: getDeviationColor(row.deviation?.originalIntensityDeviation) }">
                      {{ row.deviation?.originalIntensityDeviation > 0 ? '+' : '' }}{{ row.deviation?.originalIntensityDeviation || 0 }}%
                    </span>
                  </div>
                </template>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="组数 × 次数" width="130" align="center">
              <template #default="{ row }">
                <template v-if="row.actual">
                  {{ row.plannedSets }}/{{ row.actual.actualSets }} × {{ row.plannedReps }}/{{ row.actual.actualReps }}
                </template>
                <span v-else>{{ row.plannedSets }}组 × {{ row.plannedReps }}次</span>
              </template>
            </el-table-column>
            <el-table-column label="完成率" width="90" align="center">
              <template #default="{ row }">
                <span v-if="row.actual" :style="{ color: row.actual.completionRate >= 90 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                  {{ row.actual.completionRate }}%
                </span>
                <span v-else style="color: #c0c4cc">未完成</span>
              </template>
            </el-table-column>
            <el-table-column label="调整原因" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.adjusted">{{ row.adjustmentReason }}</span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :disabled="!row.actual"
                  @click="viewDetail(row.actual?.id)"
                >
                  原始记录
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="dayDetailVisible" :title="`${selectedDayDate} 训练详情`" width="850px">
      <div v-if="selectedDayTrainings.length > 0">
        <el-alert v-if="selectedDayHasAdjusted" type="warning" :closable="false" style="margin-bottom: 16px">
          <template #title>
            当日训练计划已临时调整，已保留原计划强度方便比较实际完成偏差
          </template>
        </el-alert>
        <el-table :data="selectedDayTrainings" size="small" border>
          <el-table-column prop="exercise" label="动作" width="120" fixed />
          <el-table-column label="计划强度对比" width="220">
            <template #default="{ row }">
              <template v-if="row.plan?.adjusted">
                <span style="text-decoration: line-through; color: #f56c6c">
                  {{ row.plan.originalIntensity }}%
                </span>
                <el-icon style="vertical-align: middle; margin: 0 4px"><ArrowRight /></el-icon>
                <span style="color: #e6a23c; font-weight: 600">{{ row.plan.adjustedIntensity }}%</span>
                <el-tag size="small" type="warning">已调整</el-tag>
              </template>
              <span v-else>{{ row.plan?.plannedIntensity }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="实际强度" width="90" align="right">
            <template #default="{ row }">
              <span :style="{ color: getDeviationColor(row.deviation?.intensityDeviation), fontWeight: 600 }">
                {{ row.training?.actualIntensity }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="强度偏差" width="110" align="right">
            <template #default="{ row }">
              <div>
                较计划:
                <span :style="{ color: getDeviationColor(row.deviation?.intensityDeviation) }">
                  {{ row.deviation?.intensityDeviation > 0 ? '+' : '' }}{{ row.deviation?.intensityDeviation || 0 }}%
                </span>
              </div>
              <div v-if="row.plan?.adjusted" class="dev-sub">
                较原计划:
                <span :style="{ color: getDeviationColor(row.deviation?.originalIntensityDeviation) }">
                  {{ row.deviation?.originalIntensityDeviation > 0 ? '+' : '' }}{{ row.deviation?.originalIntensityDeviation || 0 }}%
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="组数" width="80" align="center">
            <template #default="{ row }">
              {{ row.plan?.plannedSets }}/{{ row.training?.actualSets }}
            </template>
          </el-table-column>
          <el-table-column label="次数" width="80" align="center">
            <template #default="{ row }">
              {{ row.plan?.plannedReps }}/{{ row.training?.actualReps }}
            </template>
          </el-table-column>
          <el-table-column label="负荷偏差" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: getDeviationColor(row.deviation?.loadDeviation) }">
                {{ row.deviation?.loadDeviation > 0 ? '+' : '' }}{{ row.deviation?.loadDeviation || 0 }} AU
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="goToDetailFromDay(row.training?.id)">
                原始记录
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="当日无训练记录" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { ElMessage } from 'element-plus'
import { List, TrendCharts, MoonNight, Loading, ArrowRight } from '@element-plus/icons-vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import { trainingApi, recoveryApi } from '@/api'

const router = useRouter()

const currentUser = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
const athleteId = computed(() => currentUser.value.id)

const highlightedDate = ref(null)

const loading = reactive({
  load: false,
  radar: false,
  recovery: false,
  plans: false
})

const loadData = ref([])
const loadAnomalies = ref([])
const radarData = ref([])
const teamAvg = ref([])
const recoveryData = ref([])
const recoveryAnomalies = ref([])
const planList = ref([])
const acwr = ref({})

const loadChartRef = ref(null)
const recoveryChartRef = ref(null)

const dayDetailVisible = ref(false)
const selectedDayDate = ref('')
const selectedDayTrainings = ref([])
const selectedDayHasAdjusted = ref(false)

const adjustedCount = computed(() => planList.value.filter(p => p.adjusted).length)

const acwrRiskType = computed(() => {
  switch (acwr.value.risk) {
    case 'high': return 'danger'
    case 'low': return 'warning'
    case 'optimal': return 'success'
    default: return 'info'
  }
})

const getDeviationColor = (val) => {
  if (val > 0) return '#67c23a'
  if (val < 0) return '#f56c6c'
  return '#909399'
}

const loadDataAll = async () => {
  loading.load = true
  loading.radar = true
  loading.recovery = true
  loading.plans = true

  try {
    const [loadRes, radarRes, recRes, plansRes, acwrRes] = await Promise.all([
      trainingApi.getLoadCurve({ athleteId: athleteId.value }),
      trainingApi.getRadar({ athleteId: athleteId.value }),
      recoveryApi.getTrend({ athleteId: athleteId.value }),
      trainingApi.getPlans({ athleteId: athleteId.value }),
      trainingApi.getACWR({ athleteId: athleteId.value })
    ])

    loadData.value = loadRes.data.data
    loadAnomalies.value = loadRes.data.anomalies
    radarData.value = radarRes.data.radarData
    teamAvg.value = radarRes.data.teamAvg
    recoveryData.value = recRes.data.data
    recoveryAnomalies.value = recRes.data.anomalies
    planList.value = plansRes.data.slice(-30)
    acwr.value = acwrRes.data

    await nextTick()
    renderLoadChart()
    renderRecoveryChart()
  } finally {
    loading.load = false
    loading.radar = false
    loading.recovery = false
    loading.plans = false
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

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scalePoint()
    .domain(loadData.value.map(d => d.key))
    .range([0, innerWidth]).padding(0.3)

  const y = d3.scaleLinear()
    .domain([0, d3.max(loadData.value, d => d.load) * 1.15])
    .range([innerHeight, 0]).nice()

  const area = d3.area().x(d => x(d.key)).y0(innerHeight).y1(d => y(d.load)).curve(d3.curveMonotoneX)
  const line = d3.line().x(d => x(d.key)).y(d => y(d.load)).curve(d3.curveMonotoneX)

  const gradient = svg.append('defs').append('linearGradient')
    .attr('id', 'athleteLoadGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%')
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#409eff').attr('stop-opacity', 0.4)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#409eff').attr('stop-opacity', 0.05)

  g.append('path').datum(loadData.value).attr('fill', 'url(#athleteLoadGradient)').attr('d', area)
  g.append('path').datum(loadData.value).attr('fill', 'none').attr('stroke', '#409eff').attr('stroke-width', 2.5).attr('d', line)

  const xAxis = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x))
  xAxis.selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end').style('font-size', '10px')
  g.append('g').call(d3.axisLeft(y).ticks(6))

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
    .on('click', (event, d) => openDayDetail(d.key))
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 7)
      tooltip.transition().duration(200).style('opacity', .9)
      tooltip.html(`
        <div>日期: ${d.key}</div>
        <div>负荷: ${d.load} AU</div>
        <div>强度: ${d.intensity}%</div>
        <div style="color:#e6a23c;margin-top:4px">点击查看当日详情 →</div>
      `).style('left', (event.offsetX + 10) + 'px').style('top', (event.offsetY - 50) + 'px')
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
    .on('click', (event, d) => {
      ElMessage.warning(`检测到异常数据点: ${d.key}`)
      openDayDetail(d.key)
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

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scalePoint()
    .domain(recoveryData.value.map(d => d.date))
    .range([0, innerWidth]).padding(0.3)

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
    .attr('fill', '#409eff')
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      highlightedDate.value = highlightedDate.value === d.date ? null : d.date
      openDayDetail(d.date)
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
        <div style="color:#409eff;margin-top:4px">点击查看当日训练 →</div>
      `).style('left', (event.offsetX + 10) + 'px').style('top', (event.offsetY - 60) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('r', d.date === highlightedDate.value ? 7 : 4)
      tooltip.transition().duration(500).style('opacity', 0)
    })
}

const openDayDetail = async (date) => {
  selectedDayDate.value = date
  highlightedDate.value = date
  try {
    const res = await trainingApi.getDayTrainings(date)
    const result = res.data
    selectedDayTrainings.value = result.data
    selectedDayHasAdjusted.value = result.hasAdjusted
    dayDetailVisible.value = true
    renderLoadChart()
    renderRecoveryChart()
  } catch (e) {
    ElMessage.error('获取当日训练记录失败')
  }
}

const goToDetailFromDay = (id) => {
  if (!id) return
  dayDetailVisible.value = false
  router.push(`/training/${id}`)
}

const viewDetail = (id) => {
  if (id) router.push(`/training/${id}`)
}

onMounted(loadDataAll)
</script>

<style scoped>
.athlete-view { padding: 0; }

.profile-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-info h2 {
  margin: 0 0 8px;
  font-size: 22px;
}

.profile-info p {
  margin: 4px 0;
}

.meta {
  color: #909399;
  font-size: 13px;
}

.profile-stats {
  margin-left: auto;
  text-align: center;
}

.ps-item .ps-value {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
}

.ps-item .ps-label {
  font-size: 13px;
  color: #909399;
}

.ps-tag {
  margin-top: 4px;
}

.original-intensity {
  color: #f56c6c;
  text-decoration: line-through;
  font-weight: 500;
}

.normal-intensity {
  color: #606266;
  font-weight: 500;
}

.adjusted-intensity {
  color: #e6a23c;
  font-weight: 600;
}

.dev-sub {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.anomaly-count {
  margin-left: auto;
}

.chart-tip {
  position: absolute;
  bottom: 12px;
  left: 16px;
  z-index: 10;
}
</style>
