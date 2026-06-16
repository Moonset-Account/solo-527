<script setup lang="ts">
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, RotateCcw } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import StatusBadge from '@/components/common/StatusBadge.vue'

const productsStore = useProductsStore()

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  in: { icon: ArrowDownCircle, color: 'text-mint', bg: 'bg-mint/10', label: '入库' },
  out: { icon: ArrowUpCircle, color: 'text-rosegold', bg: 'bg-rosegold/10', label: '出库' },
  damage: { icon: AlertTriangle, color: 'text-coral', bg: 'bg-coral/10', label: '报损' },
  return: { icon: RotateCcw, color: 'text-amber-500', bg: 'bg-amber-50', label: '退货' },
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="movement in productsStore.movements"
      :key="movement.id"
      class="flex items-start gap-4 p-4 bg-white rounded-xl border border-rosegold/10 hover:border-rosegold/20 transition-colors"
    >
      <div
        :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', typeConfig[movement.type]?.bg]"
      >
        <component :is="typeConfig[movement.type]?.icon" :class="['w-5 h-5', typeConfig[movement.type]?.color]" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-800">{{ movement.productName }}</span>
          <StatusBadge
            :variant="movement.type === 'damage' ? 'danger' : movement.type === 'in' ? 'success' : movement.type === 'return' ? 'warning' : 'info'"
            :label="typeConfig[movement.type]?.label || movement.type"
          />
        </div>
        <p class="text-xs text-grayrose mt-1">{{ movement.reason }}</p>
        <div class="flex items-center gap-3 mt-2 text-xs text-grayrose/70">
          <span>数量: {{ movement.quantity }}</span>
          <span>·</span>
          <span>{{ movement.beforeStock }} → {{ movement.afterStock }}</span>
          <span>·</span>
          <span>操作人: {{ movement.operator }}</span>
        </div>
      </div>
      <span class="text-xs text-grayrose/50 whitespace-nowrap">{{ movement.createdAt }}</span>
    </div>
    <div v-if="productsStore.movements.length === 0" class="text-center py-12 text-sm text-grayrose/50">
      暂无出入库记录
    </div>
  </div>
</template>
