import { v4 as uuidv4 } from 'uuid'
import type { ReturnOrder } from '../mock-data.js'

export function generateId(): string {
  return uuidv4()
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateReturnOrder(order: Partial<ReturnOrder>): ValidationResult {
  const errors: string[] = []

  if (!order.orderId) errors.push('orderId is required')
  if (!order.userHashId) errors.push('userHashId is required')
  if (!order.productId) errors.push('productId is required')
  if (!order.shopId) errors.push('shopId is required')
  if (!order.reasonId) errors.push('reasonId is required')
  if (!order.applyAt) errors.push('applyAt is required')
  if (order.refundAmount !== undefined && order.refundAmount < 0) errors.push('refundAmount must be non-negative')

  if (order.applyAt && order.qualityCheckAt) {
    if (new Date(order.qualityCheckAt) < new Date(order.applyAt)) {
      errors.push('qualityCheckAt must be after applyAt')
    }
  }
  if (order.qualityCheckAt && order.approveAt) {
    if (new Date(order.approveAt) < new Date(order.qualityCheckAt)) {
      errors.push('approveAt must be after qualityCheckAt')
    }
  }
  if (order.approveAt && order.refundAt) {
    if (new Date(order.refundAt) < new Date(order.approveAt)) {
      errors.push('refundAt must be after approveAt')
    }
  }

  return { isValid: errors.length === 0, errors }
}

export function handleMissingValues(order: Partial<ReturnOrder>): ReturnOrder {
  const now = new Date().toISOString()
  return {
    id: order.id ?? generateId(),
    orderId: order.orderId ?? `RET-UNKNOWN-${generateId().slice(0, 8)}`,
    userHashId: order.userHashId ?? 'user-unknown',
    productId: order.productId ?? 'prod-unknown',
    shopId: order.shopId ?? 'shop-unknown',
    reasonId: order.reasonId ?? 'reason-unknown',
    warehouseId: order.warehouseId ?? 'wh-unknown',
    logisticsId: order.logisticsId ?? 'log-unknown',
    csStaffId: order.csStaffId ?? 'cs-unknown',
    applyAt: order.applyAt ?? now,
    qualityCheckAt: order.qualityCheckAt ?? null,
    approveAt: order.approveAt ?? null,
    refundAt: order.refundAt ?? null,
    refundAmount: order.refundAmount ?? 0,
    status: order.status ?? 'pending',
    csNote: order.csNote ?? '',
    geoPoint: order.geoPoint ?? { lng: 0, lat: 0 },
    isAnomaly: order.isAnomaly ?? false,
  }
}

export function verifyCaliber(order: ReturnOrder): ReturnOrder {
  const anomalyFlags: boolean[] = []

  const productPrice = 100
  if (order.refundAmount > productPrice) {
    anomalyFlags.push(true)
  }

  if (order.applyAt && order.refundAt) {
    const cycleDays = (new Date(order.refundAt).getTime() - new Date(order.applyAt).getTime()) / 86400000
    if (cycleDays > 15) anomalyFlags.push(true)
  }

  return {
    ...order,
    isAnomaly: order.isAnomaly || anomalyFlags.length > 0,
  }
}

export function cleanOrder(raw: Partial<ReturnOrder>): ReturnOrder {
  const filled = handleMissingValues(raw)
  const validated = validateReturnOrder(filled)
  if (!validated.isValid) {
    console.warn(`Order ${filled.orderId} validation warnings: ${validated.errors.join(', ')}`)
  }
  return verifyCaliber(filled)
}

export function cleanBatch(orders: Partial<ReturnOrder>[]): ReturnOrder[] {
  return orders.map(cleanOrder)
}
