<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'

const emit = defineEmits<{ close: [] }>()
const productsStore = useProductsStore()

const productId = ref('')
const quantity = ref(1)
const reason = ref('')
const isSubmitting = ref(false)

const availableProducts = computed(() => productsStore.products.filter((p) => p.currentStock > 0))

async function handleSubmit() {
  if (!productId.value || quantity.value <= 0 || !reason.value) return
  isSubmitting.value = true
  await productsStore.reportDamage(productId.value, quantity.value, reason.value)
  isSubmitting.value = false
  emit('close')
}

const visible = defineModel<boolean>('visible', { default: false })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="visible = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-base font-medium text-gray-900">报损登记</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="visible = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">选择产品</label>
              <select
                v-model="productId"
                required
                class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite"
              >
                <option value="">请选择产品</option>
                <option v-for="p in availableProducts" :key="p.id" :value="p.id">
                  {{ p.name }} (库存: {{ p.currentStock }}{{ p.unit }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">报损数量</label>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">报损原因</label>
              <textarea
                v-model="reason"
                rows="3"
                required
                placeholder="请描述报损原因..."
                class="w-full px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite resize-none"
              />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="visible = false"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm text-white bg-coral rounded-lg hover:bg-coral/90 transition-colors disabled:opacity-50"
              >
                {{ isSubmitting ? '提交中...' : '确认报损' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
