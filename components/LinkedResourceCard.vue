<template>
  <div class="card flex items-center gap-3 !p-4">
    <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBgClass]">
      <component :is="iconComponent" class="w-5 h-5" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">{{ displayTitle }}</p>
      <p v-if="displaySubtitle" class="text-xs text-gray-500 truncate">{{ displaySubtitle }}</p>
    </div>
    <span v-if="displayBadge" :class="['badge text-xs', badgeClass]">{{ displayBadge }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileText, CreditCard, Car } from 'lucide-vue-next'

const props = defineProps<{
  type: 'template' | 'payment' | 'vehicle'
  data: Record<string, any>
}>()

const typeConfig = {
  template: { icon: FileText, bg: 'bg-primary-100 text-primary-500' },
  payment: { icon: CreditCard, bg: 'bg-green-100 text-success' },
  vehicle: { icon: Car, bg: 'bg-amber-100 text-warning' },
}

const iconComponent = computed(() => typeConfig[props.type].icon)
const iconBgClass = computed(() => typeConfig[props.type].bg)

const displayTitle = computed(() => {
  if (props.type === 'template') return props.data.name || '未命名模板'
  if (props.type === 'payment') return props.data.orderNo || '未命名订单'
  return props.data.plateNumber || '未知车牌'
})

const displaySubtitle = computed(() => {
  if (props.type === 'template') return props.data.category || ''
  if (props.type === 'payment') return `¥${props.data.amount ?? 0}`
  return props.data.brand || ''
})

const displayBadge = computed(() => {
  return props.data.status || ''
})

const badgeClass = computed(() => {
  const s = props.data.status
  if (props.type === 'payment') {
    if (s === 'paid') return 'badge-paid'
    if (s === 'refunded') return 'badge-refunded'
    return 'badge-pending'
  }
  if (props.type === 'template') {
    if (s === 'active') return 'badge-completed'
    return 'badge-cancelled'
  }
  return 'badge-confirmed'
})
</script>
