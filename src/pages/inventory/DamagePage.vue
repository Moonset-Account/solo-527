<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import DamageForm from '@/components/inventory/DamageForm.vue'

const productsStore = useProductsStore()
const showDamageForm = ref(false)

onMounted(async () => {
  if (productsStore.products.length === 0) {
    await productsStore.fetchProducts()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">报损登记</h1>
      <button
        class="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-coral rounded-lg hover:bg-coral/90 transition-colors"
        @click="showDamageForm = true"
      >
        <Plus class="w-4 h-4" />
        新增报损
      </button>
    </div>
    <div class="bg-white rounded-xl border border-rosegold/10 p-6">
      <div class="space-y-4">
        <div
          v-for="movement in productsStore.movements.filter((m) => m.type === 'damage')"
          :key="movement.id"
          class="flex items-center justify-between p-4 bg-warmwhite rounded-lg"
        >
          <div>
            <p class="text-sm font-medium text-gray-800">{{ movement.productName }}</p>
            <p class="text-xs text-grayrose mt-1">{{ movement.reason }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-coral">-{{ movement.quantity }}</p>
            <p class="text-xs text-grayrose/50">{{ movement.createdAt }}</p>
          </div>
        </div>
        <div v-if="productsStore.movements.filter((m) => m.type === 'damage').length === 0" class="text-center py-8 text-sm text-grayrose/50">
          暂无报损记录
        </div>
      </div>
    </div>
    <DamageForm v-model:visible="showDamageForm" @close="showDamageForm = false" />
  </div>
</template>
