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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card p-4">
        <div class="text-gray-500 text-sm mb-1">总 SKU 数</div>
        <div class="text-2xl font-bold text-gray-800">{{ packages.length }}</div>
      </div>
      <div class="card p-4 bg-amber-50 border-amber-200">
        <div class="text-amber-600 text-sm mb-1">库存预警</div>
        <div class="text-2xl font-bold text-amber-700">{{ lowStockCount }}</div>
      </div>
      <div class="card p-4 bg-red-50 border-red-200">
        <div class="text-red-600 text-sm mb-1">已售罄</div>
        <div class="text-2xl font-bold text-red-700">{{ outOfStockCount }}</div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">成本价</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">售价</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">预留</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="pkg in packages" :key="pkg.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ pkg.sku }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-800">{{ pkg.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">¥{{ pkg.cost_price }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">¥{{ pkg.sale_price }}</td>
              <td class="px-4 py-3">
                <span class="text-sm font-medium" :class="pkg.stock_quantity <= pkg.safety_stock ? 'text-red-600' : 'text-gray-800'">
                  {{ pkg.stock_quantity }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ pkg.reserved_quantity }}</td>
              <td class="px-4 py-3">
                <span :class="['badge', getStatusBadge(pkg.status)]">{{ getStatusLabel(pkg.status) }}</span>
              </td>
              <td class="px-4 py-3">
                <button @click="openStockIn(pkg)" class="text-green-600 hover:text-green-700 text-sm mr-2">
                  入库
                </button>
                <button @click="openStockOut(pkg)" class="text-orange-600 hover:text-orange-700 text-sm">
                  出库
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showStockIn" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-bold mb-4">材料入库</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">材料包</label>
          <select v-model="selectedPackageId" class="form-input" :disabled="selectedPackageId !== null">
            <option :value="null">请选择</option>
            <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">{{ pkg.name }}</option>
          </select>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">入库数量</label>
          <input v-model.number="stockQuantity" type="number" min="1" class="form-input" placeholder="请输入数量" />
        </div>
        <div class="flex gap-3">
          <button @click="showStockIn = false" class="btn btn-secondary flex-1">取消</button>
          <button @click="confirmStockIn" class="btn btn-primary flex-1">确认入库</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { materialAPI } from '../../utils/api'
import type { MaterialPackage, MaterialPackageStatus } from '../../types'

const packages = ref<MaterialPackage[]>([])
const showStockIn = ref(false)
const selectedPackageId = ref<number | null>(null)
const stockQuantity = ref(1)

const lowStockCount = computed(() => packages.value.filter(p => p.status === MaterialPackageStatus.LOW_STOCK).length)
const outOfStockCount = computed(() => packages.value.filter(p => p.status === MaterialPackageStatus.OUT_OF_STOCK).length)

const getStatusLabel = (status: MaterialPackageStatus) => {
  const labels: Record<MaterialPackageStatus, string> = {
    [MaterialPackageStatus.ACTIVE]: '正常',
    [MaterialPackageStatus.LOW_STOCK]: '库存低',
    [MaterialPackageStatus.OUT_OF_STOCK]: '售罄',
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

const loadPackages = async () => {
  try {
    const res = await materialAPI.list({ per_page: 100 })
    packages.value = res.material_packages
  } catch (e) {
    console.error(e)
  }
}

const openStockIn = (pkg?: MaterialPackage) => {
  selectedPackageId.value = pkg?.id || null
  stockQuantity.value = 1
  showStockIn.value = true
}

const openStockOut = (pkg: MaterialPackage) => {
  const qty = prompt('请输入出库数量')
  if (!qty) return
  materialAPI.stockOut(pkg.id, parseInt(qty)).then(() => loadPackages())
}

const confirmStockIn = async () => {
  if (!selectedPackageId.value || stockQuantity.value <= 0) return
  try {
    await materialAPI.stockIn(selectedPackageId.value, stockQuantity.value)
    showStockIn.value = false
    loadPackages()
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
    console.error(e)
  }
}

onMounted(() => {
  loadPackages()
})
</script>
