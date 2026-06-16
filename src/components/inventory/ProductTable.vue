<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Filter, Plus } from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import StatusBadge from '@/components/common/StatusBadge.vue'

const productsStore = useProductsStore()

const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')

const categories = computed(() => [...new Set(productsStore.products.map((p) => p.category))])

const filteredProducts = computed(() => {
  return productsStore.products.filter((p) => {
    const matchSearch = !searchQuery.value ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = !categoryFilter.value || p.category === categoryFilter.value
    const matchStatus = !statusFilter.value || p.status === statusFilter.value
    return matchSearch && matchCategory && matchStatus
  })
})

const statusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  normal: 'success',
  low: 'warning',
  out: 'danger',
  overstock: 'default',
}
const statusLabelMap: Record<string, string> = {
  normal: '正常',
  low: '不足',
  out: '断货',
  overstock: '积压',
}
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 overflow-hidden">
    <div class="p-4 border-b border-rosegold/10 space-y-3">
      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-sm">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayrose/50" />
          <input
            v-model="searchQuery"
            placeholder="搜索产品名称/品牌..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite"
          />
        </div>
        <select
          v-model="categoryFilter"
          class="px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite text-grayrose"
        >
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select
          v-model="statusFilter"
          class="px-3 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite text-grayrose"
        >
          <option value="">全部状态</option>
          <option value="normal">正常</option>
          <option value="low">不足</option>
          <option value="out">断货</option>
          <option value="overstock">积压</option>
        </select>
      </div>
    </div>
    <div class="overflow-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-rosegold/10 bg-warmwhite">
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">产品名称</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">分类</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">品牌</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">规格</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">当前库存</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">最低库存</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-grayrose">单价</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">位置</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in filteredProducts"
            :key="product.id"
            class="border-b border-rosegold/5 hover:bg-rosegold/[0.02] transition-colors"
          >
            <td class="px-4 py-3 text-sm font-medium text-gray-800">{{ product.name }}</td>
            <td class="px-4 py-3 text-sm text-grayrose">{{ product.category }}</td>
            <td class="px-4 py-3 text-sm text-grayrose">{{ product.brand }}</td>
            <td class="px-4 py-3 text-sm text-grayrose">{{ product.specification }}</td>
            <td class="px-4 py-3 text-sm text-center font-medium" :class="product.currentStock <= product.minStock ? 'text-coral' : 'text-gray-800'">
              {{ product.currentStock }}{{ product.unit }}
            </td>
            <td class="px-4 py-3 text-sm text-center text-grayrose">{{ product.minStock }}{{ product.unit }}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-800">¥{{ product.unitPrice }}</td>
            <td class="px-4 py-3 text-center">
              <StatusBadge :variant="statusVariantMap[product.status]" :label="statusLabelMap[product.status]" />
            </td>
            <td class="px-4 py-3 text-sm text-grayrose">{{ product.location }}</td>
          </tr>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="9" class="px-4 py-12 text-center text-sm text-grayrose/50">暂无产品数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
