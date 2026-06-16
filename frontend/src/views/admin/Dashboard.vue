<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据看板</h2>
      <div>
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="quarter">本季度</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :md="6">
        <StatCard
          label="邮件总数"
          :value="stats.totalEmails"
          icon="Document"
          type="primary"
          :trend="12.5"
          suffix="封"
        />
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <StatCard
          label="已发送"
          :value="stats.sentEmails"
          icon="Promotion"
          type="success"
          :trend="8.3"
          suffix="封"
        />
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <StatCard
          label="待复核"
          :value="stats.pendingReview"
          icon="Clock"
          type="warning"
          :trend="-5.2"
          suffix="封"
        />
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <StatCard
          label="AI调用次数"
          :value="stats.aiCalls"
          icon="MagicStick"
          type="info"
          :trend="23.7"
          suffix="次"
        />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :md="16" :xs="24">
        <div class="chart-card card">
          <div class="chart-header">
            <h3 class="chart-title">邮件发送趋势</h3>
            <el-radio-group v-model="trendType" size="small">
              <el-radio-button label="daily">按日</el-radio-button>
              <el-radio-button label="weekly">按周</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChartRef" class="chart-content"></div>
        </div>
      </el-col>
      <el-col :md="8" :xs="24">
        <div class="chart-card card">
          <div class="chart-header">
            <h3 class="chart-title">邮件类型分布</h3>
          </div>
          <div ref="pieChartRef" class="chart-content"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :md="12" :xs="24">
        <div class="chart-card card">
          <div class="chart-header">
            <h3 class="chart-title">用户活跃度排行</h3>
          </div>
          <div ref="barChartRef" class="chart-content"></div>
        </div>
      </el-col>
      <el-col :md="12" :xs="24">
        <div class="chart-card card">
          <div class="chart-header">
            <h3 class="chart-title">复核通过率</h3>
          </div>
          <div ref="gaugeChartRef" class="chart-content"></div>
        </div>
      </el-col>
    </el-row>

    <div class="card recent-section">
      <div class="section-header">
        <h3 class="section-title">最近活动</h3>
        <el-link type="primary" :underline="false">查看全部</el-link>
      </div>
      <el-table :data="recentActivities" stripe>
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.tagType">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import StatCard from '@/components/StatCard.vue'

const timeRange = ref('week')
const trendType = ref('daily')

const trendChartRef = ref(null)
const pieChartRef = ref(null)
const barChartRef = ref(null)
const gaugeChartRef = ref(null)

let trendChart = null
let pieChart = null
let barChart = null
let gaugeChart = null

const stats = reactive({
  totalEmails: 1258,
  sentEmails: 892,
  pendingReview: 46,
  aiCalls: 3421
})

const recentActivities = [
  { user: '张三', action: '创建了邮件草稿「Q2产品报价」', type: '创建', tagType: '', time: '2024-01-15 14:30:25' },
  { user: '李四', action: '提交了邮件「合作意向确认」等待复核', type: '提交', tagType: 'warning', time: '2024-01-15 13:45:12' },
  { user: '王经理', action: '通过了邮件「年度续约邀请」', type: '通过', tagType: 'success', time: '2024-01-15 11:20:08' },
  { user: '张三', action: '使用AI生成邮件内容', type: 'AI', tagType: 'primary', time: '2024-01-15 10:15:33' },
  { user: '赵六', action: '驳回了邮件「促销活动通知」', type: '驳回', tagType: 'danger', time: '2024-01-15 09:30:47' }
]

function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['发送邮件', '创建草稿', 'AI生成'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: days },
    yAxis: { type: 'value' },
    series: [
      {
        name: '发送邮件',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#409eff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ]) }
      },
      {
        name: '创建草稿',
        type: 'line',
        smooth: true,
        data: [220, 182, 191, 234, 290, 330, 310],
        itemStyle: { color: '#67c23a' }
      },
      {
        name: 'AI生成',
        type: 'line',
        smooth: true,
        data: [150, 232, 201, 154, 190, 330, 410],
        itemStyle: { color: '#e6a23c' }
      }
    ]
  })
}

function initPieChart() {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 1048, name: '商务开发', itemStyle: { color: '#409eff' } },
        { value: 735, name: '客户跟进', itemStyle: { color: '#67c23a' } },
        { value: 580, name: '问题回复', itemStyle: { color: '#e6a23c' } },
        { value: 484, name: '会议邀约', itemStyle: { color: '#f56c6c' } },
        { value: 300, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }]
  })
}

function initBarChart() {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['张三', '李四', '王五', '赵六', '孙七', '周八'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [320, 282, 251, 234, 190, 150],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '40%'
    }]
  })
}

function initGaugeChart() {
  if (!gaugeChartRef.value) return
  gaugeChart = echarts.init(gaugeChartRef.value)
  gaugeChart.setOption({
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 10,
      radius: '90%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#67c23a' },
          { offset: 1, color: '#409eff' }
        ])
      },
      progress: { show: true, width: 20 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 20, color: [[1, '#e4e7ed']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '0%'],
        fontSize: 40,
        fontWeight: 'bold',
        formatter: '{value}%',
        color: '#303133'
      },
      data: [{ value: 87.5, name: '通过率' }]
    }]
  })
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
  barChart?.resize()
  gaugeChart?.resize()
}

onMounted(async () => {
  await nextTick()
  initTrendChart()
  initPieChart()
  initBarChart()
  initGaugeChart()
  window.addEventListener('resize', handleResize)
})

watch(timeRange, () => {
})
</script>

<style lang="scss" scoped>
.stat-row {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  padding: 20px;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: #303133;
    }
  }

  .chart-content {
    width: 100%;
    height: 300px;
  }
}

.recent-section {
  padding: 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: #303133;
    }
  }
}
</style>
