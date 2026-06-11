<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: String,
})

const statusMap = {
  unpaid: { label: '未支付', classes: 'bg-red-100 text-red-800' },
  partial: { label: '部分支付', classes: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '已支付', classes: 'bg-green-100 text-green-800' },
}

const current = computed(() => statusMap[props.status] || { label: props.status, classes: 'bg-gray-100 text-gray-800' })
</script>

<template>
  <span :class="current.classes" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
    {{ current.label }}
  </span>
</template>
