import db from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import StockMovement from '#models/stock_movement'
import RestockAlert from '#models/restock_alert'
import ChangeLogService from './change_log_service.js'

export default class InventoryService {
  public static async stockIn(
    productId: number,
    quantity: number,
    operatorId: number,
    reason: string | null = null
  ) {
    return db.transaction(async (trx) => {
      const product = await Product.query({ client: trx })
        .forUpdate()
        .findOrFail(productId)

      const beforeStock = product.currentStock
      const afterStock = beforeStock + quantity

      product.currentStock = afterStock
      await product.useTransaction(trx).save()

      await StockMovement.create(
        {
          productId,
          type: 'in',
          quantity,
          beforeStock,
          afterStock,
          reason,
          operatorId,
        },
        { client: trx }
      )

      await ChangeLogService.logChange(
        'product',
        productId,
        'update',
        'currentStock',
        String(beforeStock),
        String(afterStock),
        operatorId,
        trx
      )

      await this.checkSafetyStock(product, operatorId, trx)

      return product
    })
  }

  public static async stockOut(
    productId: number,
    quantity: number,
    operatorId: number,
    reason: string | null = null,
    appointmentId: number | null = null
  ) {
    return db.transaction(async (trx) => {
      const product = await Product.query({ client: trx })
        .forUpdate()
        .findOrFail(productId)

      if (product.currentStock < quantity) {
        throw new Error(`库存不足: ${product.name} 当前库存 ${product.currentStock}, 需要出库 ${quantity}`)
      }

      const beforeStock = product.currentStock
      const afterStock = beforeStock - quantity

      product.currentStock = afterStock
      await product.useTransaction(trx).save()

      await StockMovement.create(
        {
          productId,
          type: 'out',
          quantity,
          beforeStock,
          afterStock,
          reason,
          operatorId,
          appointmentId,
        },
        { client: trx }
      )

      await ChangeLogService.logChange(
        'product',
        productId,
        'update',
        'currentStock',
        String(beforeStock),
        String(afterStock),
        operatorId,
        trx
      )

      await this.checkSafetyStock(product, operatorId, trx)

      return product
    })
  }

  public static async stockDamage(
    productId: number,
    quantity: number,
    operatorId: number,
    reason: string | null = null
  ) {
    return db.transaction(async (trx) => {
      const product = await Product.query({ client: trx })
        .forUpdate()
        .findOrFail(productId)

      if (product.currentStock < quantity) {
        throw new Error(`库存不足: ${product.name} 当前库存 ${product.currentStock}, 损坏数量 ${quantity}`)
      }

      const beforeStock = product.currentStock
      const afterStock = beforeStock - quantity

      product.currentStock = afterStock
      await product.useTransaction(trx).save()

      await StockMovement.create(
        {
          productId,
          type: 'damage',
          quantity,
          beforeStock,
          afterStock,
          reason: reason || '损耗/损坏',
          operatorId,
        },
        { client: trx }
      )

      await ChangeLogService.logChange(
        'product',
        productId,
        'update',
        'currentStock',
        String(beforeStock),
        String(afterStock),
        operatorId,
        trx
      )

      await this.checkSafetyStock(product, operatorId, trx)

      return product
    })
  }

  private static async checkSafetyStock(
    product: Product,
    userId: number,
    trx: any
  ) {
    if (product.currentStock <= product.safetyStock) {
      const existingAlert = await RestockAlert.query({ client: trx })
        .where('productId', product.id)
        .where('status', 'pending')
        .first()

      if (!existingAlert) {
        await RestockAlert.create(
          {
            productId: product.id,
            currentStock: product.currentStock,
            safetyStock: product.safetyStock,
            status: 'pending',
            notes: `库存 ${product.currentStock} 已低于安全库存 ${product.safetyStock}`,
            createdBy: userId,
          },
          { client: trx }
        )
      }
    }
  }

  public static async resolveRestockAlert(alertId: number, userId: number) {
    const alert = await RestockAlert.findOrFail(alertId)
    alert.status = 'resolved'
    alert.resolvedAt = DateTime.local()
    await alert.save()
    return alert
  }
}

import { DateTime } from 'luxon'
