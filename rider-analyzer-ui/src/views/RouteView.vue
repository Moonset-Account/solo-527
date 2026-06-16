<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card>
          <template #header>订单信息</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="订单号">{{ routeData.orderInfo?.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="收件人">{{ routeData.orderInfo?.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ routeData.orderInfo?.receiverAddress }}</el-descriptions-item>
            <el-descriptions-item label="骑手">{{ routeData.orderInfo?.riderName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="承诺时间">{{ formatTime(routeData.orderInfo?.promiseTime) }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="statusTagType(routeData.orderInfo?.status)" size="small">
                {{ routeData.orderInfo?.statusLabel || routeData.orderInfo?.status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>配送节点时间轴</template>
          <el-timeline>
            <el-timeline-item
              v-for="node in routeData.timeline"
              :key="node.label + node.time"
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
            <el-descriptions-item label="下单时间">{{ formatTime(routeData.orderInfo?.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="承诺时效">{{ routeData.routeInfo?.totalTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="已用时间">{{ routeData.routeInfo?.elapsedTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="剩余时间">{{ routeData.routeInfo?.remainingTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预计距离">{{ routeData.routeInfo?.distance }}km</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusTagType(routeData.orderInfo?.status)" size="small">
                {{ routeData.orderInfo?.statusLabel || routeData.orderInfo?.status }}
              </el-tag>
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

const routeData = ref({
  orderInfo: {},
  timeline: [],
  routeInfo: {},
  points: []
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

const routeChartOption = computed(() => {
  const points = routeData.value.points || []
  const chartData = points.map(p => [p.lng, p.lat, p.label])
  return {
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
      data: chartData,
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
  }
})

async function loadData() {
  try {
    const res = await getRouteInfo(orderId)
    routeData.value = res.data
  } catch (e) {
    console.error('路线信息加载失败', e)
  }
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
