import { useDataStore } from '@/stores/data'
import { getGeoHash, queryByBbox, queryByGeoHashPrefix, buildSpatialIndex } from '@/utils/geohash'
import type { BinPoint, MisuseType, AuditStatus } from '@/types'

function getStore() {
  return useDataStore()
}

export const ClickHouseService = {
  queryBinPointsByBbox(minLng: number, maxLng: number, minLat: number, maxLat: number): BinPoint[] {
    const store = getStore()
    return queryByBbox(store.binPoints, minLng, maxLng, minLat, maxLat) as BinPoint[]
  },

  queryBinPointsByGeoHash(prefix: string): BinPoint[] {
    const store = getStore()
    const items = store.binPoints.map(b => ({ ...b, geoHash: b.gridCode }))
    return queryByGeoHashPrefix(items as any, prefix) as unknown as BinPoint[]
  },

  buildBinPointSpatialIndex() {
    const store = getStore()
    const items = store.binPoints.map(b => ({
      ...b,
      geoHash: getGeoHash(b.lng, b.lat, 8)
    }))
    return buildSpatialIndex(items)
  },

  queryMisuseTrend(params: {
    startDate: string
    endDate: string
    communityId?: string
    misuseType?: MisuseType | 'all'
    approvedOnly?: boolean
  }) {
    const store = getStore()
    let records = store.misuseRecords

    if (params.approvedOnly !== false) {
      records = records.filter(r => r.auditStatus === 'approved')
    }

    records = records.filter(r =>
      r.recordDate >= params.startDate && r.recordDate <= params.endDate
    )

    if (params.communityId && params.communityId !== 'all') {
      const binIds = new Set(
        store.getBinPointsByCommunity(params.communityId).map(b => b.id)
      )
      records = records.filter(r => binIds.has(r.binPointId))
    }

    if (params.misuseType && params.misuseType !== 'all') {
      records = records.filter(r => r.misuseType === params.misuseType)
    }

    const trendMap = new Map<string, { date: string; type: MisuseType; count: number; sumRate: number }>()

    records.forEach(r => {
      const key = `${r.recordDate}|${r.misuseType}`
      const existing = trendMap.get(key)
      if (existing) {
        existing.count++
        existing.sumRate += r.misuseRate
      } else {
        trendMap.set(key, {
          date: r.recordDate,
          type: r.misuseType,
          count: 1,
          sumRate: r.misuseRate
        })
      }
    })

    return Array.from(trendMap.values()).map(t => ({
      date: t.date,
      misuseType: t.type,
      recordCount: t.count,
      avgMisuseRate: parseFloat((t.sumRate / t.count).toFixed(1))
    })).sort((a, b) => a.date.localeCompare(b.date))
  },

  queryMisuseByType(params: {
    startDate: string
    communityId?: string
  }) {
    const store = getStore()
    let records = store.approvedMisuseRecords

    records = records.filter(r => r.recordDate >= params.startDate)

    if (params.communityId && params.communityId !== 'all') {
      const binIds = new Set(
        store.getBinPointsByCommunity(params.communityId).map(b => b.id)
      )
      records = records.filter(r => binIds.has(r.binPointId))
    }

    const typeMap = new Map<MisuseType, { count: number; sumRate: number }>()
    records.forEach(r => {
      const existing = typeMap.get(r.misuseType) || { count: 0, sumRate: 0 }
      existing.count++
      existing.sumRate += r.misuseRate
      typeMap.set(r.misuseType, existing)
    })

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      misuseType: type,
      recordCount: data.count,
      avgMisuseRate: parseFloat((data.sumRate / data.count).toFixed(1))
    })).sort((a, b) => b.avgMisuseRate - a.avgMisuseRate)
  },

  queryCollectionEfficiencyByTimeWindow(params: {
    startDate: string
    excludeHolidays: boolean
    communityId?: string
  }) {
    const store = getStore()
    let logs = store.collectionLogs

    if (params.excludeHolidays) {
      logs = logs.filter(l => !l.isHoliday)
    }

    logs = logs.filter(l => new Date(l.planTime).toISOString().split('T')[0] >= params.startDate)

    if (params.communityId && params.communityId !== 'all') {
      const binIds = new Set(
        store.getBinPointsByCommunity(params.communityId).map(b => b.id)
      )
      logs = logs.filter(l => binIds.has(l.binPointId))
    }

    const windowMap = new Map<string, { total: number; completed: number }>()
    logs.forEach(l => {
      const existing = windowMap.get(l.timeWindow) || { total: 0, completed: 0 }
      existing.total++
      if (l.status === 'completed') existing.completed++
      windowMap.set(l.timeWindow, existing)
    })

    return Array.from(windowMap.entries()).map(([window, data]) => ({
      timeWindow: window,
      totalCount: data.total,
      completedCount: data.completed,
      onTimeRate: data.total > 0
        ? parseFloat((data.completed / data.total * 100).toFixed(1))
        : 0
    }))
  },

  queryCollectionEfficiencyByCommunity(params: {
    startDate: string
    excludeHolidays: boolean
  }) {
    const store = getStore()
    let logs = store.collectionLogs

    if (params.excludeHolidays) {
      logs = logs.filter(l => !l.isHoliday)
    }

    logs = logs.filter(l => new Date(l.planTime).toISOString().split('T')[0] >= params.startDate)

    const commMap = new Map<string, { communityId: string; total: number; completed: number }>()

    logs.forEach(l => {
      const bin = store.getBinPointById(l.binPointId)
      if (bin) {
        const existing = commMap.get(bin.communityId) || { communityId: bin.communityId, total: 0, completed: 0 }
        existing.total++
        if (l.status === 'completed') existing.completed++
        commMap.set(bin.communityId, existing)
      }
    })

    return Array.from(commMap.entries()).map(([_, data]) => {
      const comm = store.getCommunityById(data.communityId)
      return {
        communityName: comm?.name || '未知',
        district: comm?.district || '',
        totalCount: data.total,
        completedCount: data.completed,
        onTimeRate: data.total > 0
          ? parseFloat((data.completed / data.total * 100).toFixed(1))
          : 0
      }
    }).sort((a, b) => b.onTimeRate - a.onTimeRate)
  },

  queryCommunityRankingApprovedOnly(params: {
    excludeHolidays: boolean
  }) {
    const store = getStore()

    return store.communities.map(comm => {
      const stats = store.getCommunityStats(comm.id, params.excludeHolidays)
      return {
        communityId: comm.id,
        communityName: comm.name,
        district: comm.district,
        binCount: stats.binCount,
        avgMisuseRate: stats.avgMisuseRate,
        onTimeRate: stats.onTimeRate,
        inspectionRate: stats.inspectionRate,
        pendingAlertCount: stats.pendingAlertCount
      }
    }).sort((a, b) => b.avgMisuseRate - a.avgMisuseRate)
  },

  queryAuditLogsWithRejectReason(params: {
    limit?: number
  }) {
    const store = getStore()
    const limit = params.limit || 50

    return store.auditLogs
      .filter(l => l.result === 'rejected')
      .map(l => {
        const photo = store.inspectionPhotos.find(p => p.id === l.photoId)
        const bin = photo ? store.getBinPointById(photo.binPointId) : undefined
        const comm = bin ? store.getCommunityById(bin.communityId) : undefined
        return {
          id: l.id,
          photoId: l.photoId,
          auditor: l.auditor,
          auditTime: l.auditTime,
          result: l.result,
          rejectReason: l.rejectReason || '未填写',
          binPointId: photo?.binPointId || '',
          binName: bin?.name || '未知',
          communityName: comm?.name || '未知',
          uploader: photo?.uploader || ''
        }
      })
      .sort((a, b) => new Date(b.auditTime).getTime() - new Date(a.auditTime).getTime())
      .slice(0, limit)
  },

  queryPendingAlerts() {
    const store = getStore()

    return store.fullAlerts
      .filter(a => a.status !== 'resolved')
      .map(a => {
        const bin = store.getBinPointById(a.binPointId)
        const comm = bin ? store.getCommunityById(bin.communityId) : undefined
        return {
          id: a.id,
          binPointId: a.binPointId,
          binName: bin?.name || '未知',
          communityName: comm?.name || '未知',
          alertTime: a.alertTime,
          level: a.level,
          status: a.status,
          handler: a.handler
        }
      })
      .sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2 }
        const levelDiff = levelOrder[a.level as keyof typeof levelOrder] - levelOrder[b.level as keyof typeof levelOrder]
        return levelDiff !== 0 ? levelDiff : new Date(b.alertTime).getTime() - new Date(a.alertTime).getTime()
      })
  },

  queryPublicAggregatedReport() {
    const store = getStore()
    const publicData = store.getAggregatedPublicData()

    const districtDetails = publicData.districtStats.map(d => {
      const commIds = store.communities
        .filter(c => c.district === d.district)
        .map(c => c.id)

      const binIds = new Set<string>()
      commIds.forEach(cid => {
        store.getBinPointsByCommunity(cid).forEach(b => binIds.add(b.id))
      })

      const approvedRecords = store.approvedMisuseRecords.filter(r => binIds.has(r.binPointId))
      const avgMisuse = approvedRecords.length > 0
        ? parseFloat((approvedRecords.reduce((s, r) => s + r.misuseRate, 0) / approvedRecords.length).toFixed(1))
        : 0

      const nonHolidayLogs = store.collectionLogs.filter(l => binIds.has(l.binPointId) && !l.isHoliday)
      const onTime = nonHolidayLogs.length > 0
        ? parseFloat((nonHolidayLogs.filter(l => l.status === 'completed').length / nonHolidayLogs.length * 100).toFixed(1))
        : 0

      return {
        district: d.district,
        binCount: d.binCount,
        normalRate: d.normalRate,
        avgMisuseRate: avgMisuse,
        onTimeRate: onTime
      }
    })

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalBins: publicData.totalBins,
        normalRate: publicData.normalRate,
        avgMisuseRate: publicData.avgMisuseRate,
        onTimeRate: publicData.onTimeRate
      },
      districts: districtDetails,
      note: '本报表数据均已脱敏聚合处理，不含桶点定位信息、巡查照片及个人数据'
    }
  },

  generatePublicReportCSV(): string {
    const report = this.queryPublicAggregatedReport()

    const headers = ['行政区', '桶点数', '正常率(%)', '平均误投率(%)', '清运准时率(%)']
    const rows = report.districts.map(d => [
      d.district,
      String(d.binCount),
      String(d.normalRate),
      String(d.avgMisuseRate),
      String(d.onTimeRate)
    ])

    const summaryRow = [
      '合计',
      String(report.summary.totalBins),
      String(report.summary.normalRate),
      String(report.summary.avgMisuseRate),
      String(report.summary.onTimeRate)
    ]

    const lines = [
      `# 城市垃圾分类运营公开报表`,
      `# 生成时间: ${new Date().toLocaleString('zh-CN')}`,
      `# ${report.note}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ]

    return '\uFEFF' + lines.join('\n')
  }
}
