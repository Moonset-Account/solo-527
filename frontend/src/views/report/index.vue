<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据报表</h2>
      <div class="header-actions">
        <el-select v-model="envFilter" placeholder="选择环境" style="width: 150px" @change="loadOverview">
          <el-option label="全部环境" value="" />
          <el-option label="开发环境" value="dev" />
          <el-option label="测试环境" value="test" />
          <el-option label="预发布环境" value="staging" />
          <el-option label="生产环境" value="prod" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="总览" name="overview">
        <el-row :gutter="16" class="stat-row">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-value">{{ overview.memberTotal || 0 }}</div>
                <div class="stat-label">会员总数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card card-2">
              <div class="stat-icon">🎫</div>
              <div class="stat-info">
                <div class="stat-value">{{ couponTotal }}</div>
                <div class="stat-label">优惠券总量</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card card-3">
              <div class="stat-icon">✨</div>
              <div class="stat-info">
                <div class="stat-value">{{ overview.activityTotal || 0 }}</div>
                <div class="stat-label">活跃记录</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card card-4">
              <div class="stat-icon">📨</div>
              <div class="stat-info">
                <div class="stat-value">{{ reachTotal }}</div>
                <div class="stat-label">触达次数</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="mt-20">
          <el-col :span="12">
            <div class="card-wrapper">
              <div class="card-title">会员等级分布</div>
              <div ref="levelChartRef" style="height: 300px;"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card-wrapper">
              <div class="card-title">优惠券状态分布</div>
              <div ref="couponChartRef" style="height: 300px;"></div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="触达分析" name="reach">
        <div class="filter-bar">
          <el-form :inline="true" :model="reachFilter">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="触达方式">
              <el-select v-model="reachFilter.type" placeholder="全部" clearable style="width: 130px">
                <el-option label="短信" value="sms" />
                <el-option label="微信" value="wechat" />
                <el-option label="APP推送" value="app_push" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadReachReport">查询</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-row :gutter="16" class="stat-row">
          <el-col :span="8">
            <div class="stat-card">
              <div class="stat-label">触达总数</div>
              <div class="stat-value">{{ reachReport.total || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card success">
              <div class="stat-label">成功数</div>
              <div class="stat-value">{{ reachSuccess }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card danger">
              <div class="stat-label">失败数</div>
              <div class="stat-value">{{ reachFailed }}</div>
            </div>
          </el-col>
        </el-row>

        <div class="card-wrapper mt-20">
          <div class="card-title">每日触达趋势</div>
          <div ref="reachChartRef" style="height: 320px;"></div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const activeTab = ref('overview')
const envFilter = ref('')
const overview = ref({})
const reachReport = ref({})
const dateRange = ref([])

const reachFilter = reactive({
  type: '',
  startDate: '',
  endDate: '',
})

const levelChartRef = ref(null)
const couponChartRef = ref(null)
const reachChartRef = ref(null)

let levelChart = null
let couponChart = null
let reachChart = null

const couponTotal = computed(() => {
  if (!overview.value?.couponStats) return 0
  return overview.value.couponStats.reduce((s, i) => s + i.count, 0)
})

const reachTotal = computed(() => {
  if (!overview.value?.reachStats) return 0
  return overview.value.reachStats.reduce((s, i) => s + i.count, 0)
})

const reachSuccess = computed(() => {
  const item = reachReport.value?.byStatus?.find(s => s._id === 'success')
  return item?.count || 0
})

const reachFailed = computed(() => {
  const item = reachReport.value?.byStatus?.find(s => s._id === 'failed')
  return item?.count || 0
})

const levelNameMap = {
  bronze: '青铜', silver: '白银', gold: '黄金', platinum: '铂金', diamond: '钻石'
}
const couponStatusMap = {
  unused: '未使用', used: '已使用', expired: '已过期'
}

async function loadOverview() {
  try {
    const res = await request.get('/reports/overview', { params: { envLabel: envFilter.value } })
    overview.value = res
    nextTick(() => {
      renderLevelChart()
      renderCouponChart()
    })
  } catch (e) {
    console.error(e)
  }
}

async function loadReachReport() {
  const params = { ...reachFilter, envLabel: envFilter.value }
  if (dateRange.value?.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  try {
    const res = await request.get('/reports/reach', { params })
    reachReport.value = res
    nextTick(() => {
      renderReachChart()
    })
  } catch (e) {
    console.error(e)
  }
}

function renderLevelChart() {
  if (!levelChartRef.value) return
  if (!levelChart) levelChart = echarts.init(levelChartRef.value)
  const data = overview.value.levelStats || []
  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      name: '会员等级',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}人' },
      data: data.map(d => ({
        name: levelNameMap[d._id] || d._id,
        value: d.count
      })),
      color: ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#B9F2FF'],
    }]
  }
  levelChart.setOption(option)
}

function renderCouponChart() {
  if (!couponChartRef.value) return
  if (!couponChart) couponChart = echarts.init(couponChartRef.value)
  const data = overview.value.couponStats || []
  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      name: '优惠券状态',
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}张' },
      data: data.map(d => ({
        name: couponStatusMap[d._id] || d._id,
        value: d.count
      })),
      color: ['#e6a23c', '#67c23a', '#909399'],
    }]
  }
  couponChart.setOption(option)
}

function renderReachChart() {
  if (!reachChartRef.value) return
  if (!reachChart) reachChart = echarts.init(reachChartRef.value)
  const data = reachReport.value.byDay || []
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总触达', '成功', '失败'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '总触达', type: 'bar', data: data.map(d => d.total), itemStyle: { color: '#ec4899', borderRadius: [4, 4, 0, 0] } },
      { name: '成功', type: 'bar', data: data.map(d => d.success || 0), itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] } },
      { name: '失败', type: 'bar', data: data.map(d => d.failed || 0), itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] } },
    ]
  }
  reachChart.setOption(option)
}

onMounted(() => {
  loadOverview()
  loadReachReport()
  window.addEventListener('resize', () => {
    levelChart?.resize()
    couponChart?.resize()
    reachChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-row {
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .stat-icon {
    font-size: 32px;
    width: 56px;
    height: 56px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef2f7;
  }
  .card-2 .stat-icon { background: #eff6ff; }
  .card-3 .stat-icon { background: #f0fdf4; }
  .card-4 .stat-icon { background: #fdf4ff; }

  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
  }
  .stat-label {
    font-size: 14px;
    color: #6b7280;
    margin-top: 4px;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.stat-row .stat-card {
  text-align: center;
  justify-content: center;
  .stat-value {
    font-size: 32px;
    margin-bottom: 6px;
  }
  &.success .stat-value { color: #67c23a; }
  &.danger .stat-value { color: #f56c6c; }
  &.warning .stat-value { color: #e6a23c; }
}

.filter-bar {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
</style>
