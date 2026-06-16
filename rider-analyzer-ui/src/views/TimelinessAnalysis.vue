<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
      <el-select v-model="nodeType" placeholder="节点类型" clearable style="width: 160px">
        <el-option label="接单" value="ACCEPT" />
        <el-option label="取货" value="PICKUP" />
        <el-option label="配送" value="DELIVER" />
        <el-option label="签收" value="SIGN" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Search /></el-icon>查询
      </el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="14">
        <el-card>
          <template #header>各节点超时分布</template>
          <v-chart class="chart-container" :option="barOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>超时原因占比</template>
          <v-chart class="chart-container" :option="pieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>超时订单明细</template>
      <el-table :data="timeoutOrders" stripe size="small">
        <el-table-column prop="orderNo" label="订单号" width="170" />
        <el-table-column prop="nodeType" label="节点类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.nodeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planTime" label="计划时间" width="170" />
        <el-table-column prop="actualTime" label="实际时间" width="170" />
        <el-table-column prop="timeoutMinutes" label="超时(分钟)" width="110" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">{{ row.timeoutMinutes }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadData"
        @size-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getTimeoutNodes, getNodeStats } from '../api/timeliness'
import dayjs from 'dayjs'

use([BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const dateRange = ref([dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const nodeType = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const barData = ref({ nodes: [], values: [] })
const pieData = ref([])
const timeoutOrders = ref([])

const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: barData.value.nodes },
  yAxis: { type: 'value', name: '超时次数' },
  series: [{
    type: 'bar',
    data: barData.value.values,
    itemStyle: {
      color: params => {
        const colors = ['#409eff', '#e6a23c', '#f56c6c', '#909399']
        return colors[params.dataIndex % colors.length]
      },
      borderRadius: [4, 4, 0, 0]
    },
    barWidth: '40%'
  }]
}))

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '0%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}: {d}%' },
    data: pieData.value
  }]
}))

async function loadData() {
  const params = {
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
    nodeType: nodeType.value,
    page: page.value,
    pageSize: pageSize.value
  }
  try {
    const [nodesRes, statsRes] = await Promise.all([getTimeoutNodes(params), getNodeStats(params)])
    const nodesData = nodesRes.data
    timeoutOrders.value = nodesData?.list || []
    total.value = nodesData?.total || 0
    const statsData = statsRes.data
    barData.value = { nodes: statsData?.nodes || [], values: statsData?.barValues || [] }
    pieData.value = statsData?.pieData || []
  } catch {
    barData.value = {
      nodes: ['接单', '取货', '配送', '签收'],
      values: [12, 25, 38, 8]
    }
    pieData.value = [
      { value: 35, name: '交通拥堵', itemStyle: { color: '#f56c6c' } },
      { value: 25, name: '商家出餐慢', itemStyle: { color: '#e6a23c' } },
      { value: 20, name: '地址异常', itemStyle: { color: '#409eff' } },
      { value: 12, name: '骑手不足', itemStyle: { color: '#909399' } },
      { value: 8, name: '其他', itemStyle: { color: '#67c23a' } }
    ]
    timeoutOrders.value = [
      { orderNo: 'ORD-20260615001', nodeType: '取货', planTime: '2026-06-15 10:30', actualTime: '2026-06-15 11:05', timeoutMinutes: 35 },
      { orderNo: 'ORD-20260615002', nodeType: '配送', planTime: '2026-06-15 11:30', actualTime: '2026-06-15 12:20', timeoutMinutes: 50 },
      { orderNo: 'ORD-20260615003', nodeType: '签收', planTime: '2026-06-15 12:00', actualTime: '2026-06-15 12:25', timeoutMinutes: 25 },
      { orderNo: 'ORD-20260614004', nodeType: '接单', planTime: '2026-06-14 09:00', actualTime: '2026-06-14 09:12', timeoutMinutes: 12 },
      { orderNo: 'ORD-20260614005', nodeType: '配送', planTime: '2026-06-14 14:00', actualTime: '2026-06-14 14:45', timeoutMinutes: 45 }
    ]
    total.value = 5
  }
}

onMounted(loadData)
</script>
