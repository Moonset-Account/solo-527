<template>
  <div>
    <PageHeader title="质量报表" subtitle="查看维修质量统计报表" />
    <a-card class="mb-4">
      <a-range-picker
        v-model:value="dateRange"
        format="YYYY-MM-DD"
        @change="loadData"
      />
    </a-card>
    <a-row :gutter="16" class="mb-4">
      <a-col :span="6">
        <a-card class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ statistics.totalOrders }}</div>
          <div class="text-gray-500 mt-1">总单数</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ statistics.completionRate }}%</div>
          <div class="text-gray-500 mt-1">完成率</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="text-center">
          <div class="text-3xl font-bold text-orange-600">{{ statistics.exceptionRate }}%</div>
          <div class="text-gray-500 mt-1">异常率</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ statistics.noShowRate }}%</div>
          <div class="text-gray-500 mt-1">爽约率</div>
        </a-card>
      </a-col>
    </a-row>
    <a-row :gutter="16" class="mb-4">
      <a-col :span="14">
        <a-card title="近30天维修单趋势">
          <div ref="trendChartRef" style="height: 300px"></div>
        </a-card>
      </a-col>
      <a-col :span="10">
        <a-card title="状态分布">
          <div ref="pieChartRef" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
    <a-card>
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="transitions" tab="流转记录">
          <a-table
            :columns="transitionColumns"
            :data-source="transitionData"
            :pagination="transitionPagination"
            @change="handleTransitionPageChange"
            row-key="id"
          />
        </a-tab-pane>
        <a-tab-pane key="noShows" tab="爽约记录">
          <a-table
            :columns="noShowColumns"
            :data-source="noShowData"
            :pagination="noShowPagination"
            @change="handleNoShowPageChange"
            row-key="id"
          />
        </a-tab-pane>
        <a-tab-pane key="exceptions" tab="异常记录">
          <a-table
            :columns="exceptionColumns"
            :data-source="exceptionData"
            :pagination="exceptionPagination"
            @change="handleExceptionPageChange"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <StatusTag :status="record.level" type="exception" />
              </template>
              <template v-else-if="column.key === 'status'">
                <StatusTag :status="record.status" type="exception" />
              </template>
              <template v-else-if="column.key === 'action'">
                <a @click="viewWorkOrder(record.workOrderId)">查看原单</a>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getQualityReport, getStatistics, getTransitionList, getNoShowList } from '@/api/quality'
import { getExceptionList } from '@/api/exceptions'
import type { TablePaginationConfig } from 'ant-design-vue'

const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(30, 'day'),
  dayjs()
])
const activeTab = ref('transitions')
const trendChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const statistics = ref({
  totalOrders: 0,
  completionRate: 0,
  exceptionRate: 0,
  noShowRate: 0
})

const transitionData = ref<any[]>([])
const transitionPagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })
const noShowData = ref<any[]>([])
const noShowPagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })
const exceptionData = ref<any[]>([])
const exceptionPagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })

const transitionColumns = [
  { title: '单号', dataIndex: 'workOrderId', key: 'workOrderId' },
  { title: '车辆', dataIndex: 'plateNumber', key: 'plateNumber' },
  { title: '原状态', dataIndex: 'fromStatus', key: 'fromStatus' },
  { title: '新状态', dataIndex: 'toStatus', key: 'toStatus' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt' }
]

const noShowColumns = [
  { title: '单号', dataIndex: 'workOrderId', key: 'workOrderId' },
  { title: '客户', dataIndex: 'customerName', key: 'customerName' },
  { title: '手机号', dataIndex: 'customerPhone', key: 'customerPhone' },
  { title: '预约时间', dataIndex: 'appointmentTime', key: 'appointmentTime' },
  { title: '爽约原因', dataIndex: 'reason', key: 'reason' },
  { title: '处理人', dataIndex: 'handler', key: 'handler' },
  { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime' }
]

const exceptionColumns = [
  { title: '异常编号', dataIndex: 'id', key: 'id' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  { title: '关闭原因', dataIndex: 'solution', key: 'solution' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action' }
]

const loadData = async () => {
  if (!dateRange.value || dateRange.value.length < 2) return
  const params = {
    startDate: dateRange.value[0].format('YYYY-MM-DD'),
    endDate: dateRange.value[1].format('YYYY-MM-DD')
  }
  try {
    const [reportRes, statsRes] = await Promise.all([
      getQualityReport(params),
      getStatistics(params)
    ])
    statistics.value = statsRes
    renderTrendChart(reportRes.details || [])
    renderPieChart(reportRes)
  } catch (e) {
    message.error('加载数据失败')
  }
}

const loadTransitions = async () => {
  try {
    const res = await getTransitionList({
      page: transitionPagination.value.current || 1,
      pageSize: transitionPagination.value.pageSize || 10
    })
    transitionData.value = res.list
    transitionPagination.value.total = res.total
  } catch (e) {
    message.error('加载流转记录失败')
  }
}

const loadNoShows = async () => {
  try {
    const res = await getNoShowList({
      page: noShowPagination.value.current || 1,
      pageSize: noShowPagination.value.pageSize || 10
    })
    noShowData.value = res.list
    noShowPagination.value.total = res.total
  } catch (e) {
    message.error('加载爽约记录失败')
  }
}

const loadExceptions = async () => {
  try {
    const res = await getExceptionList({
      page: exceptionPagination.value.current || 1,
      pageSize: exceptionPagination.value.pageSize || 10
    })
    exceptionData.value = res.list
    exceptionPagination.value.total = res.total
  } catch (e) {
    message.error('加载异常记录失败')
  }
}

const renderTrendChart = (data: any[]) => {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '总单数', type: 'line', data: data.map(d => d.total), smooth: true },
      { name: '通过数', type: 'line', data: data.map(d => d.passed), smooth: true }
    ]
  })
}

const renderPieChart = (data: any) => {
  if (!pieChartRef.value) return
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: data.passed || 0, name: '已通过' },
        { value: data.failed || 0, name: '未通过' },
        { value: data.total - (data.passed || 0) - (data.failed || 0), name: '处理中' }
      ]
    }]
  })
}

const handleTransitionPageChange = (page: TablePaginationConfig) => {
  transitionPagination.value = page
  loadTransitions()
}

const handleNoShowPageChange = (page: TablePaginationConfig) => {
  noShowPagination.value = page
  loadNoShows()
}

const handleExceptionPageChange = (page: TablePaginationConfig) => {
  exceptionPagination.value = page
  loadExceptions()
}

const viewWorkOrder = (workOrderId?: number) => {
  if (workOrderId) {
    message.info(`查看工单: ${workOrderId}`)
  }
}

watch(activeTab, (key) => {
  if (key === 'transitions') loadTransitions()
  if (key === 'noShows') loadNoShows()
  if (key === 'exceptions') loadExceptions()
})

onMounted(() => {
  loadData()
  loadTransitions()
})
</script>
