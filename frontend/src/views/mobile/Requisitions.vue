<template>
  <div class="space-y-4">
    <div class="flex gap-2 overflow-x-auto pb-2">
      <el-button
        v-for="tab in tabs"
        :key="tab.value"
        :type="activeTab === tab.value ? 'primary' : 'default'"
        size="small"
        @click="activeTab = tab.value"
        class="flex-shrink-0"
      >
        {{ tab.label }}
      </el-button>
    </div>
    
    <div v-if="filteredRequisitions.length === 0" class="bg-white rounded-xl p-8 text-center text-gray-400">
      暂无记录
    </div>
    
    <div
      v-for="req in filteredRequisitions"
      :key="req.id"
      class="bg-white rounded-xl p-4 shadow-sm"
      @click="$router.push(`/requisitions/${req.id}`)"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="font-medium text-gray-800">{{ req.requisition_number }}</span>
        <el-tag size="small" :class="`status-${req.status}`">
          {{ statusText(req.status) }}
        </el-tag>
      </div>
      <div class="text-sm text-gray-600 mb-2 line-clamp-2">{{ req.purpose }}</div>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>{{ req.items?.length || 0 }} 种试剂</span>
        <span>{{ formatDate(req.created_at) }}</span>
      </div>
      <div v-if="req.requires_double_confirm" class="mt-2">
        <div class="flex items-center gap-2">
          <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-red-500 transition-all"
              :style="{ width: getConfirmProgress(req) + '%' }"
            ></div>
          </div>
          <span class="text-xs text-gray-500">{{ getConfirmText(req) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待审批', value: 'PENDING' },
  { label: '已批准', value: 'APPROVED' },
  { label: '已领用', value: 'PICKED_UP' },
  { label: '已拒绝', value: 'REJECTED' }
]

const activeTab = ref('all')
const requisitions = ref<any[]>([])

const filteredRequisitions = computed(() => {
  if (activeTab.value === 'all') {
    return requisitions.value
  }
  return requisitions.value.filter(r => r.status === activeTab.value)
})

function statusText(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    PENDING_CONFIRM: '待确认',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
    PICKED_UP: '已领用',
    RETURNED: '已归还'
  }
  return map[status] || status
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getConfirmProgress(req: any) {
  let count = 0
  if (req.first_confirmer_id) count++
  if (req.second_confirmer_id) count++
  return count * 50
}

function getConfirmText(req: any) {
  let count = 0
  if (req.first_confirmer_id) count++
  if (req.second_confirmer_id) count++
  return `${count}/2 确认`
}

async function loadRequisitions() {
  try {
    const data = await api.get('/requisitions/my?limit=100') as any
    requisitions.value = data || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadRequisitions()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
