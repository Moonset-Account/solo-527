import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, StockMovement, RestockAlert } from '@/types'
import api from '@/api'

const mockProducts: Product[] = [
  { id: '1', name: '甲油胶-经典红', category: '甲油胶', brand: 'OPI', specification: '15ml', unit: '瓶', currentStock: 45, minStock: 10, maxStock: 100, unitPrice: 68, costPrice: 28, location: 'A-01', status: 'normal', createdAt: '2026-01-10', updatedAt: '2026-06-01' },
  { id: '2', name: '甲油胶-裸粉', category: '甲油胶', brand: 'OPI', specification: '15ml', unit: '瓶', currentStock: 8, minStock: 10, maxStock: 80, unitPrice: 68, costPrice: 28, location: 'A-02', status: 'low', createdAt: '2026-01-10', updatedAt: '2026-06-01' },
  { id: '3', name: '光疗胶-透明', category: '光疗胶', brand: 'CND', specification: '30ml', unit: '瓶', currentStock: 0, minStock: 5, maxStock: 50, unitPrice: 128, costPrice: 52, location: 'B-01', status: 'out', createdAt: '2026-02-01', updatedAt: '2026-06-01' },
  { id: '4', name: '亮片-金色碎片', category: '装饰', brand: '美甲小屋', specification: '5g', unit: '罐', currentStock: 60, minStock: 15, maxStock: 50, unitPrice: 25, costPrice: 8, location: 'C-01', status: 'overstock', createdAt: '2026-01-15', updatedAt: '2026-06-01' },
  { id: '5', name: '卸甲水-温和型', category: '护理', brand: 'Duri', specification: '120ml', unit: '瓶', currentStock: 22, minStock: 10, maxStock: 60, unitPrice: 45, costPrice: 18, location: 'D-01', status: 'normal', createdAt: '2026-03-01', updatedAt: '2026-06-01' },
  { id: '6', name: '甲片-法式短款', category: '甲片', brand: 'KISS', specification: '100片/盒', unit: '盒', currentStock: 3, minStock: 8, maxStock: 40, unitPrice: 35, costPrice: 12, location: 'E-01', status: 'low', createdAt: '2026-01-20', updatedAt: '2026-06-01' },
  { id: '7', name: '底胶-防脱落', category: '甲油胶', brand: 'CND', specification: '15ml', unit: '瓶', currentStock: 30, minStock: 10, maxStock: 80, unitPrice: 88, costPrice: 35, location: 'A-03', status: 'normal', createdAt: '2026-02-10', updatedAt: '2026-06-01' },
  { id: '8', name: '封层-高亮', category: '甲油胶', brand: 'OPI', specification: '15ml', unit: '瓶', currentStock: 15, minStock: 10, maxStock: 60, unitPrice: 78, costPrice: 32, location: 'A-04', status: 'normal', createdAt: '2026-02-15', updatedAt: '2026-06-01' },
]

const mockMovements: StockMovement[] = [
  { id: '1', productId: '1', productName: '甲油胶-经典红', type: 'in', quantity: 20, beforeStock: 25, afterStock: 45, operator: '张经理', reason: '常规采购', createdAt: '2026-06-15 09:30:00' },
  { id: '2', productId: '2', productName: '甲油胶-裸粉', type: 'out', quantity: 5, beforeStock: 13, afterStock: 8, operator: '李顾问', reason: '预约消耗', relatedId: 'APT-001', createdAt: '2026-06-15 11:20:00' },
  { id: '3', productId: '3', productName: '光疗胶-透明', type: 'out', quantity: 5, beforeStock: 5, afterStock: 0, operator: '王顾问', reason: '预约消耗', relatedId: 'APT-002', createdAt: '2026-06-14 15:00:00' },
  { id: '4', productId: '4', productName: '亮片-金色碎片', type: 'damage', quantity: 3, beforeStock: 63, afterStock: 60, operator: '张经理', reason: '过期变质', createdAt: '2026-06-14 10:00:00' },
  { id: '5', productId: '1', productName: '甲油胶-经典红', type: 'return', quantity: 2, beforeStock: 43, afterStock: 45, operator: '李顾问', reason: '顾客退货', createdAt: '2026-06-13 16:30:00' },
]

const mockRestockAlerts: RestockAlert[] = [
  { id: '1', productId: '2', productName: '甲油胶-裸粉', currentStock: 8, minStock: 10, suggestedQuantity: 30, estimatedCost: 840, supplier: 'OPI官方代理', status: 'pending', createdAt: '2026-06-15' },
  { id: '2', productId: '3', productName: '光疗胶-透明', currentStock: 0, minStock: 5, suggestedQuantity: 20, estimatedCost: 1040, supplier: 'CND中国', status: 'pending', createdAt: '2026-06-14' },
  { id: '3', productId: '6', productName: '甲片-法式短款', currentStock: 3, minStock: 8, suggestedQuantity: 15, estimatedCost: 180, supplier: 'KISS授权店', status: 'ordered', createdAt: '2026-06-13' },
]

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const movements = ref<StockMovement[]>([])
  const restockAlerts = ref<RestockAlert[]>([])
  const isLoading = ref(false)

  const lowStockProducts = computed(() => products.value.filter((p) => p.status === 'low' || p.status === 'out'))
  const totalProducts = computed(() => products.value.length)

  async function fetchProducts() {
    isLoading.value = true
    try {
      const res = await api.get('/products')
      products.value = res.data
    } catch {
      products.value = mockProducts
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMovements() {
    isLoading.value = true
    try {
      const res = await api.get('/stock-movements')
      movements.value = res.data
    } catch {
      movements.value = mockMovements
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRestockAlerts() {
    isLoading.value = true
    try {
      const res = await api.get('/restock-alerts')
      restockAlerts.value = res.data
    } catch {
      restockAlerts.value = mockRestockAlerts
    } finally {
      isLoading.value = false
    }
  }

  async function reportDamage(productId: string, quantity: number, reason: string) {
    try {
      await api.post('/stock-movements/damage', { productId, quantity, reason })
    } catch {
      const product = products.value.find((p) => p.id === productId)
      if (product) {
        const movement: StockMovement = {
          id: `DMG-${Date.now()}`,
          productId,
          productName: product.name,
          type: 'damage',
          quantity,
          beforeStock: product.currentStock,
          afterStock: product.currentStock - quantity,
          operator: '当前用户',
          reason,
          createdAt: new Date().toISOString(),
        }
        movements.value.unshift(movement)
        product.currentStock -= quantity
        if (product.currentStock <= 0) product.status = 'out'
        else if (product.currentStock < product.minStock) product.status = 'low'
      }
    }
  }

  async function updateRestockStatus(alertId: string, status: RestockAlert['status']) {
    try {
      await api.patch(`/restock-alerts/${alertId}`, { status })
    } catch {
      const alert = restockAlerts.value.find((a) => a.id === alertId)
      if (alert) alert.status = status
    }
  }

  return {
    products, movements, restockAlerts, isLoading,
    lowStockProducts, totalProducts,
    fetchProducts, fetchMovements, fetchRestockAlerts,
    reportDamage, updateRestockStatus,
  }
})
