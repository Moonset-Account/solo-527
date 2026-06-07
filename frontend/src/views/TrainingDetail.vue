<template>
  <div class="training-detail" v-loading="loading">
    <el-page-header @back="goBack" content="训练详情" />

    <el-card v-if="detail" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>{{ detail.training?.athleteName }} - {{ detail.training?.date }}</span>
          <el-tag>{{ detail.training?.exercise }}</el-tag>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="运动员">{{ detail.training?.athleteName }}</el-descriptions-item>
        <el-descriptions-item label="训练日期">{{ detail.training?.date }}</el-descriptions-item>
        <el-descriptions-item label="训练项目">{{ detail.training?.exercise }}</el-descriptions-item>
        <el-descriptions-item label="所属项目">{{ detail.training?.sport }}</el-descriptions-item>
        <el-descriptions-item label="完成率">
          <span :style="{ color: detail.training?.completionRate >= 90 ? '#67c23a' : '#f56c6c' }">
            {{ detail.training?.completionRate }}%
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.training?.notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <h3 style="margin: 20px 0 12px; font-size: 16px">计划 vs 实际对比</h3>

      <div v-if="detail.planComparison?.adjusted" style="margin-bottom: 12px">
        <el-alert type="warning" :closable="false">
          <template #title>
            训练计划已临时调整，保留原计划强度以便比较偏差
          </template>
          <p>原计划强度: <span style="text-decoration: line-through; color: #f56c6c">{{ detail.planComparison.intensity.original }}%</span></p>
          <p>调整后强度: <span style="color: #e6a23c">{{ detail.planComparison.intensity.planned }}%</span></p>
          <p>调整原因: {{ detail.planComparison.adjustmentReason }}</p>
        </el-alert>
      </div>

      <el-row :gutter="16">
        <el-col :span="8" v-for="item in comparisonItems" :key="item.key">
          <div class="comparison-card">
            <div class="cc-label">{{ item.label }}</div>
            <div class="cc-values">
              <div class="cc-plan">
                <span class="cv-label">计划</span>
                <span class="cv-value">{{ item.planned }}</span>
              </div>
              <el-icon color="#909399"><ArrowRight /></el-icon>
              <div class="cc-actual">
                <span class="cv-label">实际</span>
                <span class="cv-value" :style="{ color: item.diffColor }">
                  {{ item.actual }}
                </span>
              </div>
            </div>
            <div class="cc-diff" :style="{ color: item.diffColor }">
              {{ item.diffText }}
            </div>
          </div>
        </el-col>
      </el-row>

      <h3 v-if="detail.heartRate?.length" style="margin: 20px 0 12px; font-size: 16px">心率曲线</h3>
      <div ref="hrChartRef" style="height: 200px; background: #fafafa; border-radius: 6px; padding: 10px"></div>

      <h3 style="margin: 20px 0 12px; font-size: 16px">原始训练记录</h3>
      <el-table :data="[detail.training]" size="small" border>
        <el-table-column prop="actualSets" label="实际组数" />
        <el-table-column prop="actualReps" label="实际次数" />
        <el-table-column prop="actualIntensity" label="实际强度(%)" />
        <el-table-column prop="completionRate" label="完成率(%)" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as d3 from 'd3'
import { ArrowRight } from '@element-plus/icons-vue'
import { trainingApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const detail = ref(null)
const hrChartRef = ref(null)

const comparisonItems = computed(() => {
  if (!detail.value?.planComparison) return []
  const pc = detail.value.planComparison
  const items = [
    { key: 'sets', label: '组数', planned: pc.sets.planned, actual: pc.sets.actual, diff: pc.sets.diff },
    { key: 'reps', label: '次数', planned: pc.reps.planned, actual: pc.reps.actual, diff: pc.reps.diff },
    { key: 'intensity', label: '强度(%)', planned: pc.intensity.planned, actual: pc.intensity.actual, diff: pc.intensity.actual - pc.intensity.planned }
  ]
  return items.map(item => ({
    ...item,
    diffColor: item.diff > 0 ? '#67c23a' : item.diff < 0 ? '#f56c6c' : '#909399',
    diffText: item.diff > 0 ? `超量 +${item.diff}` : item.diff < 0 ? `不足 ${item.diff}` : '持平'
  }))
})

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await trainingApi.getDetail(route.params.id)
    detail.value = res.data
    await nextTick()
    renderHRChart()
  } finally {
    loading.value = false
  }
}

const renderHRChart = () => {
  if (!hrChartRef.value || !detail.value?.heartRate?.length) return
  const data = detail.value.heartRate
  const container = hrChartRef.value
  container.innerHTML = ''

  const width = container.clientWidth - 20
  const height = 180

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const x = d3.scalePoint()
    .domain(data.map((d, i) => i))
    .range([50, width - 20])

  const y = d3.scaleLinear()
    .domain([60, d3.max(data, d => d.heartRate) + 10])
    .range([height - 30, 10])

  const zones = [
    { key: 'warmup', name: '热身', color: '#67c23a', range: [80, 120] },
    { key: 'training', name: '训练', color: '#e6a23c', range: [120, 170] },
    { key: 'recovery', name: '恢复', color: '#409eff', range: [170, 200] }
  ]

  zones.forEach(zone => {
    svg.append('rect')
      .attr('x', 50)
      .attr('y', y(zone.range[1]))
      .attr('width', width - 70)
      .attr('height', y(zone.range[0]) - y(zone.range[1]))
      .attr('fill', zone.color)
      .attr('opacity', 0.1)
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

  const legend = svg.append('g').attr('transform', 'translate(60, 15)')
  zones.forEach((z, i) => {
    legend.append('rect').attr('x', i * 70).attr('width', 12).attr('height', 12)
      .attr('fill', z.color).attr('opacity', 0.3)
    legend.append('text').attr('x', i * 70 + 18).attr('y', 10).style('font-size', '10px').text(z.name)
  })
}

const goBack = () => router.back()

onMounted(loadDetail)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.comparison-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.cc-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.cc-values {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.cc-plan, .cc-actual {
  display: flex;
  flex-direction: column;
}

.cv-label {
  font-size: 11px;
  color: #909399;
}

.cv-value {
  font-size: 24px;
  font-weight: 700;
}

.cc-diff {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
}
</style>
