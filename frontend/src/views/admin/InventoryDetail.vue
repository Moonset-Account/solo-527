<template>
  <div class="space-y-6">
    <el-page-header @back="$router.back()" content="盘点详情" />
    <el-card shadow="hover" v-if="check">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-medium">{{ check.check_number }}</span>
          <el-tag>{{ statusText(check.status) }}</el-tag>
        </div>
      </template>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <div class="text-sm text-gray-500">盘点类型</div>
          <div class="font-medium">{{ check.type === 'FULL' ? '全盘' : '抽盘' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">差异数</div>
          <div class="font-medium" :class="{ 'text-red-500': check.discrepancies_count > 0 }">
            {{ check.discrepancies_count || 0 }}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-500">创建时间</div>
          <div class="font-medium">{{ formatDate(check.created_at) }}</div>
        </div>
      </div>
    </el-card>
    
    <el-card shadow="hover">
      <template #header>
        <span class="text-lg font-medium">盘点明细</span>
      </template>
      <el-table :data="check?.items || []" border>
        <el-table-column label="试剂名称">
          <template #default="{ row }">
            {{ row.reagent_batch?.reagent?.name }}
          </template>
        </el-table-column>
        <el-table-column label="批号" width="120">
          <template #default="{ row }">
            {{ row.reagent_batch?.batch_number }}
          </template>
        </el-table-column>
        <el-table-column prop="expected_quantity" label="系统数量" width="120" />
        <el-table-column prop="actual_quantity" label="实际数量" width="120" />
        <el-table-column prop="difference" label="差异" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-red-500': row.difference !== 0, 'text-green-500': row.difference === 0 }">
              {{ row.difference }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="是否匹配" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_matched ? 'success' : 'danger'" size="small">
              {{ row.is_matched ? '是' : '否' }}
            </el-tag>
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

const route = useRoute()
const check = ref<any>(null)

function statusText(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadData() {
  try {
    check.value = await api.get(`/inventory/checks/${route.params.id}`)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>
