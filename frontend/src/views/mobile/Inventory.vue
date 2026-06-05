<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div class="font-medium text-gray-800 mb-3">盘点任务</div>
      <div v-if="checks.length === 0" class="text-center text-gray-400 py-4">
        暂无盘点任务
      </div>
      <div v-for="check in checks" :key="check.id" class="p-3 bg-gray-50 rounded-lg mb-2">
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium">{{ check.check_number }}</span>
          <el-tag size="small">{{ check.status }}</el-tag>
        </div>
        <div class="text-xs text-gray-500">创建时间：{{ formatDate(check.created_at) }}</div>
        <el-button type="primary" link size="small" @click="selectCheck(check)" class="mt-2 p-0">
          开始盘点
        </el-button>
      </div>
    </div>
    
    <div v-if="selectedCheck" class="bg-white rounded-xl p-4 shadow-sm">
      <div class="font-medium text-gray-800 mb-3">
        正在盘点：{{ selectedCheck.check_number }}
      </div>
      <div class="flex gap-2 mb-3">
        <el-button size="small" @click="$router.push('/m/scan')">
          <el-icon class="mr-1"><QRCode /></el-icon>
          扫码添加
        </el-button>
      </div>
      <div class="space-y-2">
        <div v-for="(item, idx) in inventoryItems" :key="idx" class="p-3 border rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium">{{ item.reagent_name }}</div>
              <div class="text-xs text-gray-500">批号：{{ item.batch_number }}</div>
            </div>
            <el-input-number v-model="item.actual_quantity" :min="0" size="small" />
          </div>
          <div class="flex items-center gap-2 mt-2">
            <div class="text-xs text-gray-500">系统：{{ item.expected_quantity }}</div>
            <div class="text-xs" :class="item.difference !== 0 ? 'text-red-500' : 'text-green-500'">
              差异：{{ item.difference }}
            </div>
          </div>
        </div>
      </div>
      <el-button type="primary" class="w-full mt-4" @click="submitCheck">
        提交盘点结果
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { QRCode } from '@element-plus/icons-vue'

const checks = ref<any[]>([])
const selectedCheck = ref<any>(null)
const inventoryItems = ref<any[]>([])

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function loadChecks() {
  try {
    const data = await api.get('/inventory/checks?limit=20') as any
    checks.value = data.items || data || []
  } catch (e) {
    console.error(e)
  }
}

function selectCheck(check: any) {
  selectedCheck.value = check
  inventoryItems.value = [
    { reagent_name: '无水乙醇', batch_number: 'B2024001', expected_quantity: 500, actual_quantity: 500, difference: 0 },
    { reagent_name: '三氯甲烷', batch_number: 'B2024002', expected_quantity: 200, actual_quantity: 180, difference: -20 }
  ]
}

function submitCheck() {
  ElMessage.success('盘点结果已提交')
  selectedCheck.value = null
}

onMounted(() => {
  loadChecks()
})
</script>
