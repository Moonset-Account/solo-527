import Reagent from '#models/reagent'
import ReagentBatch from '#models/reagent_batch'
import { CacheService } from '#services/cache_service'

export class InventoryService {
  private cacheService = new CacheService()

  async getStats() {
    const cacheKey = 'inventory:stats'
    const cached = await this.cacheService.get(cacheKey)
    if (cached) return cached

    const totalReagents = await Reagent.query().count('* as total').first()
    const lowStockReagents = await Reagent.query()
      .whereRaw('total_quantity <= warning_threshold')
      .count('* as total')
      .first()
    const controlledReagents = await Reagent.query()
      .where('is_controlled', true)
      .count('* as total')
      .first()
    const hazardousReagents = await Reagent.query()
      .whereIn('danger_level', ['hazardous', 'highly_hazardous'])
      .count('* as total')
      .first()

    const stats = {
      totalReagents: Number(totalReagents?.$extras.total ?? 0),
      lowStockCount: Number(lowStockReagents?.$extras.total ?? 0),
      controlledCount: Number(controlledReagents?.$extras.total ?? 0),
      hazardousCount: Number(hazardousReagents?.$extras.total ?? 0),
    }

    await this.cacheService.set(cacheKey, stats, 300)
    return stats
  }

  async checkWarnings() {
    const lowStock = await Reagent.query()
      .whereRaw('total_quantity <= warning_threshold')
      .preload('batches', (query) => {
        query.where('expiry_date', '<', new Date().toISOString())
      })

    const expiringBatches = await ReagentBatch.query()
      .where('expiry_date', '<', new Date().toISOString())
      .preload('reagent')

    return {
      lowStockReagents: lowStock.map((r) => ({
        id: r.id,
        name: r.name,
        totalQuantity: r.totalQuantity,
        warningThreshold: r.warningThreshold,
      })),
      expiredBatches: expiringBatches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        reagentName: b.reagent.name,
        expiryDate: b.expiryDate,
        quantity: b.quantity,
      })),
    }
  }
}
