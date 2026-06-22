<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      colorClass,
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
}>()

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
  planned: { label: '已排产', color: 'bg-blue-50 text-blue-700' },
  in_progress: { label: '进行中', color: 'bg-accent/10 text-accent' },
  completed: { label: '已完成', color: 'bg-green-50 text-green-700' },
  picked_up: { label: '已取货', color: 'bg-purple-50 text-purple-700' },
  scrapped: { label: '已报废', color: 'bg-red-50 text-red-600' },
  cancelled: { label: '已取消', color: 'bg-red-50 text-red-600' },
  open: { label: '打开', color: 'bg-red-50 text-red-600' },
  handling: { label: '处理中', color: 'bg-accent/10 text-accent' },
  processing: { label: '处理中', color: 'bg-accent/10 text-accent' },
  resolved: { label: '已解决', color: 'bg-green-50 text-green-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
  low: { label: '低', color: 'bg-green-50 text-green-700' },
  medium: { label: '中', color: 'bg-yellow-50 text-yellow-700' },
  high: { label: '高', color: 'bg-orange-50 text-orange-600' },
  critical: { label: '严重', color: 'bg-red-50 text-red-600' },
  cost_spike: { label: '成本飙升', color: 'bg-red-50 text-red-600' },
  low_stock: { label: '低库存', color: 'bg-orange-50 text-orange-600' },
  high_scrap: { label: '高报损', color: 'bg-red-50 text-red-600' },
  over_cost: { label: '成本超支', color: 'bg-red-50 text-red-600' },
  frequent_rework: { label: '频繁返工', color: 'bg-orange-50 text-orange-600' },
  budget_exceeded: { label: '超预算', color: 'bg-red-50 text-red-600' },
  inbound: { label: '入库', color: 'bg-green-50 text-green-700' },
  outbound: { label: '出库', color: 'bg-blue-50 text-blue-700' },
  waste: { label: '报损', color: 'bg-red-50 text-red-600' },
  adjustment: { label: '调整', color: 'bg-yellow-50 text-yellow-700' },
}

const matched = computed(() => statusMap[props.status] || { label: props.status, color: 'bg-gray-100 text-gray-700' })
const label = computed(() => matched.value.label)
const colorClass = computed(() => matched.value.color)
</script>
