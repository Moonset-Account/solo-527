<template>
  <div class="report-page">
    <el-card shadow="hover" class="filter-card">
      <div class="filter-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="warning" @click="handleGenerate">生成报表</el-button>
        <el-button type="primary" @click="fetchData">查询</el-button>
      </div>
    </el-card>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ overview.total }}</div>
          <div class="stat-label">总需求数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-completed">
          <div class="stat-value">{{ overview.completed }}</div>
          <div class="stat-label">完成数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-delayed">
          <div class="stat-value">{{ overview.delayed }}</div>
          <div class="stat-label">延期数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-ratio">
          <div class="stat-value ratio-value" :class="ratioClass">{{ overview.delayRatio }}%</div>
          <div class="stat-label">延期比例</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>延期比例趋势</template>
          <v-chart :option="lineOption" style="height: 360px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>各部门需求完成情况</template>
          <v-chart :option="barOption" style="height: 360px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="detail-card">
      <template #header>报表详情</template>
      <el-table :data="reportList" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="total" label="总需求" width="100" />
        <el-table-column prop="completed" label="完成" width="100" />
        <el-table-column prop="delayed" label="延期" width="100" />
        <el-table-column label="延期比例" width="120">
          <template #default="{ row }">
            <span :class="getRatioClass(row.delayRatio)">{{ row.delayRatio }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgProcessDays" label="平均处理天数" min-width="120" />
      </el-table>
    </el-card>

    <el-card shadow="hover" class="dept-card">
      <template #header>部门效率指标</template>
      <el-table :data="deptMetrics" stripe style="width: 100%">
        <el-table-column prop="deptName" label="部门" width="140" />
        <el-table-column prop="total" label="需求数" width="100" />
        <el-table-column prop="completed" label="完成数" width="100" />
        <el-table-column prop="delayed" label="延期数" width="100" />
        <el-table-column label="延期比例" width="120">
          <template #default="{ row }">
            <span :class="getRatioClass(row.delayRatio)">{{ row.delayRatio }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgProcessDays" label="平均处理天数" min-width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ElMessage } from 'element-plus'
import { generateReport, getReports, getDelayRatio, getDeptMetrics } from '@/api/report'

use([LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const dateRange = ref(null)
const reportList = ref([])
const delayTrend = ref([])
const deptData = ref([])
const deptMetrics = ref([])

const overview = ref({
  total: 0,
  completed: 0,
  delayed: 0,
  delayRatio: 0
})

const ratioClass = computed(() => getRatioClass(overview.value.delayRatio))

function getRatioClass(ratio) {
  if (ratio > 30) return 'ratio-danger'
  if (ratio > 15) return 'ratio-warning'
  return 'ratio-success'
}

const lineOption = computed(() => ({
  tooltip: { trigger: 'axis', formatter: '{b}<br/>延期比例: {c}%' },
  xAxis: {
    type: 'category',
    data: delayTrend.value.map(d => d.date),
    axisLabel: { rotate: 30 }
  },
  yAxis: {
    type: 'value',
    axisLabel: { formatter: '{value}%' },
    max: 100
  },
  series: [{
    name: '延期比例',
    type: 'line',
    data: delayTrend.value.map(d => d.delayRatio),
    smooth: true,
    itemStyle: { color: '#f56c6c' },
    areaStyle: { color: 'rgba(245,108,108,0.15)' }
  }]
}))

const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['完成数', '延期数'] },
  xAxis: {
    type: 'category',
    data: deptData.value.map(d => d.deptName)
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '完成数',
      type: 'bar',
      data: deptData.value.map(d => d.completed),
      itemStyle: { color: '#67c23a' }
    },
    {
      name: '延期数',
      type: 'bar',
      data: deptData.value.map(d => d.delayed),
      itemStyle: { color: '#f56c6c' }
    }
  ]
}))

async function handleGenerate() {
  if (!dateRange.value) {
    ElMessage.warning('请选择日期范围')
    return
  }
  try {
    await generateReport({ startDate: dateRange.value[0], endDate: dateRange.value[1] })
    ElMessage.success('报表生成成功')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function fetchData() {
  const params = {}
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  try {
    const [reportRes, trendRes, deptRes, metricsRes] = await Promise.all([
      getReports(params),
      getDelayRatio(params),
      getDeptMetrics({ ...params, chart: true }),
      getDeptMetrics(params)
    ])
    reportList.value = reportRes.data || []
    delayTrend.value = trendRes.data?.trend || []
    deptData.value = deptRes.data || []
    deptMetrics.value = metricsRes.data || []

    const totals = reportList.value.reduce((acc, r) => ({
      total: acc.total + r.total,
      completed: acc.completed + r.completed,
      delayed: acc.delayed + r.delayed
    }), { total: 0, completed: 0, delayed: 0 })
    overview.value = {
      total: totals.total,
      completed: totals.completed,
      delayed: totals.delayed,
      delayRatio: totals.total > 0 ? Number((totals.delayed / totals.total * 100).toFixed(1)) : 0
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.report-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 10px 0;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-completed .stat-value {
  color: #67c23a;
}

.stat-delayed .stat-value {
  color: #f56c6c;
}

.ratio-value {
  font-size: 36px;
  font-weight: 700;
}

.ratio-danger {
  color: #f56c6c;
}

.ratio-warning {
  color: #e6a23c;
}

.ratio-success {
  color: #67c23a;
}

.chart-row {
  margin-bottom: 20px;
}

.detail-card {
  margin-bottom: 20px;
}

.dept-card {
  margin-bottom: 20px;
}
</style>
