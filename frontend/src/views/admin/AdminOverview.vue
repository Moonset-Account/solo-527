<template>
  <div>
    <h1 class="font-display text-2xl font-bold text-inkBlack mb-6">管理概览</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">今日报名</p>
            <p class="text-3xl font-bold text-inkBlack">{{ todayStats.enrollments }}</p>
            <p class="text-olive-600 text-sm mt-1">+5 较昨日</p>
          </div>
          <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
            <span class="text-2xl">📝</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">今日营收</p>
            <p class="text-3xl font-bold text-inkBlack">¥{{ todayStats.revenue?.toLocaleString() }}</p>
            <p class="text-olive-600 text-sm mt-1">+12% 较昨日</p>
          </div>
          <div class="w-14 h-14 bg-olive-100 rounded-2xl flex items-center justify-center">
            <span class="text-2xl">💰</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">待审核作品</p>
            <p class="text-3xl font-bold text-inkBlack">{{ todayStats.pendingWorks }}</p>
            <p class="text-yellow-600 text-sm mt-1">需要处理</p>
          </div>
          <div class="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
            <span class="text-2xl">🎨</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">库存预警</p>
            <p class="text-3xl font-bold text-inkBlack">{{ todayStats.lowStock }}</p>
            <p class="text-red-500 text-sm mt-1">需要补货</p>
          </div>
          <div class="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
            <span class="text-2xl">⚠️</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="card p-6">
        <h3 class="font-semibold text-inkBlack mb-4">近7天报名趋势</h3>
        <div ref="enrollmentChart" style="height: 250px;"></div>
      </div>

      <div class="card p-6">
        <h3 class="font-semibold text-inkBlack mb-4">近期活动</h3>
        <div class="space-y-4">
          <div v-for="activity in recentActivities" :key="activity.id" class="flex items-start space-x-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :class="activity.bgColor">
              <span>{{ activity.icon }}</span>
            </div>
            <div>
              <p class="text-sm text-inkBlack">{{ activity.title }}</p>
              <p class="text-xs text-warmGray">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold text-inkBlack">最新报名</h3>
        <router-link to="/admin/enrollments" class="text-primary-600 text-sm hover:text-primary-700">
          查看全部 →
        </router-link>
      </div>
      <el-table :data="recentEnrollments" size="small">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="student_name" label="学员">
          <template #default="{ row }">{{ row.student?.name }}</template>
        </el-table-column>
        <el-table-column prop="course_title" label="课程">
          <template #default="{ row }">{{ row.course?.title }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { Enrollment } from '@/types'

const enrollmentChart = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const todayStats = {
  enrollments: 12,
  revenue: 3588,
  pendingWorks: 5,
  lowStock: 2
}

const recentActivities = [
  { id: 1, icon: '💳', title: '张小美完成课程付款', time: '5分钟前', bgColor: 'bg-green-100' },
  { id: 2, icon: '🎨', title: '李大伟上传了新作品', time: '15分钟前', bgColor: 'bg-blue-100' },
  { id: 3, icon: '↩️', title: '王小芳提交退款申请', time: '1小时前', bgColor: 'bg-yellow-100' },
  { id: 4, icon: '📦', title: '陶艺材料包库存预警', time: '2小时前', bgColor: 'bg-red-100' },
  { id: 5, icon: '📚', title: '新增课程「高级陶艺」', time: '3小时前', bgColor: 'bg-purple-100' }
]

const recentEnrollments = ref<Enrollment[]>([
  { id: 1, order_no: 'ENR20240115001', status: 'paid', total_amount: 299, created_at: '2024-01-15T14:30:00', student: { name: '张小美' }, course: { title: '手工拉坯入门' } },
  { id: 2, order_no: 'ENR20240115002', status: 'pending', total_amount: 399, created_at: '2024-01-15T13:20:00', student: { name: '李大伟' }, course: { title: '银饰戒指制作' } },
  { id: 3, order_no: 'ENR20240115003', status: 'paid', total_amount: 349, created_at: '2024-01-15T11:05:00', student: { name: '王小芳' }, course: { title: '短款钱包制作' } }
] as Enrollment[])

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    paid: 'primary',
    completed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    completed: '已完成'
  }
  return texts[status] || status
}

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const initChart = () => {
  if (enrollmentChart.value) {
    chartInstance = echarts.init(enrollmentChart.value)
    chartInstance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['1/9', '1/10', '1/11', '1/12', '1/13', '1/14', '1/15']
      },
      yAxis: { type: 'value' },
      series: [{
        data: [8, 12, 15, 10, 18, 22, 12],
        type: 'bar',
        itemStyle: { color: '#D2694D', borderRadius: [4, 4, 0, 0] }
      }]
    })
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>
