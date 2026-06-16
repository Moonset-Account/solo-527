<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card>
          <template #header>订单信息</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="收件人">{{ orderInfo.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ orderInfo.receiverAddress }}</el-descriptions-item>
            <el-descriptions-item label="骑手">{{ riderName }}</el-descriptions-item>
            <el-descriptions-item label="承诺时间">{{ formatTime(orderInfo.promiseTime) }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="statusTagType(orderInfo.status)" size="small">{{ statusLabel }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>配送节点时间轴</template>
          <el-timeline>
            <el-timeline-item
              v-for="node in timelineNodes"
              :key="node.label"
              :timestamp="node.time"
              :type="node.type"
              placement="top"
            >
              {{ node.label }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <template #header>配送路线</template>
          <v-chart class="chart-container" :option="routeChartOption" autoresize />
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>配送时效</template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="下单时间">{{ formatTime(orderInfo.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="承诺时效">{{ formatTime(orderInfo.promiseTime) }}</el-descriptions-item>
            <el-descriptions-item label="已用时间">{{ elapsedTimeText }}</el-descriptions-item>
            <el-descriptions-item label="剩余时间">{{ remainingTimeText }}</el-descriptions-item>
            <el-descriptions-item label="预计距离">{{ distance }}km</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusTagType(orderInfo.status)" size="small">{{ statusLabel }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getRouteInfo } from '../api/order'
import dayjs from 'dayjs'

use([LineChart, TitleComponent, TooltipComponent, GridComponent, CanvasRenderer])

const route = useRoute()
const orderId = route.params.id

const orderInfo = ref({})
const riderName = ref('-')
const timelineNodes = ref([])
const routePoints = ref([])
const distance = ref(8.5)

const statusLabel = computed(() => {
  const map = {
    PENDING: '待接单', ACCEPTED: '已接单', PICKED_UP: '已取货',
    DELIVERING: '配送中', SIGNED: '已签收', EXCEPTION: '异常'
  }
  return map[orderInfo.value.status] || orderInfo.value.status
})

function statusTagType(status) {
  const map = {
    PENDING: 'info', ACCEPTED: '', PICKED_UP: 'warning',
    DELIVERING: 'primary', SIGNED: 'success', EXCEPTION: 'danger'
  }
  return map[status] || ''
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

function buildTimeline(order) {
  const nodes = []
  if (order.signTime) {
    nodes.push({ time: formatTime(order.signTime), label: '已签收', type: 'success' })
  }
  if (order.deliverTime) {
    nodes.push({ time: formatTime(order.deliverTime), label: '配送中', type: 'primary' })
  }
  if (order.pickupTime) {
    nodes.push({ time: formatTime(order.pickupTime), label: '取货出发', type: 'primary' })
  }
  if (order.acceptTime) {
    nodes.push({ time: formatTime(order.acceptTime), label: '骑手接单', type: 'primary' })
  }
  if (order.createTime) {
    nodes.push({ time: formatTime(order.createTime), label: '系统派单', type: 'info' })
  }
  return nodes
}

const elapsedTimeText = computed(() => {
  if (!orderInfo.value.createTime) return '-'
  const end = orderInfo.value.signTime || dayjs()
  const diff = dayjs(end).diff(dayjs(orderInfo.value.createTime), 'minute')
  if (diff < 60) return `${diff}分钟`
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return `${hours}小时${mins}分钟`
})

const remainingTimeText = computed(() => {
  if (!orderInfo.value.promiseTime) return '-'
  if (orderInfo.value.status === 'SIGNED') return '已完成'
  const diff = dayjs(orderInfo.value.promiseTime).diff(dayjs(), 'minute')
  if (diff <= 0) return '已超时'
  if (diff < 60) return `${diff}分钟`
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return `${hours}小时${mins}分钟`
})

const routeChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  grid: { left: '5%', right: '5%', bottom: '10%', top: '10%' },
  xAxis: { 
    type: 'value', 
    name: '经度', 
    min: val => (val.min - 0.01), 
    max: val => (val.max + 0.01) 
  },
  yAxis: { 
    type: 'value', 
    name: '纬度', 
    min: val => (val.min - 0.01), 
    max: val => (val.max + 0.01) 
  },
  series: [{
    type: 'line',
    data: routePoints.value,
    smooth: true,
    symbolSize: 10,
    lineStyle: { width: 3, color: '#409eff' },
    itemStyle: { color: '#409eff' },
    label: { 
      show: true, 
      formatter: params => params.data[2] || '', 
      position: 'top', 
      fontSize: 11 
    }
  }]
}))

async function loadData() {
  try {
    const res = await getRouteInfo(orderId)
    const data = res.data
    orderInfo.value = data
    timelineNodes.value = buildTimeline(data)
    routePoints.value = generateRoutePoints(data)
  } catch (e) {
    console.error('路线信息加载失败', e)
  }
}

function generateRoutePoints(order) {
  const baseLng = 116.48
  const baseLat = 39.92
  const points = [
    [baseLng, baseLat, '站点'],
    [baseLng - 0.02, baseLat + 0.01, '商家'],
    [baseLng - 0.04, baseLat + 0.02, '中转']
  ]
  
  if (order.status === 'PICKED_UP' || order.status === 'DELIVERING' || order.status === 'SIGNED') {
    points.push([baseLng - 0.06, baseLat + 0.03, '途中'])
  }
  if (order.status === 'DELIVERING' || order.status === 'SIGNED') {
    points.push([baseLng - 0.07, baseLat + 0.04, '配送中'])
  }
  if (order.status === 'SIGNED') {
    points.push([baseLng - 0.08, baseLat + 0.04, '目的地'])
  }
  
  if (points.length < 5) {
    points.push([baseLng - 0.08, baseLat + 0.04, '目的地'])
  }
  
  return points
}

onMounted(loadData)
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.chart-container {
  height: 320px;
}
</style>
