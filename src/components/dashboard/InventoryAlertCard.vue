<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ArrowRight } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import { useRouter } from 'vue-router'

const productsStore = useProductsStore()
const router = useRouter()

const lowStockItems = computed(() => productsStore.lowStockProducts.slice(0, 5))
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-5 h-5 text-coral" />
        <h3 class="text-sm font-medium text-gray-800">库存预警</h3>
      </div>
      <span class="text-xs text-coral bg-coral/10 px-2 py-0.5 rounded-full">{{ lowStockItems.length }} 项</span>
    </div>
    <div v-if="lowStockItems.length === 0" class="text-center py-6 text-sm text-grayrose/50">
      暂无预警
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="item in lowStockItems"
        :key="item.id"
        class="flex items-center justify-between p-3 rounded-lg bg-warmwhite"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ item.name }}</p>
          <p class="text-xs text-grayrose mt-0.5">
            当前 <span class="text-coral font-medium">{{ item.currentStock }}</span> / 最低 {{ item.minStock }}{{ item.unit }}
          </p>
        </div>
        <span
          :class="[
            'px-2 py-0.5 rounded text-xs font-medium',
            item.status === 'out' ? 'bg-coral/10 text-coral' : 'bg-amber-50 text-amber-600',
          ]"
        >
          {{ item.status === 'out' ? '断货' : '不足' }}
        </span>
      </div>
    </div>
    <button
      class="w-full mt-4 flex items-center justify-center gap-1 text-sm text-rosegold hover:text-rosegold/80 transition-colors"
      @click="router.push('/inventory/restock')"
    >
      查看全部 <ArrowRight class="w-4 h-4" />
    </button>
  </div>
</template>
