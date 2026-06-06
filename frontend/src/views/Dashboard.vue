<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="font-display text-3xl font-bold text-inkBlack mb-2">运营看板</h1>
          <p class="text-warmGray">实时掌握工作室运营状况</p>
        </div>
        <div class="flex items-center gap-3">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="w-auto"
            @change="fetchAllData"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warmGray text-sm mb-1">今日报名</p>
              <p class="text-3xl font-bold text-inkBlack">{{ overview.today_enrollments || 0 }}</p>
              <p class="text-warmGray text-sm mt-2">本统计周期内</p>
            </div>
            <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
              <span class="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warmGray text-sm mb-1">总营收</p>
              <p class="text-3xl font-bold text-inkBlack">¥{{ Number(overview.total_revenue || 0).toLocaleString() }}</p>
              <p class="text-warmGray text-sm mt-2">已付款 + 已完成订单</p>
            </div>
            <div class="w-14 h-14 bg-olive-100 rounded-2xl flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warmGray text-sm mb-1">新增作品</p>
              <p class="text-3xl font-bold text-inkBlack">{{ overview.total_works || 0 }}</p>
              <p class="text-warmGray text-sm mt-2">本统计周期内</p>
            </div>
            <div class="w-14 h-14 bg-wood-100 rounded-2xl flex items-center justify-center">
              <span class="text-2xl">🎨</span>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warmGray text-sm mb-1">新增学员</p>
              <p class="text-3xl font-bold text-inkBlack">{{ overview.new_students || 0 }}</p>
              <p class="text-warmGray text-sm mt-2">本统计周期内</p>
            </div>
            <div class="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <span class="text-2xl">👤</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="card p-6">
          <h3 class="font-display text-lg font-semibold text-inkBlack mb-6">报名趋势</h3>
          <div ref="enrollmentChart" style="height: 300px;"></div>
        </div>

        <div class="card p-6">
          <h3 class="font-display text-lg font-semibold text-inkBlack mb-6">状态分布</h3>
          <div ref="statusChart" style="height: 300px;"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-6">
          <h3 class="font-display text-lg font-semibold text-inkBlack mb-4">待处理事项</h3>
          <div class="space-y-3" v-loading="loading">
            <div
              class="flex items-center justify-between p-3 bg-wood-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <span class="text-xl">💳</span>
                <div>
                  <p class="font-medium text-inkBlack text-sm">待付款报名</p>
                  <p class="text-xs text-warmGray">需要跟进</p>
                </div>
              </div>
              <el-tag type="warning" size="small">{{ statusStats.enrollments_by_status?.pending || 0 }}</el-tag>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-wood-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <span class="text-xl">🎨</span>
                <div>
                  <p class="font-medium text-inkBlack text-sm">待审核作品</p>
                  <p class="text-xs text-warmGray">等待审核</p>
                </div>
              </div>
              <el-tag type="primary" size="small">{{ overview.pending_works || 0 }}</el-tag>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-wood-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <span class="text-xl">↩️</span>
                <div>
                  <p class="font-medium text-inkBlack text-sm">退款申请</p>
                  <p class="text-xs text-warmGray">等待处理</p>
                </div>
              </div>
              <el-tag type="danger" size="small">{{ statusStats.enrollments_by_status?.refund_requested || 0 }}</el-tag>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-wood-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <span class="text-xl">📦</span>
                <div>
                  <p class="font-medium text-inkBlack text-sm">库存预警</p>
                  <p class="text-xs text-warmGray">需要补货</p>
                </div>
              </div>
              <el-tag type="info" size="small">{{ overview.low_stock_materials || 0 }}</el-tag>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-display text-lg font-semibold text-inkBlack mb-4">老师课程利用率</h3>
          <div class="space-y-4" v-loading="loading">
            <div v-for="teacher in teacherUtilization" :key="teacher.id">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-inkBlack">{{ teacher.name }}</span>
                <span class="text-warmGray">{{ teacher.enrollment_count }} 个报名 / {{ teacher.course_count }} 门课</span>
              </div>
              <el-progress
                :percentage="Math.min(100, Math.round(teacher.enrollment_count / Math.max(1, teacher.course_count * 8) * 100))"
                :color="getUtilizationColor(Math.min(100, Math.round(teacher.enrollment_count / Math.max(1, teacher.course_count * 8) * 100)))"
                :show-text="false"
                height="8"
              />
            </div>
            <div v-if="teacherUtilization.length === 0" class="text-center py-6 text-warmGray">
              <p>暂无老师数据</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-display text-lg font-semibold text-inkBlack mb-4">库存预警</h3>
          <div class="space-y-3" v-loading="loading">
            <div
              v-for="item in lowStockMaterials"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-red-50 rounded-lg"
            >
              <div>
                <p class="font-medium text-inkBlack text-sm">{{ item.name }}</p>
                <p class="text-xs text-red-600">剩余 {{ item.stock }} 件 / 预警 {{ item.warning_threshold }} 件</p>
              </div>
              <el-tag type="danger" size="small">库存不足</el-tag>
            </div>
            <div v-if="lowStockMaterials.length === 0" class="text-center py-6 text-warmGray">
              <span class="text-3xl mb-2 block">✅</span>
              <p>所有材料库存充足</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  getDashboardOverview,
  getStatusStats,
  getResourceUtilization,
  getEnrollmentTrends
} from '@/api/dashboard'

const enrollmentChart = ref<HTMLElement>()
const statusChart = ref<HTMLElement>()
let enrollmentChartInstance: echarts.ECharts | null = null
let statusChartInstance: echarts.ECharts | null = null

const loading = ref(false)
const dateRange = ref<Date[]>()

const overview = reactive({
  today_enrollments: 0,
  total_revenue: 0,
  total_works: 0,
  new_students: 0,
  low_stock_materials: 0,
  pending_works: 0
})

const statusStats = reactive({
  enrollments_by_status: {} as Record<string, number>,
  works_by_status: {} as Record<string, number>,
  materials_by_status: {} as Record<string, number>
})

const teacherUtilization = ref<any[]>([])
const lowStockMaterials = ref<any[]>([])
const enrollmentTrends = reactive({
  daily_enrollments: {} as Record<string, number>,
  daily_revenue: {} as Record<string, number>
})

const getUtilizationColor = (val: number) => {
  if (val >= 80) return '#10B981'
  if (val >= 60) return '#F59E0B'
  return '#EF4444'
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const getParams = () => {
  const params: any = {}
  if (dateRange.value && dateRange.value.length === 2) {
    params.start_date = formatDate(dateRange.value[0])
    params.end_date = formatDate(dateRange.value[1])
  }
  return params
}

const initCharts = () => {
  if (enrollmentChart.value) {
    enrollmentChartInstance = echarts.init(enrollmentChart.value)
  }
  if (statusChart.value) {
    statusChartInstance = echarts.init(statusChart.value)
  }
}

const updateCharts = () => {
  if (enrollmentChartInstance) {
    const dates = Object.keys(enrollmentTrends.daily_enrollments).sort()
    const counts = dates.map(d => enrollmentTrends.daily_enrollments[d] || 0)
    
    enrollmentChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates.length > 0 ? dates : ['暂无数据']
      },
      yAxis: { type: 'value' },
      series: [{
        data: counts.length > 0 ? counts : [0],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(210, 105, 77, 0.3)' },
            { offset: 1, color: 'rgba(210, 105, 77, 0.05)' }
          ])
        },
        lineStyle: { color: '#D2694D', width: 3 },
        itemStyle: { color: '#D2694D' }
      }]
    })
  }

  if (statusChartInstance) {
    const enrollmentData = Object.entries(statusStats.enrollments_by_status || {}).map(([key, value]) => ({
      name: getStatusLabel(key),
      value: value,
      itemStyle: { color: getStatusColor(key) }
    }))

    statusChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: enrollmentData.length > 0 ? enrollmentData : [{ name: '暂无数据', value: 1, itemStyle: { color: '#E5E7EB' } }]
      }]
    })
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    completed: '已完成',
    cancelled: '已取消',
    refund_requested: '退款申请',
    refunded: '已退款'
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    paid: '#3B82F6',
    completed: '#10B981',
    cancelled: '#6B7280',
    refund_requested: '#EF4444',
    refunded: '#8B5CF6'
  }
  return colors[status] || '#9CA3AF'
}

const fetchAllData = async () => {
  loading.value = true
  const params = getParams()
  try {
    const [overviewRes, statusRes, resourceRes, trendsRes] = await Promise.all([
      getDashboardOverview(params),
      getStatusStats(params),
      getResourceUtilization(params),
      getEnrollmentTrends(params)
    ])

    Object.assign(overview, overviewRes)
    Object.assign(statusStats, statusRes)
    teacherUtilization.value = resourceRes.teacher_utilization || []
    lowStockMaterials.value = resourceRes.low_stock_materials || []
    Object.assign(enrollmentTrends, trendsRes)
    
    updateCharts()
  } catch (e) {
    console.error('Failed to fetch dashboard data:', e)
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  enrollmentChartInstance?.resize()
  statusChartInstance?.resize()
}

onMounted(() => {
  initCharts()
  fetchAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  enrollmentChartInstance?.dispose()
  statusChartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>
