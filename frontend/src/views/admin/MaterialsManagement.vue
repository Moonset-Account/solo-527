<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">材料库存</h2>
      <div class="flex gap-2">
        <button @click="handleExport" class="btn btn-secondary">
          📥 导出库存
        </button>
        <button @click="showStockIn = true" class="btn btn-primary">
          + 入库
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">总 SKU 数</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ packages.length }}</p>
          </div>
          <div class="text-4xl">📦</div>
        </div>
      </div>
      <div class="card p-5 bg-green-50 border-green-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-600 text-sm">库存正常</p>
            <p class="text-3xl font-bold text-green-700 mt-1">{{ normalCount }}</p>
          </div>
          <div class="text-4xl">✅</div>
        </div>
      </div>
      <div class="card p-5 bg-amber-50 border-amber-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-amber-600 text-sm">库存预警</p>
            <p class="text-3xl font-bold text-amber-700 mt-1">{{ lowStockCount }}</p>
          </div>
          <div class="text-4xl">⚠️</div>
        </div>
      </div>
      <div class="card p-5 bg-red-50 border-red-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-600 text-sm">已售罄</p>
            <p class="text-3xl font-bold text-red-700 mt-1">{{ outOfStockCount }}</p>
          </div>
          <div class="text-4xl">🚫</div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">材料包</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">成本价</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">售价</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="pkg in packages" :key="pkg.id" class="hover:bg-gray-50">
              <td class="px-4 py-4">
                <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{{ pkg.sku }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      :src="getMaterialImage(pkg.sku, pkg.id)"
                      :alt="pkg.name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div class="font-medium text-gray-800">{{ pkg.name }}</div>
                    <div class="text-xs text-gray-500 line-clamp-1">{{ pkg.description }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">¥{{ pkg.cost_price }}</td>
              <td class="px-4 py-4 text-sm font-medium text-gray-800">¥{{ pkg.sale_price }}</td>
              <td class="px-4 py-4">
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span :class="['badge', getStatusBadge(pkg.status)]">{{ getStatusLabel(pkg.status) }}</span>
                    <span class="text-sm text-gray-500">
                      可用: <span :class="{'text-red-600 font-bold': getAvailableQty(pkg) <= pkg.safety_stock, 'text-green-600 font-bold': getAvailableQty(pkg) > pkg.safety_stock}">
                        {{ getAvailableQty(pkg) }}
                      </span>
                      / {{ pkg.stock_quantity }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="getStockBarClass(pkg)"
                      :style="{ width: getStockPercentage(pkg) + '%' }"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-400">
                    预留: {{ pkg.reserved_quantity }} · 安全库存: {{ pkg.safety_stock }}
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex gap-2">
                  <button
                    @click="openStockIn(pkg)"
                    class="text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded hover:bg-green-50"
                  >
                    入库
                  </button>
                  <button
                    @click="openStockOut(pkg)"
                    class="text-orange-600 hover:text-orange-700 text-sm font-medium px-2 py-1 rounded hover:bg-orange-50"
                    :disabled="getAvailableQty(pkg) <= 0"
                  >
                    出库
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showStockIn" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-6">{{ editingPackage ? '材料入库' : '新增材料入库' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">材料包</label>
            <select v-model="selectedPackageId" class="form-input" :disabled="!!editingPackage">
              <option :value="null">请选择材料包</option>
              <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">
                {{ pkg.name }} (当前可用: {{ getAvailableQty(pkg) }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">入库数量</label>
            <input v-model.number="stockQuantity" type="number" min="1" class="form-input" placeholder="请输入数量" />
          </div>
          <div v-if="selectedPackage" class="p-3 bg-gray-50 rounded-xl">
            <div class="text-sm text-gray-600">
              <p>SKU: {{ selectedPackage.sku }}</p>
              <p>当前库存: {{ selectedPackage.stock_quantity }}</p>
              <p>入库后库存: {{ selectedPackage.stock_quantity + (stockQuantity || 0) }}</p>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showStockIn = false; editingPackage = null" class="btn btn-secondary flex-1">取消</button>
          <button @click="confirmStockIn" class="btn btn-primary flex-1" :disabled="!selectedPackageId || !stockQuantity || stockQuantity <= 0">
            确认入库
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { materialAPI } from '../../utils/api'
import { getMaterialImage } from '../../utils/images'
import { MaterialPackageStatus } from '../../types'
import type { MaterialPackage } from '../../types'

const packages = ref<MaterialPackage[]>([])
const showStockIn = ref(false)
const editingPackage = ref<MaterialPackage | null>(null)
const selectedPackageId = ref<number | null>(null)
const stockQuantity = ref(1)

const selectedPackage = computed(() => packages.value.find(p => p.id === selectedPackageId.value) || null)

const normalCount = computed(() => packages.value.filter(p => p.status === MaterialPackageStatus.ACTIVE).length)
const lowStockCount = computed(() => packages.value.filter(p => p.status === MaterialPackageStatus.LOW_STOCK).length)
const outOfStockCount = computed(() => packages.value.filter(p => p.status === MaterialPackageStatus.OUT_OF_STOCK).length)

const getAvailableQty = (pkg: MaterialPackage) => pkg.stock_quantity - pkg.reserved_quantity

const getStatusLabel = (status: MaterialPackageStatus) => {
  const labels: Record<MaterialPackageStatus, string> = {
    [MaterialPackageStatus.ACTIVE]: '库存正常',
    [MaterialPackageStatus.LOW_STOCK]: '库存低',
    [MaterialPackageStatus.OUT_OF_STOCK]: '已售罄',
    [MaterialPackageStatus.DISCONTINUED]: '已停用'
  }
  return labels[status]
}

const getStatusBadge = (status: MaterialPackageStatus) => {
  const badges: Record<MaterialPackageStatus, string> = {
    [MaterialPackageStatus.ACTIVE]: 'badge-success',
    [MaterialPackageStatus.LOW_STOCK]: 'badge-warning',
    [MaterialPackageStatus.OUT_OF_STOCK]: 'badge-danger',
    [MaterialPackageStatus.DISCONTINUED]: 'badge-secondary'
  }
  return badges[status]
}

const getStockPercentage = (pkg: MaterialPackage) => {
  const total = pkg.stock_quantity + pkg.reserved_quantity
  if (total === 0) return 0
  return Math.min(100, (getAvailableQty(pkg) / Math.max(pkg.safety_stock * 2, 1)) * 100)
}

const getStockBarClass = (pkg: MaterialPackage) => {
  const available = getAvailableQty(pkg)
  if (available <= 0) return 'bg-red-500'
  if (available <= pkg.safety_stock) return 'bg-amber-500'
  return 'bg-green-500'
}

const loadPackages = async () => {
  try {
    const res = await materialAPI.list({ per_page: 100 })
    packages.value = res.material_packages || []
  } catch (e) {
    console.error('加载库存失败', e)
  }
}

const openStockIn = (pkg?: MaterialPackage) => {
  if (pkg) {
    editingPackage.value = pkg
    selectedPackageId.value = pkg.id
  } else {
    editingPackage.value = null
    selectedPackageId.value = null
  }
  stockQuantity.value = 1
  showStockIn.value = true
}

const openStockOut = async (pkg: MaterialPackage) => {
  const qty = prompt(`请输入 ${pkg.name} 的出库数量（当前可用 ${getAvailableQty(pkg)}）`)
  if (!qty) return
  const num = parseInt(qty)
  if (isNaN(num) || num <= 0 || num > getAvailableQty(pkg)) {
    alert('数量无效')
    return
  }
  try {
    await materialAPI.stockOut(pkg.id, num)
    await loadPackages()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const confirmStockIn = async () => {
  if (!selectedPackageId.value || !stockQuantity.value || stockQuantity.value <= 0) return
  try {
    await materialAPI.stockIn(selectedPackageId.value, stockQuantity.value)
    showStockIn.value = false
    editingPackage.value = null
    await loadPackages()
  } catch (e: any) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const handleExport = async () => {
  try {
    const blob = await materialAPI.export()
    const url = URL.createObjectURL(blob as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `材料库存_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败', e)
    alert('导出失败')
  }
}

onMounted(() => {
  loadPackages()
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
