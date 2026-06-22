<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-bark">成本异常</h2>
      <button class="btn-accent text-sm" @click="handleDetect" :disabled="detecting">
        {{ detecting ? '检测中...' : '异常检测' }}
      </button>
    </div>

    <FilterBar>
      <select v-model="filters.status" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部状态</option>
        <option value="open">打开</option>
        <option value="handling">处理中</option>
        <option value="resolved">已解决</option>
      </select>
      <select v-model="filters.severity" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部严重度</option>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <select v-model="filters.type" class="rounded-btn border border-brand/20 px-3 py-1.5 text-sm">
        <option value="">全部类型</option>
        <option value="cost_spike">成本飙升</option>
        <option value="low_stock">低库存</option>
        <option value="high_scrap">高报损</option>
        <option value="over_cost">成本超支</option>
        <option value="frequent_rework">频繁返工</option>
        <option value="budget_exceeded">超预算</option>
      </select>
    </FilterBar>

    <DataTable
      :columns="columns"
      :data="anomalyStore.list"
      :clickable="true"
      @row-click="goDetail"
    >
      <template #type="{ row }">
        <StatusBadge :status="row.type" />
      </template>
      <template #severity="{ row }">
        <StatusBadge :status="row.severity" />
      </template>
      <template #status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { useAnomalyStore } from '@/stores/anomaly'
import { formatDateTime } from '@/lib/utils'

const router = useRouter()
const anomalyStore = useAnomalyStore()
const detecting = ref(false)

const filters = ref({
  status: '',
  severity: '',
  type: '',
})

const columns = [
  { key: 'type', label: '类型' },
  { key: 'severity', label: '严重度' },
  { key: 'ingredientName', label: '原料' },
  { key: 'description', label: '描述' },
  { key: 'status', label: '状态' },
  { key: 'responsiblePerson', label: '负责人' },
  { key: 'createdAt', label: '创建时间', sortable: true },
]

const goDetail = (row: any) => {
  router.push(`/anomalies/${row._id}`)
}

const handleDetect = async () => {
  detecting.value = true
  try {
    await anomalyStore.detect()
  } finally {
    detecting.value = false
  }
}

watch(filters, () => {
  const params: Record<string, unknown> = {}
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.severity) params.severity = filters.value.severity
  if (filters.value.type) params.type = filters.value.type
  anomalyStore.loadList(params)
}, { deep: true })

onMounted(() => {
  anomalyStore.loadList()
})
</script>
