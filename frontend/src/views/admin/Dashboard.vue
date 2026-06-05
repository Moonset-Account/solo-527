<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <el-card shadow="hover" class="text-center">
        <div class="text-3xl font-bold text-blue-500">{{ dashboard.overview?.total_reagents || 0 }}</div>
        <div class="text-gray-500 mt-2">试剂种类</div>
      </el-card>
      <el-card shadow="hover" class="text-center">
        <div class="text-3xl font-bold text-green-500">{{ dashboard.overview?.total_batches || 0 }}</div>
        <div class="text-gray-500 mt-2">库存批次</div>
      </el-card>
      <el-card shadow="hover" class="text-center">
        <div class="text-3xl font-bold text-orange-500">{{ dashboard.overview?.low_stock || 0 }}</div>
        <div class="text-gray-500 mt-2">低库存预警</div>
      </el-card>
      <el-card shadow="hover" class="text-center">
        <div class="text-3xl font-bold text-red-500">{{ dashboard.overview?.expiring_soon || 0 }}</div>
        <div class="text-gray-500 mt-2">即将过期</div>
      </el-card>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <el-card shadow="hover">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">危险等级分布</span>
          </div>
        </template>
        <div class="h-64">
          <v-chart :option="hazardChartOption" autoresize />
        </div>
      </el-card>
      
      <el-card shadow="hover">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">快速统计</span>
          </div>
        </template>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span class="text-gray-600">待审批领用</span>
            <span class="font-bold text-orange-500">{{ dashboard.overview?.pending_requisitions || 0 }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <span class="text-gray-600">待双人确认</span>
            <span class="font-bold text-red-500">{{ dashboard.overview?.pending_confirmations || 0 }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span class="text-gray-600">本月领用数</span>
            <span class="font-bold text-blue-500">{{ dashboard.overview?.requisitions_this_month || 0 }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-600">盘点任务数</span>
            <span class="font-bold text-gray-700">{{ dashboard.overview?.inventory_checks || 0 }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <el-card shadow="hover">
        <template #header>
          <span class="font-medium">低库存预警</span>
          <el-button type="primary" link @click="$router.push('/reagents')">查看全部</el-button>
        </template>
        <el-table :data="dashboard.low_stock_items || []" size="small">
          <el-table-column prop="name" label="试剂名称" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="min_stock" label="最低库存" width="100" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link @click="$router.push(`/reagents/${row.id}`)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <el-card shadow="hover">
        <template #header>
          <span class="font-medium">即将过期</span>
          <el-button type="primary" link @click="$router.push('/reagents?expiring=true')">查看全部</el-button>
        </template>
        <el-table :data="dashboard.expiring_items || []" size="small">
          <el-table-column label="试剂名称">
            <template #default="{ row }">
              {{ row.reagent?.name }}
            </template>
          </el-table-column>
          <el-table-column prop="batch_number" label="批号" width="120" />
          <el-table-column prop="expiry_date" label="过期日期" width="120" />
          <el-table-column prop="remaining_quantity" label="剩余量" width="100" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import api from '@/api'

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

const dashboard = ref<any>({})

const hazardChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 16, fontWeight: 'bold' }
    },
    data: [
      { value: dashboard.value.hazard_distribution?.none || 0, name: '无危害', itemStyle: { color: '#909399' } },
      { value: dashboard.value.hazard_distribution?.low || 0, name: '低危', itemStyle: { color: '#67c23a' } },
      { value: dashboard.value.hazard_distribution?.medium || 0, name: '中危', itemStyle: { color: '#e6a23c' } },
      { value: dashboard.value.hazard_distribution?.high || 0, name: '高危', itemStyle: { color: '#f56c6c' } },
      { value: dashboard.value.hazard_distribution?.extreme || 0, name: '极危', itemStyle: { color: '#c00000' } }
    ]
  }]
}))

async function loadDashboard() {
  try {
    dashboard.value = await api.get('/reports/dashboard')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadDashboard()
})
</script>
