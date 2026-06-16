<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import StockMovementList from '@/components/inventory/StockMovementList.vue'

const productsStore = useProductsStore()

onMounted(async () => {
  if (productsStore.movements.length === 0) {
    await productsStore.fetchMovements()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">出入库记录</h1>
      <span class="text-sm text-grayrose">共 {{ productsStore.movements.length }} 条记录</span>
    </div>
    <StockMovementList />
  </div>
</template>
