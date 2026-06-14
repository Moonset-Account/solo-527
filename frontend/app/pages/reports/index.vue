<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-space>
        <n-date-picker v-model:value="selectedDate" type="month" :default-value="defaultDate" @update:value="handleDateChange" />
      </n-space>
    </n-space>

    <n-grid :cols="3" :x-gap="16" :y-gap="16">
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #1B2A4A, #2d4a7a)', color: '#fff' }">
          <n-statistic label="月度质量评分" :value="qualityReport.avg_score" :precision="1">
            <template #prefix>
              <n-icon :size="20"><BarChartOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #E8A838, #f0c060)', color: '#fff' }">
          <n-statistic label="问题数" :value="qualityReport.issue_count">
            <template #prefix>
              <n-icon :size="20"><AlertCircleOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #FF4D4F, #ff7875)', color: '#fff' }">
          <n-statistic label="延期数" :value="delayReport.total">
            <template #prefix>
              <n-icon :size="20"><TimeOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" :y-gap="16" style="margin-top: 16px">
      <n-gi>
        <n-card title="质量趋势" size="small">
          <div class="chart-container">
            <div class="chart-title">最近6个月质量评分</div>
            <div class="bar-chart">
              <div v-for="(item, index) in qualityTrend" :key="index" class="bar-item">
                <div class="bar-wrapper">
                  <div class="bar" :style="{ height: `${item.score}%`, background: getScoreColor(item.score) }">
                    <span class="bar-value">{{ item.score }}</span>
                  </div>
                </div>
                <div class="bar-label">{{ item.month }}</div>
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="延期原因分布" size="small">
          <div class="chart-container">
            <div class="pie-legend">
              <div v-for="(count, reason) in delayReport.by_reason" :key="reason" class="legend-item">
                <n-space align="center">
                  <div class="legend-dot" :style="{ background: getReasonColor(reason as string) }"></div>
                  <span>{{ getReasonLabel(reason as string) }}</span>
                  <n-tag size="small" type="error">{{ count }}</n-tag>
                </n-space>
              </div>
            </div>
            <div class="progress-list">
              <div v-for="(count, reason) in delayReport.by_reason" :key="reason" style="margin-bottom: 12px">
                <n-space justify="space-between" style="margin-bottom: 4px">
                  <span style="font-size: 13px">{{ getReasonLabel(reason as string) }}</span>
                  <span style="font-size: 13px; color: #8c8c8c">{{ count }} 次 ({{ getPercentage(count) }}%)</span>
                </n-space>
                <n-progress :percentage="getPercentage(count)" :color="getReasonColor(reason as string)" :height="8" />
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card title="延期任务列表" size="small" style="margin-top: 16px">
      <n-data-table :columns="delayColumns" :data="delayReport.items" :bordered="false" size="small" />
      <n-empty v-if="delayReport.items.length === 0" description="暂无延期任务" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import {
  BarChartOutline,
  AlertCircleOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import { reportApi } from '~/utils/api'
import type { QualityReport, DelayReport } from '~/types'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const now = new Date()
const defaultDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
const selectedDate = ref<number | null>(defaultDate)
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

const qualityReport = reactive<QualityReport>({
  avg_score: 0,
  issue_count: 0,
  delay_count: 0,
  pass_count: 0,
  fail_count: 0,
  conditional_pass_count: 0,
  details: [],
})

const delayReport = reactive<DelayReport>({
  total: 0,
  total_tasks: 0,
  by_reason: {},
  items: [],
})

const qualityTrend = ref([
  { month: '1月', score: 85 },
  { month: '2月', score: 88 },
  { month: '3月', score: 82 },
  { month: '4月', score: 90 },
  { month: '5月', score: 87 },
  { month: '6月', score: 0 },
])

const delayColumns = [
  { title: '任务名称', key: 'node_name' },
  { title: '所属合同', key: 'contract_name' },
  { title: '截止日期', key: 'deadline', width: 120, render: (row: any) => row.deadline?.slice(0, 10) || '-' },
  {
    title: '状态', key: 'status', width: 100,
    render: (row: any) => {
      const statusMap: Record<string, { label: string; type: string }> = {
        pending: { label: '待处理', type: 'warning' },
        in_progress: { label: '进行中', type: 'info' },
      }
      const s = statusMap[row.status] || { label: row.status, type: 'default' }
      return h(NTag, { size: 'small', type: s.type as any }, { default: () => s.label })
    },
  },
]

const reasonLabels: Record<string, string> = {
  material_delay: '材料延误',
  weather: '天气原因',
  labor_shortage: '人力不足',
  design_change: '设计变更',
  other: '其他原因',
}

const reasonColors: Record<string, string> = {
  material_delay: '#FF4D4F',
  weather: '#E8A838',
  labor_shortage: '#1B2A4A',
  design_change: '#36B37E',
  other: '#8c8c8c',
}

function getScoreColor(score: number) {
  if (score >= 90) return '#36B37E'
  if (score >= 80) return '#1B2A4A'
  if (score >= 70) return '#E8A838'
  return '#FF4D4F'
}

function getReasonLabel(reason: string) {
  return reasonLabels[reason] || reason
}

function getReasonColor(reason: string) {
  return reasonColors[reason] || '#8c8c8c'
}

const totalDelayCount = computed(() => {
  return Object.values(delayReport.by_reason).reduce((sum, count) => sum + count, 0) || 1
})

function getPercentage(count: number) {
  return Math.round((count / totalDelayCount.value) * 100)
}

function handleDateChange(value: number | null) {
  if (value) {
    const date = new Date(value)
    selectedYear.value = date.getFullYear()
    selectedMonth.value = date.getMonth() + 1
    loadData()
  }
}

async function loadData() {
  try {
    const [qualityRes, delayRes] = await Promise.all([
      reportApi.quality({ year: selectedYear.value, month: selectedMonth.value }),
      reportApi.delay({ year: selectedYear.value, month: selectedMonth.value }),
    ])
    Object.assign(qualityReport, qualityRes)
    Object.assign(delayReport, delayRes)
    qualityTrend.value[qualityTrend.value.length - 1].score = Math.round(qualityRes.avg_score || 0)
  } catch (e: any) {
    message.error(e?.data?.detail || '加载数据失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.chart-container {
  padding: 16px 0;
}

.chart-title {
  text-align: center;
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 20px;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 0 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  width: 40px;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 32px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s ease;
  min-height: 4px;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #595959;
  font-weight: 500;
}

.bar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.pie-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.progress-list {
  padding: 0 8px;
}
</style>
