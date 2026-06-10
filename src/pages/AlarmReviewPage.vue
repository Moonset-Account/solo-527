<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { use } from 'echarts/core'
import type { AlarmReview } from '@/types'
import { alarmApi } from '@/api'

use([CanvasRenderer, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const selectedMonth = ref('')
const loading = ref(false)
const reviewData = ref<AlarmReview | null>(null)

const resolveRate = computed(() => {
  if (!reviewData.value || reviewData.value.totalAlarms === 0) return '0%'
  return ((reviewData.value.resolvedAlarms / reviewData.value.totalAlarms) * 100).toFixed(1) + '%'
})

const pieOption = computed(() => {
  if (!reviewData.value) return {}
  const dist = reviewData.value.levelDistribution
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        name: '告警等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: dist.critical || 0, name: '严重', itemStyle: { color: '#F56C6C' } },
          { value: dist.warning || 0, name: '警告', itemStyle: { color: '#E6A23C' } },
          { value: dist.info || 0, name: '提示', itemStyle: { color: '#909399' } },
        ],
        label: { formatter: '{b}: {c}' },
      },
    ],
  }
})

const barOption = computed(() => {
  if (!reviewData.value) return {}
  const causes = reviewData.value.topCauses
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 30, top: 10, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: [...causes].reverse().map((c) => c.cause),
    },
    series: [
      {
        name: '告警数',
        type: 'bar',
        data: [...causes].reverse().map((c) => c.count),
        itemStyle: { color: '#409EFF' },
        barWidth: 20,
      },
    ],
  }
})

function getMonthValue(val: string) {
  if (!val) return ''
  const d = new Date(val)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

async function fetchReview() {
  const month = getMonthValue(selectedMonth.value)
  if (!month) return
  loading.value = true
  try {
    reviewData.value = await alarmApi.getReview(month)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const now = new Date()
  selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  fetchReview()
})
</script>

<template>
  <div v-loading="loading" class="alarm-review-page">
    <div class="page-header">
      <h2>月度告警复盘</h2>
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        format="YYYY-MM"
        value-format="YYYY-MM"
        @change="fetchReview"
      />
    </div>

    <template v-if="reviewData">
      <el-row :gutter="16" class="stat-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ reviewData.totalAlarms }}</div>
            <div class="stat-label">本月告警总数</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value resolved">{{ reviewData.resolvedAlarms }}</div>
            <div class="stat-label">已解决数</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value duration">{{ reviewData.avgResponseMinutes }}分钟</div>
            <div class="stat-label">平均响应时长</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value rate">{{ resolveRate }}</div>
            <div class="stat-label">解决率</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-row">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span class="section-title">告警等级分布</span>
            </template>
            <VChart :option="pieOption" autoresize style="height: 320px" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span class="section-title">TOP告警原因</span>
            </template>
            <VChart :option="barOption" autoresize style="height: 320px" />
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <span class="section-title">责任人处置情况</span>
        </template>
        <el-table :data="reviewData.assigneeStats" border style="width: 100%">
          <el-table-column prop="assignee" label="责任人" width="150" />
          <el-table-column prop="count" label="告警数" width="150" align="center" />
          <el-table-column prop="avgResponse" label="平均响应时长" align="center">
            <template #default="{ row }">
              {{ row.avgResponse }}分钟
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.alarm-review-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-value.resolved {
  color: #67c23a;
}

.stat-value.duration {
  color: #e6a23c;
}

.stat-value.rate {
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.chart-row {
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.table-card {
  margin-bottom: 16px;
}
</style>
