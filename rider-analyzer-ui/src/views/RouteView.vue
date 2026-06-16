<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card>
          <template #header>订单信息</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="收件人">{{ orderInfo.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ orderInfo.address }}</el-descriptions-item>
            <el-descriptions-item label="骑手">{{ orderInfo.riderName }}</el-descriptions-item>
            <el-descriptions-item label="承诺时间">{{ orderInfo.promiseTime }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>配送节点时间轴</template>
          <el-timeline>
            <el-timeline-item
              v-for="node in timelineNodes"
              :key="node.time"
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
          <template #header>预计耗时</template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="预计总耗时">{{ routeInfo.totalTime }}</el-descriptions-item>
            <el-descriptions-item label="已用时间">{{ routeInfo.elapsedTime }}</el-descriptions-item>
            <el-descriptions-item label="剩余时间">{{ routeInfo.remainingTime }}</el-descriptions-item>
            <el-descriptions-item label="距离">{{ routeInfo.distance }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getRouteInfo } from '../api/order'

use([LineChart, TitleComponent, TooltipComponent, GridComponent, CanvasRenderer])

const route = useRoute()
const orderId = route.params.id

const orderInfo = ref({
  orderNo: '',
  receiverName: '',
  address: '',
  riderName: '',
  promiseTime: ''
})

const timelineNodes = ref([])
const routeInfo = ref({
  totalTime: '',
  elapsedTime: '',
  remainingTime: '',
  distance: ''
})

const routePoints = ref([])

const routeChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  grid: { left: '5%', right: '5%', bottom: '10%', top: '10%' },
  xAxis: { type: 'value', name: '经度', min: val => (val.min - 0.01), max: val => (val.max + 0.01) },
  yAxis: { type: 'value', name: '纬度', min: val => (val.min - 0.01), max: val => (val.max + 0.01) },
  series: [{
    type: 'line',
    data: routePoints.value,
    smooth: true,
    symbolSize: 10,
    lineStyle: { width: 3, color: '#409eff' },
    itemStyle: { color: '#409eff' },
    label: { show: true, formatter: params => params.data[2] || '', position: 'top', fontSize: 11 }
  }]
}))

async function loadData() {
  try {
    const res = await getRouteInfo(orderId)
    const data = res.data
    orderInfo.value = data.orderInfo || orderInfo.value
    timelineNodes.value = data.timeline || []
    routeInfo.value = data.routeInfo || routeInfo.value
    routePoints.value = data.points || []
  } catch {
    orderInfo.value = {
      orderNo: `ORD-${orderId}`,
      receiverName: '张三',
      address: '朝阳区建国路88号',
      riderName: '骑手A',
      promiseTime: '2026-06-16 14:00'
    }
    timelineNodes.value = [
      { time: '2026-06-16 10:00', label: '商家接单', type: 'primary' },
      { time: '2026-06-16 10:15', label: '骑手到店', type: 'primary' },
      { time: '2026-06-16 10:30', label: '取货出发', type: 'primary' },
      { time: '2026-06-16 11:00', label: '配送中', type: 'warning' },
      { time: '2026-06-16 11:30', label: '已送达', type: 'success' }
    ]
    routeInfo.value = {
      totalTime: '90分钟',
      elapsedTime: '60分钟',
      remainingTime: '30分钟',
      distance: '8.5km'
    }
    routePoints.value = [
      [116.48, 39.92, '站点'],
      [116.46, 39.93, '商家'],
      [116.44, 39.94, '中转1'],
      [116.42, 39.95, '中转2'],
      [116.40, 39.96, '目的地']
    ]
  }
}

onMounted(loadData)
</script>
