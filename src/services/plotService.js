import { BaseFirestoreService } from './baseService'
import { COLLECTIONS, PLOT_STATUS, CLAIM_STATUS } from '@/models/schemas'

class PlotService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.PLOTS)
  }

  async getAvailablePlots() {
    return this.getAll({
      where: [['status', '==', PLOT_STATUS.AVAILABLE]],
      orderBy: ['plotNumber', 'asc']
    })
  }

  async getPlotsByZone(zone) {
    return this.getAll({
      where: [['location.zone', '==', zone]],
      orderBy: ['plotNumber', 'asc']
    })
  }

  async getPlotsByUser(userId) {
    return this.getAll({
      where: [['claimedBy', '==', userId]],
      orderBy: ['plotNumber', 'asc']
    })
  }

  async claimPlot(plotId, userId) {
    return this.update(plotId, {
      status: PLOT_STATUS.CLAIMED,
      claimedBy: userId,
      claimedAt: new Date()
    })
  }

  async releasePlot(plotId) {
    return this.update(plotId, {
      status: PLOT_STATUS.AVAILABLE,
      claimedBy: null,
      claimedAt: null,
      currentCropId: null
    })
  }

  async setMaintenance(plotId) {
    return this.update(plotId, {
      status: PLOT_STATUS.MAINTENANCE
    })
  }

  async getPlotMapData() {
    const plots = await this.getAll({
      orderBy: ['location.row', 'asc'],
      orderBy: ['location.col', 'asc']
    })
    
    const zones = {}
    plots.forEach(plot => {
      const zone = plot.location?.zone || 'default'
      if (!zones[zone]) {
        zones[zone] = []
      }
      zones[zone].push(plot)
    })
    
    return { plots, zones }
  }

  async getPlotStatistics() {
    const plots = await this.getAll()
    const total = plots.length
    const available = plots.filter(p => p.status === PLOT_STATUS.AVAILABLE).length
    const claimed = plots.filter(p => p.status === PLOT_STATUS.CLAIMED).length
    const maintenance = plots.filter(p => p.status === PLOT_STATUS.MAINTENANCE).length
    
    return {
      total,
      available,
      claimed,
      maintenance,
      utilizationRate: total > 0 ? Math.round((claimed / total) * 100) : 0
    }
  }
}

export const plotService = new PlotService()
