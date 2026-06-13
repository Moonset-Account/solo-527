<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="(item, idx) in statCards" :key="idx">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" :style="{ background: item.bg }">
            <el-icon :size="28" color="#fff"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近7日内容提交趋势</span>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>内容状态分布</span>
            </div>
          </template>
          <div ref="statusChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近期待办</span>
              <el-button type="primary" link @click="$router.push('/contents')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todoList" size="small">
            <el-table-column prop="title" label="内容标题" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="负责人" width="100" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>即将发布排期</span>
              <el-button type="primary" link @click="$router.push('/schedules')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="scheduleList" size="small">
            <el-table-column prop="contentTitle" label="内容标题" show-overflow-tooltip />
            <el-table-column prop="scheduledTime" label="发布时间" width="160">
              <template #default="{ row }">{{ formatDate(row.scheduledTime) }}</template>
            </el-table-column>
            <el-table-column prop="publisher" label="执行人" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { statsApi, contentApi, operationApi } from '@/api'
import { CONTENT_STATUS, getStatusLabel, getStatusType, formatDate, getUserById } from '@/utils/constants'
import { ElMessage } from 'element-plus'

const router = useRouter()
const trendChartRef = ref()
const statusChartRef = ref()
let trendChart = null
let statusChart = null

const statCards = reactive([
  { label: '全部内容', value: 0, icon: 'Document', bg: '#409EFF' },
  { label: '待审稿', value: 0, icon: 'Clock', bg: '#E6A23C' },
  { label: '已发布', value: 0, icon: 'CircleCheck', bg: '#67C23A' },
  { label: '异常内容', value: 0, icon: 'Warning', bg: '#F56C6C' }
])

const todoList = ref([])
const scheduleList = ref([])

async function loadStats() {
  try {
    const statusData = await statsApi.status()
    statCards[0].value = Object.values(statusData).reduce((a, b) => a + b, 0) || 0
    statCards[1].value = (statusData.submitted || 0) + (statusData.reviewing || 0)
    statCards[2].value = statusData.published || 0
    const exData = await contentApi.exceptions({ pageSize: 1 })
    statCards[3].value = exData.total || 0
    renderStatusChart(statusData)
  } catch (e) {}
}

async function loadTrend() {
  try {
    const data = await statsApi.trend({ days: 7 })
    renderTrendChart(data)
  } catch (e) {}
}

async function loadTodoList() {
  try {
    const res = await contentApi.list({ status: 'reviewing', pageSize: 5 })
    todoList.value = res.list.map(item => ({
      ...item,
      assignee: getUserById(item.assignee).name
    }))
  } catch (e) {}
}

async function loadScheduleList() {
  try {
    const res = await operationApi.scheduleList({ status: 'pending', pageSize: 5 })
    scheduleList.value = res.list.map(item => ({
      ...item,
      publisher: getUserById(item.publisher).name
    }))
  } catch (e) {}
}

function renderTrendChart(data) {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.date.slice(5))
    },
    yAxis: { type: 'value' },
    series: [{
      name: '提交数量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.2 },
      data: data.map(d => d.count),
      itemStyle: { color: '#409EFF' }
    }]
  })
}

function renderStatusChart(data) {
  if (!statusChartRef.value) return
  const pieData = Object.entries(data)
    .filter(([k, v]) => v > 0)
    .map(([k, v]) => ({ name: getStatusLabel(k), value: v }))

  statusChart = echarts.init(statusChartRef.value)
  statusChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: pieData
    }]
  })
}

onMounted(async () => {
  await Promise.all([loadStats(), loadTrend(), loadTodoList(), loadScheduleList()])
  nextTick(() => {
    window.addEventListener('resize', () => {
      trendChart?.resize()
      statusChart?.resize()
    })
  })
})
</script>

<style scoped lang="scss">
.stat-card {
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    float: left;
  }
  .stat-info {
    margin-left: 72px;
    .stat-label {
      color: #909399;
      font-size: 13px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      margin-top: 4px;
    }
  }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
