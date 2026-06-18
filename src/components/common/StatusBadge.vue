<script setup lang="ts">
import { computed } from 'vue'
import type { LeadStatus } from '@/types'

const props = defineProps<{
  status: LeadStatus
}>()

const statusMap: Record<LeadStatus, { label: string; class: string }> = {
  new: { label: '新线索', class: 'bg-blue-100 text-blue-700' },
  contacted: { label: '已联系', class: 'bg-amber-100 text-amber-700' },
  measured: { label: '已量房', class: 'bg-cyan-100 text-cyan-700' },
  quoted: { label: '已报价', class: 'bg-purple-100 text-purple-700' },
  contracted: { label: '已签约', class: 'bg-emerald-100 text-emerald-700' },
  lost: { label: '已流失', class: 'bg-red-100 text-red-700' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, class: 'bg-slate-100 text-slate-700' })
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :class="info.class"
  >
    {{ info.label }}
  </span>
</template>
