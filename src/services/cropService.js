import { BaseFirestoreService } from './baseService'
import { COLLECTIONS, CROP_STATUS } from '@/models/schemas'

class CropService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.CROPS)
  }

  async createCrop(cropData, plantedBy) {
    return this.create({
      ...cropData,
      status: CROP_STATUS.PLANTED,
      plantedBy,
      photos: []
    })
  }

  async getCropsByPlot(plotId) {
    return this.getAll({
      where: [['plotId', '==', plotId]],
      orderBy: ['plantedDate', 'desc']
    })
  }

  async getCropsByStatus(status) {
    return this.getAll({
      where: [['status', '==', status]],
      orderBy: ['plantedDate', 'desc']
    })
  }

  async getCropsByUser(userId) {
    return this.getAll({
      where: [['plantedBy', '==', userId]],
      orderBy: ['plantedDate', 'desc']
    })
  }

  async updateStatus(cropId, status, notes = '') {
    const updates = { status, notes }
    if (status === CROP_STATUS.HARVESTED) {
      updates.actualHarvestDate = new Date()
    }
    return this.update(cropId, updates)
  }

  async addPhoto(cropId, photoUrl) {
    const crop = await this.getById(cropId)
    const photos = [...(crop.photos || []), photoUrl]
    return this.update(cropId, { photos })
  }

  async getGrowingCrops() {
    return this.getCropsByStatus(CROP_STATUS.GROWING)
  }

  async getCropStatistics() {
    const crops = await this.getAll()
    const total = crops.length
    const planted = crops.filter(c => c.status === CROP_STATUS.PLANTED).length
    const growing = crops.filter(c => c.status === CROP_STATUS.GROWING).length
    const harvested = crops.filter(c => c.status === CROP_STATUS.HARVESTED).length
    const failed = crops.filter(c => c.status === CROP_STATUS.FAILED).length
    
    return { total, planted, growing, harvested, failed }
  }
}

export const cropService = new CropService()
