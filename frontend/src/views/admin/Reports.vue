<template>
  <div class="space-y-6">
    <el-card shadow="hover">
      <template #header>
        <div class="text-lg font-medium">库存报表</div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">总价值(估算)</div>
          <div class="text-2xl font-bold text-blue-600">¥ {{ inventoryReport?.total_value?.toLocaleString() || 0 }}</div>
        </div>
        <div class="p-4 bg-green-50 rounded-lg">
          <div class="text-sm text-gray-600">试剂种类</div>
          <div class="text-2xl font-bold text-green-600">{{ inventoryReport?.by_category?.length || 0 }} 类</div>
        </div>
        <div class="p-4 bg-purple-50 rounded-lg">
          <div class="text-sm text-gray-600">柜位使用</div>
          <div class="text-2xl font-bold text-purple-600">{{ inventoryReport?.by_cabinet?.length || 0 }} 个</div>
        </div>
      </div>
    </el-card>
    
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-medium">按分类统计</span>
          <el-button type="primary" link @click="exportData">导出Excel</el-button>
        </div>
      </template>
      <el-table :data="inventoryReport?.by_category || []" border>
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="count" label="试剂数" width="120" />
        <el-table-column prop="total_quantity" label="总数量" width="150" />
        <el-table-column label="占比" width="150">
          <template #default="{ row }">
            <el-progress :percentage="Math.round((row.count / totalReagents) * 100)" :show-text="true" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card shadow="hover">
      <template #header>
        <span class="text-lg font-medium">按柜位统计</span>
      </template>
      <el-table :data="inventoryReport?.by_cabinet || []" border>
        <el-table-column label="柜位">
          <template #default="{ row }">
            {{ row.cabinet_code }} - {{ row.cabinet_location }}
          </template>
        </el-table-column>
        <el-table-column prop="batches_count" label="批次数量" width="120" />
        <el-table-column prop="total_quantity" label="总数量" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/api'

const inventoryReport = ref<any>(null)

const totalReagents = computed(() => {
  return inventoryReport.value?.by_category?.reduce((sum: number, c: any) => sum + c.count, 0) || 1
})

async function loadReport() {
  try {
    inventoryReport.value = await api.get('/reports/inventory-report')
  } catch (e) {
    console.error(e)
  }
}

function exportData() {
  window.open('/api/v1/reports/export/inventory', '_blank')
}

onMounted(() => {
  loadReport()
})
</script>
