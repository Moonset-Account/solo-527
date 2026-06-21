<template>
  <div class="dashboard-page space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">仪表板</h1>
        <p class="text-sm text-gray-500 mt-1">{{ todayStr }} · 欢迎回来，{{ authStore.userInfo?.realName || '管理员' }}</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small" type="primary" ghost>
          <template #icon>
            <n-icon>
              <RefreshSharp />
            </n-icon>
          </template>
          刷新数据
        </n-button>
        <n-button size="small">
          <template #icon>
            <n-icon>
              <DownloadSharp />
            </n-icon>
          </template>
          导出报表
        </n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="card in dashboardStore.todoCards"
        :key="card.id"
        class="group cursor-pointer"
        @click="handleCardClick(card)"
      >
        <n-card class="!rounded-2xl !border-0 hover:!shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden" content-style="padding: 0;">
          <div :class="['p-5 bg-gradient-to-br', card.bgGradient]">
            <div class="flex items-start justify-between">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" :style="{ backgroundColor: card.color + '20' }">
                <n-icon :size="24" :color="card.color">
                  <component :is="getIcon(card.icon)" />
                </n-icon>
              </div>
              <n-badge :value="card.count" :max="99" :color="card.color" show-zero />
            </div>
            <div class="mt-4">
              <div class="text-base font-semibold text-gray-800">{{ card.title }}</div>
              <div class="flex items-center mt-2 text-sm text-gray-500 group-hover:text-gray-700">
                <span>立即处理</span>
                <n-icon :size="14" class="ml-1 transition-transform group-hover:translate-x-1">
                  <ChevronForwardSharp />
                </n-icon>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <n-card class="!rounded-2xl !border-0 xl:col-span-2" title="异常告警" content-style="padding: 16px 20px 20px;">
        <template #header-extra>
          <n-tag size="small" type="warning" round>
            共 {{ dashboardStore.alerts.length }} 条
          </n-tag>
        </template>
        <div class="space-y-3">
          <div
            v-for="alert in dashboardStore.alerts"
            :key="alert.id"
            class="flex items-start gap-3 p-4 rounded-xl transition-all hover:shadow-md"
            :class="alert.type === 'danger' ? 'bg-red-50 hover:bg-red-100/70' : 'bg-orange-50 hover:bg-orange-100/70'"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="alert.type === 'danger' ? 'bg-red-100' : 'bg-orange-100'"
            >
              <n-icon :size="20" :color="alert.type === 'danger' ? '#EF4444' : '#F97316'">
                <AlertCircleSharp />
              </n-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <n-tag :type="alert.type === 'danger' ? 'error' : 'warning'" size="small" round>
                  {{ alert.type === 'danger' ? '紧急' : '警告' }}
                </n-tag>
                <span class="font-medium text-gray-800 truncate">{{ alert.title }}</span>
              </div>
              <p class="text-sm text-gray-600 mt-1.5">{{ alert.description }}</p>
              <span class="text-xs text-gray-400 mt-1.5 inline-block">{{ alert.time }}</span>
            </div>
            <n-button text size="small" @click.stop="dashboardStore.dismissAlert(alert.id)">
              <template #icon>
                <n-icon size="16">
                  <CloseSharp />
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </n-card>

      <n-card class="!rounded-2xl !border-0" title="今日排班概览" content-style="padding: 16px 20px 20px;">
        <template #header-extra>
          <n-tag size="small" type="success" round>
            4人在岗
          </n-tag>
        </template>
        <div class="relative pl-1">
          <div class="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
          <div class="space-y-4">
            <div v-for="schedule in dashboardStore.schedules" :key="schedule.id" class="relative flex gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 relative z-10 shadow-sm"
                :style="{ backgroundColor: schedule.avatarColor }"
              >
                {{ schedule.staffName.charAt(0) }}
              </div>
              <div class="flex-1 pb-1">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-800 text-sm">{{ schedule.staffName }}</span>
                  <span class="text-xs text-gray-400">{{ schedule.startTime }} - {{ schedule.endTime }}</span>
                </div>
                <div class="text-xs text-gray-500 mt-0.5">{{ schedule.role }}</div>
                <div class="mt-2 flex items-center gap-2">
                  <div class="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :style="{
                        width: (schedule.tasks / 8 * 100) + '%',
                        backgroundColor: getLoadColor(schedule.load),
                      }"
                    ></div>
                  </div>
                  <n-tag :type="getLoadTagType(schedule.load)" size="small" round>
                    {{ schedule.tasks }}任务
                  </n-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <n-card class="!rounded-2xl !border-0 xl:col-span-2" title="最近7天订单趋势" content-style="padding: 16px 20px 20px;">
        <template #header-extra>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm" style="background: linear-gradient(180deg, #1A8A7D 0%, #2AA89A 100%);"></span>
              订单量
            </span>
          </div>
        </template>
        <div ref="chartRef" style="width: 100%; height: 320px;"></div>
      </n-card>

      <n-card class="!rounded-2xl !border-0" title="最近操作记录" content-style="padding: 16px 20px 20px;">
        <template #header-extra>
          <n-button text size="tiny" style="color: #1A8A7D;">
            查看全部
            <template #icon>
              <n-icon size="14">
                <ChevronForwardSharp />
              </n-icon>
            </template>
          </n-button>
        </template>
        <div class="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          <div
            v-for="log in dashboardStore.operationLogs"
            :key="log.id"
            class="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="getLogIconBg(log.type)"
            >
              <n-icon :size="16" :color="getLogIconColor(log.type)">
                <component :is="getLogIcon(log.type)" />
              </n-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-800">
                <span class="font-medium">{{ log.user }}</span>
                <span class="text-gray-500"> {{ log.action }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-0.5 truncate">{{ log.target }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ log.time }}</div>
            </div>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, h } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import type { TodoCard, OperationLog } from '~/stores/dashboard'
import {
  HeartSharp,
  AlertCircleSharp,
  CalendarSharp,
  TimeSharp,
  ChevronForwardSharp,
  CloseSharp,
  RefreshSharp,
  DownloadSharp,
  AddCircleSharp,
  CreateSharp,
  TrashSharp,
  CheckmarkCircleSharp,
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const router = useRouter()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const todayStr = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))

const iconMap: Record<string, any> = {
  HeartSharp,
  AlertCircleSharp,
  CalendarSharp,
  TimeSharp,
}

function getIcon(name: string) {
  return iconMap[name] || HeartSharp
}

function handleCardClick(card: TodoCard) {
  router.push(card.route)
}

function getLoadColor(load: string) {
  switch (load) {
    case 'high': return '#EF4444'
    case 'medium': return '#F97316'
    case 'low': return '#10B981'
    default: return '#6B7280'
  }
}

function getLoadTagType(load: string) {
  switch (load) {
    case 'high': return 'error' as const
    case 'medium': return 'warning' as const
    case 'low': return 'success' as const
    default: return 'default' as const
  }
}

function getLogIcon(type: OperationLog['type']) {
  switch (type) {
    case 'create': return AddCircleSharp
    case 'update': return CreateSharp
    case 'delete': return TrashSharp
    case 'review': return CheckmarkCircleSharp
    default: return CreateSharp
  }
}

function getLogIconBg(type: OperationLog['type']) {
  switch (type) {
    case 'create': return 'bg-green-50'
    case 'update': return 'bg-blue-50'
    case 'delete': return 'bg-red-50'
    case 'review': return 'bg-teal-50'
    default: return 'bg-gray-50'
  }
}

function getLogIconColor(type: OperationLog['type']) {
  switch (type) {
    case 'create': return '#10B981'
    case 'update': return '#3B82F6'
    case 'delete': return '#EF4444'
    case 'review': return '#1A8A7D'
    default: return '#6B7280'
  }
}

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)

  const option: echarts.EChartsOption = {
    grid: {
      left: 10,
      right: 20,
      top: 30,
      bottom: 20,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: any) => {
        const data = params[0]
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 500; margin-bottom: 4px;">${data.axisValue}</div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #1A8A7D;"></span>
            <span>订单量: <b style="color: #1A8A7D;">${data.value}</b> 单</span>
          </div>
        </div>`
      },
    },
    xAxis: {
      type: 'category',
      data: dashboardStore.orderTrend.map((d) => d.date),
      boundaryGap: false,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      show: false,
      min: 0,
    },
    series: [
      {
        name: '订单量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: dashboardStore.orderTrend.map((d) => d.orders),
        lineStyle: {
          width: 3,
          color: '#1A8A7D',
        },
        itemStyle: {
          color: '#1A8A7D',
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(26, 138, 125, 0.35)' },
            { offset: 0.5, color: 'rgba(26, 138, 125, 0.15)' },
            { offset: 1, color: 'rgba(26, 138, 125, 0.02)' },
          ]),
        },
      },
    ],
  }

  chartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
