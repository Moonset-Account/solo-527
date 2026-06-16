<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import ProductTable from '@/components/inventory/ProductTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const productsStore = useProductsStore()

onMounted(async () => {
  if (productsStore.products.length === 0) {
    await productsStore.fetchProducts()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">库存列表</h1>
      <span class="text-sm text-grayrose">共 {{ productsStore.totalProducts }} 种产品</span>
    </div>
    <ProductTable />
  </div>
</template>
