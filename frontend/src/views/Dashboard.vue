<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :lg="6" v-for="item in statistics" :key="item.label">
        <div class="stat-card" :style="{ borderTopColor: item.color }">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">{{ item.label }}</p>
              <p class="stat-value">{{ item.value }}</p>
              <p class="stat-trend" :class="item.trend! >= 0 ? 'up' : 'down'" v-if="item.trend !== undefined">
                <el-icon><CaretTop v-if="item.trend! >= 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(item.trend!) }}% 较上周
              </p>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
              <el-icon :size="32"><component :is="item.icon" /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <el-radio-group v-model="lineType" size="small">
                <el-radio-button label="sales">销售额</el-radio-button>
                <el-radio-button label="visitors">访客量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="lineOption" autoresize />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>分类占比</span>
          </template>
          <v-chart class="chart" :option="pieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>月度营收与利润</span>
          </template>
          <v-chart class="chart" :option="barOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { StatisticItem } from '@/api'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const lineType = ref('sales')

const statistics = ref<StatisticItem[]>([
  { label: '总销售额', value: '￥126,560', icon: 'Money', color: '#409EFF', trend: 12.5 },
  { label: '访问量', value: '88,462', icon: 'View', color: '#67C23A', trend: 8.2 },
  { label: '订单数', value: '6,560', icon: 'ShoppingCart', color: '#E6A23C', trend: -3.1 },
  { label: '新增用户', value: '1,280', icon: 'UserFilled', color: '#F56C6C', trend: 15.8 }
])

const lineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['销售额', '访客量'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '销售额',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#409EFF' },
      data: [8200, 9320, 9010, 9340, 12900, 13300, 13200]
    },
    {
      name: '访客量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#67C23A' },
      data: [2200, 1820, 1910, 2340, 2900, 3300, 3100]
    }
  ]
}))

const pieOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: [
        { value: 1048, name: '电子产品', itemStyle: { color: '#409EFF' } },
        { value: 735, name: '服装鞋包', itemStyle: { color: '#67C23A' } },
        { value: 580, name: '食品饮料', itemStyle: { color: '#E6A23C' } },
        { value: 484, name: '家居用品', itemStyle: { color: '#F56C6C' } },
        { value: 300, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }
  ]
}

const barOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['营收', '利润'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  },
  yAxis: { type: 'value', axisLabel: { formatter: '{value} 万' } },
  series: [
    {
      name: '营收',
      type: 'bar',
      barWidth: '30%',
      itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] },
      data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]
    },
    {
      name: '利润',
      type: 'bar',
      barWidth: '30%',
      itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
      data: [60, 72, 51, 74, 45, 120, 110, 92, 101, 134, 160, 185]
    }
  ]
}
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  border-top: 3px solid #409EFF;
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.stat-icon {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  width: 100%;
  height: 320px;
}
</style>
