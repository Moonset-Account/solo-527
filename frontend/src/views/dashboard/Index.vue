<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总需求数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-in-progress">
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-completed">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-delayed">
          <div class="stat-value">{{ stats.delayed }}</div>
          <div class="stat-label">延期数</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>需求状态分布</template>
          <v-chart :option="pieOption" style="height: 320px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>延期比例</template>
          <v-chart :option="gaugeOption" style="height: 320px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="todo-row">
      <template #header>最近待办</template>
      <el-table :data="recentTodos" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="requirementId" label="需求ID" width="100" />
        <el-table-column prop="dueDate" label="截止日期" width="120">
          <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'" size="small">
              {{ row.status === 'COMPLETED' ? '已完成' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, GaugeChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { pageRequirements } from '@/api/requirement'
import { getDelayRatio } from '@/api/report'
import { getTodosByUser } from '@/api/todo'
import { formatDate } from '@/utils'

use([PieChart, GaugeChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const stats = ref({
  total: 0,
  inProgress: 0,
  completed: 0,
  delayed: 0
})

const statusData = ref([])
const delayRatio = ref(0)
const recentTodos = ref([])

const pieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}\n{d}%' },
    data: statusData.value
  }]
}))

const gaugeOption = computed(() => ({
  series: [{
    type: 'gauge',
    startAngle: 200,
    endAngle: -20,
    min: 0,
    max: 100,
    pointer: { show: true },
    progress: { show: true, width: 14 },
    axisLine: { lineStyle: { width: 14 } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    detail: { valueAnimation: true, formatter: '{value}%', fontSize: 24, offsetCenter: [0, '60%'] },
    data: [{ value: delayRatio.value, name: '延期比例' }],
    title: { offsetCenter: [0, '80%'], fontSize: 14 }
  }]
}))

const statusMap = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  DELAYED: '延期',
  CLOSED: '已关闭'
}

const statusColorMap = {
  DRAFT: '#909399',
  SUBMITTED: '#409eff',
  IN_PROGRESS: '#e6a23c',
  COMPLETED: '#67c23a',
  DELAYED: '#f56c6c',
  CLOSED: '#c0c4cc'
}

onMounted(async () => {
  try {
    const [pageRes, ratioRes, todoRes] = await Promise.all([
      pageRequirements({ page: 1, size: 1000 }),
      getDelayRatio(),
      getTodosByUser({ userId: 1 })
    ])

    const list = pageRes.data?.records || []
    const counts = {}
    list.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })

    stats.value = {
      total: pageRes.data?.total || list.length,
      inProgress: counts.IN_PROGRESS || 0,
      completed: counts.COMPLETED || 0,
      delayed: counts.DELAYED || 0
    }

    statusData.value = Object.entries(counts).map(([status, value]) => ({
      name: statusMap[status] || status,
      value,
      itemStyle: { color: statusColorMap[status] }
    }))

    delayRatio.value = ratioRes.data?.delayRatio ?? (stats.value.total > 0 ? Math.round(stats.value.delayed / stats.value.total * 100) : 0)

    recentTodos.value = (todoRes.data || []).slice(0, 10)
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
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

.stat-in-progress .stat-value {
  color: #e6a23c;
}

.stat-completed .stat-value {
  color: #67c23a;
}

.stat-delayed .stat-value {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.todo-row {
  margin-bottom: 20px;
}
</style>
