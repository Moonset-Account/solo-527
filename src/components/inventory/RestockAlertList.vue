<script setup lang="ts">
import { ShoppingCart, Truck, CheckCircle, XCircle } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { ref } from 'vue'

const productsStore = useProductsStore()
const confirmDialog = ref()
const selectedAlertId = ref('')
const selectedAction = ref<'ordered' | 'received' | 'ignored'>('ordered')

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50', label: '待处理' },
  ordered: { icon: Truck, color: 'text-rosegold', bg: 'bg-rosegold/10', label: '已下单' },
  received: { icon: CheckCircle, color: 'text-mint', bg: 'bg-mint/10', label: '已到货' },
  ignored: { icon: XCircle, color: 'text-grayrose', bg: 'bg-gray-100', label: '已忽略' },
}

function handleAction(alertId: string, action: 'ordered' | 'received' | 'ignored') {
  selectedAlertId.value = alertId
  selectedAction.value = action
  const messages: Record<string, string> = {
    ordered: '确认将该补货提醒标记为已下单？',
    received: '确认已收到货物？库存将自动更新。',
    ignored: '确认忽略该补货提醒？',
  }
  confirmDialog.value?.open()
}

function onConfirm() {
  productsStore.updateRestockStatus(selectedAlertId.value, selectedAction.value)
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="alert in productsStore.restockAlerts"
      :key="alert.id"
      class="bg-white rounded-xl border border-rosegold/10 p-5"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-medium text-gray-800">{{ alert.productName }}</h4>
            <span
              :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[alert.status]?.bg, statusConfig[alert.status]?.color]"
            >
              <component :is="statusConfig[alert.status]?.icon" class="w-3 h-3" />
              {{ statusConfig[alert.status]?.label }}
            </span>
          </div>
          <div class="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-grayrose">当前库存</span>
              <p class="font-medium text-coral">{{ alert.currentStock }}</p>
            </div>
            <div>
              <span class="text-grayrose">建议补货</span>
              <p class="font-medium text-gray-800">{{ alert.suggestedQuantity }}</p>
            </div>
            <div>
              <span class="text-grayrose">预计费用</span>
              <p class="font-medium text-gray-800">¥{{ alert.estimatedCost.toLocaleString() }}</p>
            </div>
          </div>
          <p class="mt-2 text-xs text-grayrose/70">供应商: {{ alert.supplier }} · 创建于 {{ alert.createdAt }}</p>
        </div>
        <div v-if="alert.status === 'pending'" class="flex items-center gap-2 ml-4">
          <button
            class="px-3 py-1.5 text-xs text-white bg-rosegold rounded-lg hover:bg-rosegold/90 transition-colors"
            @click="handleAction(alert.id, 'ordered')"
          >
            标记下单
          </button>
          <button
            class="px-3 py-1.5 text-xs text-white bg-coral/80 rounded-lg hover:bg-coral/70 transition-colors"
            @click="handleAction(alert.id, 'ignored')"
          >
            忽略
          </button>
        </div>
        <div v-else-if="alert.status === 'ordered'" class="flex items-center gap-2 ml-4">
          <button
            class="px-3 py-1.5 text-xs text-white bg-mint rounded-lg hover:bg-mint/90 transition-colors"
            @click="handleAction(alert.id, 'received')"
          >
            确认到货
          </button>
        </div>
      </div>
    </div>
    <div v-if="productsStore.restockAlerts.length === 0" class="text-center py-12 text-sm text-grayrose/50">
      暂无补货提醒
    </div>
    <ConfirmDialog ref="confirmDialog" title="操作确认" :message="'确认执行此操作？'" @confirm="onConfirm" />
  </div>
</template>
