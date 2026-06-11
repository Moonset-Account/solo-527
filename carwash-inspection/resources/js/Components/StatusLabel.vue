<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: String,
})

const statusMap = {
  pending: { label: '待确认', classes: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', classes: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '进行中', classes: 'bg-indigo-100 text-indigo-800' },
  completed: { label: '已完成', classes: 'bg-green-100 text-green-800' },
  no_show: { label: '爽约', classes: 'bg-red-100 text-red-800' },
  cancelled: { label: '已取消', classes: 'bg-gray-100 text-gray-800' },
  paid: { label: '已支付', classes: 'bg-emerald-100 text-emerald-800' },
}

const current = computed(() => statusMap[props.status] || { label: props.status, classes: 'bg-gray-100 text-gray-800' })
</script>

<template>
  <span :class="current.classes" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
    {{ current.label }}
  </span>
</template>
