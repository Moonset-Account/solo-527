<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import RestockAlertList from '@/components/inventory/RestockAlertList.vue'

const productsStore = useProductsStore()

onMounted(async () => {
  if (productsStore.restockAlerts.length === 0) {
    await productsStore.fetchRestockAlerts()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">补货提醒</h1>
      <span class="text-sm text-grayrose">{{ productsStore.restockAlerts.filter((a) => a.status === 'pending').length }} 条待处理</span>
    </div>
    <RestockAlertList />
  </div>
</template>
