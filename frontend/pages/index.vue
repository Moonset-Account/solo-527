<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <n-card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日预约</p>
            <p class="text-2xl font-bold mt-2">{{ stats.todayAppointments }}</p>
          </div>
          <n-icon size="32" class="text-blue-500">
            <CalendarOutline />
          </n-icon>
        </div>
      </n-card>
      <n-card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">咨询师数量</p>
            <p class="text-2xl font-bold mt-2">{{ stats.counselors }}</p>
          </div>
          <n-icon size="32" class="text-green-500">
            <PeopleOutline />
          </n-icon>
        </div>
      </n-card>
      <n-card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">本周排班</p>
            <p class="text-2xl font-bold mt-2">{{ stats.weekSchedules }}</p>
          </div>
          <n-icon size="32" class="text-purple-500">
            <TimeOutline />
          </n-icon>
        </div>
      </n-card>
      <n-card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">爽约人数</p>
            <p class="text-2xl font-bold mt-2">{{ stats.noShowCount }}</p>
          </div>
          <n-icon size="32" class="text-red-500">
            <AlertCircleOutline />
          </n-icon>
        </div>
      </n-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <n-card title="最近预约" hoverable>
        <template #header-extra>
          <n-button text size="small" @click="router.push('/appointments')">
            查看全部
          </n-button>
        </template>
        <n-table :data="recentAppointments" :columns="appointmentColumns" bordered>
          <template #status="{ row }">
            <n-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </n-tag>
          </template>
        </n-table>
      </n-card>

      <n-card title="最近操作" hoverable>
        <template #header-extra>
          <n-button text size="small" @click="router.push('/config/logs')">
            查看全部
          </n-button>
        </template>
        <n-table :data="recentOperations" :columns="operationColumns" bordered>
          <template #operator="{ row }">
            {{ row.operator_info?.real_name || '-' }}
          </template>
        </n-table>
      </n-card>
    </div>

    <n-card title="档期利用率" hoverable>
      <div style="height: 300px;">
        <v-chart :option="chartOption" autoresize />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NIcon,
  NTable,
  NButton,
  NTag,
  TableColumns,
  useMessage
} from 'naive-ui'
import {
  CalendarOutline,
  PeopleOutline,
  TimeOutline,
  AlertCircleOutline
} from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
])

const router = useRouter()
const message = useMessage()
const { apiRequest } = useAuth()

const stats = ref({
  todayAppointments: 0,
  counselors: 0,
  weekSchedules: 0,
  noShowCount: 0
})

const recentAppointments = ref<any[]>([])
const recentOperations = ref<any[]>([])

const appointmentColumns: TableColumns = [
  { title: '访客姓名', key: 'visitor_name' },
  { title: '咨询师', key: 'counselor_name' },
  { title: '状态', key: 'status' }
]

const operationColumns: TableColumns = [
  { title: '操作人', key: 'operator' },
  { title: '操作类型', key: 'operation_type' },
  { title: '目标类型', key: 'target_type' },
  { title: '时间', key: 'created_at' }
]

function getStatusType(status: string) {
  const map: Record<string, any> = {
    pending: 'warning',
    confirmed: 'success',
    completed: 'info',
    cancelled: 'default',
    no_show: 'error'
  }
  return map[status] || 'default'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '爽约'
  }
  return map[status] || status
}

const chartOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    data: ['已预约', '可预约']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value',
    name: '预约数'
  },
  series: [
    {
      name: '已预约',
      type: 'bar',
      stack: 'total',
      data: [12, 15, 8, 10, 18, 6, 4],
      itemStyle: { color: '#18a058' }
    },
    {
      name: '可预约',
      type: 'bar',
      stack: 'total',
      data: [8, 5, 12, 10, 2, 14, 16],
      itemStyle: { color: '#e0e0e0' }
    }
  ]
}

async function loadData() {
  try {
    const [counselors, noShowList, appointments, operations] = await Promise.all([
      apiRequest<any[]>('/api/counselors?is_active=true'),
      apiRequest<any[]>('/api/no-show-list?is_blocked=true'),
      apiRequest<any[]>('/api/appointments?limit=5'),
      apiRequest<any[]>('/api/operation-logs?limit=5')
    ])
    
    stats.value.counselors = counselors.length
    stats.value.noShowCount = noShowList.length
    stats.value.todayAppointments = appointments.filter((a: any) => 
      a.schedule_info?.schedule_date === new Date().toISOString().split('T')[0]
    ).length
    
    recentAppointments.value = appointments.map((apt: any) => ({
      ...apt,
      counselor_name: apt.schedule_info?.counselor_info?.name || '-'
    }))
    
    recentOperations.value = operations.map((op: any) => ({
      ...op,
      operator: op.operator_info?.real_name || '-'
    }))
    
    const schedules = await apiRequest<any[]>('/api/schedules')
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    stats.value.weekSchedules = schedules.filter((s: any) => {
      const sDate = new Date(s.schedule_date)
      return sDate >= weekStart && sDate < weekEnd
    }).length
  } catch (error: any) {
    message.error('加载数据失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
