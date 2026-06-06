import { BaseFirestoreService } from './baseService'
import { COLLECTIONS } from '@/models/schemas'

class HarvestService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.HARVESTS)
  }

  async createHarvest(harvestData, harvestedBy, harvestedByName) {
    return this.create({
      ...harvestData,
      harvestedBy,
      harvestedByName,
      harvestDate: harvestData.harvestDate || new Date(),
      photos: []
    })
  }

  async getHarvestsByPlot(plotId) {
    return this.getAll({
      where: [['plotId', '==', plotId]],
      orderBy: ['harvestDate', 'desc']
    })
  }

  async getHarvestsByUser(userId) {
    return this.getAll({
      where: [['harvestedBy', '==', userId]],
      orderBy: ['harvestDate', 'desc']
    })
  }

  async getHarvestsByDateRange(startDate, endDate) {
    return this.getAll({
      where: [
        ['harvestDate', '>=', startDate],
        ['harvestDate', '<=', endDate]
      ],
      orderBy: ['harvestDate', 'desc']
    })
  }

  async addPhoto(harvestId, photoUrl) {
    const harvest = await this.getById(harvestId)
    const photos = [...(harvest.photos || []), photoUrl]
    return this.update(harvestId, { photos })
  }

  async getHarvestStatistics() {
    const harvests = await this.getAll()
    
    const totalHarvests = harvests.length
    const totalQuantity = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0)
    
    const byCrop = {}
    harvests.forEach(h => {
      if (!byCrop[h.cropName]) {
        byCrop[h.cropName] = 0
      }
      byCrop[h.cropName] += h.quantity || 0
    })
    
    const byMonth = {}
    harvests.forEach(h => {
      const date = new Date(h.harvestDate?.seconds ? h.harvestDate.seconds * 1000 : h.harvestDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = 0
      }
      byMonth[monthKey] += h.quantity || 0
    })
    
    return {
      totalHarvests,
      totalQuantity,
      byCrop,
      byMonth
    }
  }
}

export const harvestService = new HarvestService()
