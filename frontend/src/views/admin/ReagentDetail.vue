<template>
  <div class="space-y-6">
    <el-page-header @back="$router.back()" :content="reagent?.name || '试剂详情'" />
    
    <el-card v-if="reagent" shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-lg font-medium">基本信息</div>
          <el-tag :class="`bg-hazard-level-${reagent.hazard_level?.toLowerCase()}`">
            {{ hazardText(reagent.hazard_level) }}
          </el-tag>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div class="text-sm text-gray-500">CAS号</div>
          <div class="font-medium">{{ reagent.cas_number || '-' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">分类</div>
          <div class="font-medium">{{ reagent.category || '-' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">单位</div>
          <div class="font-medium">{{ reagent.unit }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">最低库存</div>
          <div class="font-medium">{{ reagent.min_stock }} {{ reagent.unit }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">总库存</div>
          <div class="font-medium" :class="{ 'text-orange-500': reagent.total_quantity <= reagent.min_stock }">
            {{ reagent.total_quantity || 0 }} {{ reagent.unit }}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-500">双人确认</div>
          <div class="font-medium">
            <el-tag v-if="reagent.requires_double_confirm" type="danger" size="small">是</el-tag>
            <span v-else class="text-gray-400">否</span>
          </div>
        </div>
      </div>
      <div v-if="reagent.description" class="mt-4">
        <div class="text-sm text-gray-500 mb-1">描述</div>
        <div>{{ reagent.description }}</div>
      </div>
    </el-card>
    
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-lg font-medium">库存批次</div>
          <el-button type="primary" size="small" @click="$router.push('/m/stock-in')">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增批次
          </el-button>
        </div>
      </template>
      <el-table :data="batches" border>
        <el-table-column prop="batch_number" label="批号" width="150" />
        <el-table-column prop="quantity" label="入库量" width="100" />
        <el-table-column prop="remaining_quantity" label="剩余量" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-red-500 font-medium': row.remaining_quantity <= 0 }">
              {{ row.remaining_quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="过期日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-red-500 font-medium': isExpiring(row.expiry_date) }">
              {{ row.expiry_date }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="存放柜位">
          <template #default="{ row }">
            {{ row.storage_cabinet?.code }} - {{ row.storage_cabinet?.location }}
          </template>
        </el-table-column>
        <el-table-column prop="barcode" label="条码" width="150" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import { Plus } from '@element-plus/icons-vue'

const route = useRoute()
const reagent = ref<any>(null)
const batches = ref<any[]>([])

function hazardText(level: string) {
  const map: Record<string, string> = {
    NONE: '无危害',
    LOW: '低危',
    MEDIUM: '中危',
    HIGH: '高危',
    EXTREME: '极危'
  }
  return map[level] || level
}

function isExpiring(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff <= 30
}

async function loadData() {
  try {
    const id = route.params.id
    const [reagentData, batchesData] = await Promise.all([
      api.get(`/reagents/${id}`),
      api.get(`/reagents/${id}/batches`)
    ]) as any[]
    reagent.value = reagentData
    batches.value = batchesData.items || batchesData || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>
