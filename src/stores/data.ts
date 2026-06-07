import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Community,
  BinPoint,
  MisuseRecord,
  FullAlert,
  CollectionLog,
  InspectionPhoto,
  AuditLog,
  ReturnVisit,
  HolidaySchedule,
  GeoJson
} from '@/types'
import { initMockData, type MockData } from '@/data/mockData'

const MOCK_DATA_VERSION = 2

function loadMockData(): MockData {
  const cached = localStorage.getItem('mockData')
  const version = localStorage.getItem('mockDataVersion')
  if (cached && version === String(MOCK_DATA_VERSION)) {
    try {
      return JSON.parse(cached)
    } catch {
      // fall through
    }
  }
  const data = initMockData()
  localStorage.setItem('mockData', JSON.stringify(data))
  localStorage.setItem('mockDataVersion', String(MOCK_DATA_VERSION))
  return data
}

export const useDataStore = defineStore('data', () => {
  const mockData = ref<MockData>(loadMockData())

  const communities = ref<Community[]>(mockData.value.communities)
  const binPoints = ref<BinPoint[]>(mockData.value.binPoints)
  const holidays = ref<HolidaySchedule[]>(mockData.value.holidays)
  const misuseRecords = ref<MisuseRecord[]>(mockData.value.misuseRecords)
  const fullAlerts = ref<FullAlert[]>(mockData.value.fullAlerts)
  const collectionLogs = ref<CollectionLog[]>(mockData.value.collectionLogs)
  const inspectionPhotos = ref<InspectionPhoto[]>(mockData.value.inspectionPhotos)
  const auditLogs = ref<AuditLog[]>(mockData.value.auditLogs)
  const returnVisits = ref<ReturnVisit[]>(mockData.value.returnVisits)
  const cityGeoJson = ref<GeoJson>(mockData.value.cityGeoJson)
  const users = ref(mockData.value.users)

  const binPointsMap = computed(() => {
    const map = new Map<string, BinPoint>()
    binPoints.value.forEach(b => map.set(b.id, b))
    return map
  })

  const communitiesMap = computed(() => {
    const map = new Map<string, Community>()
    communities.value.forEach(c => map.set(c.id, c))
    return map
  })

  const pendingPhotos = computed(() =>
    inspectionPhotos.value.filter(p => p.auditStatus === 'pending')
  )

  const pendingAlerts = computed(() =>
    fullAlerts.value.filter(a => a.status !== 'resolved')
  )

  const approvedMisuseRecords = computed(() =>
    misuseRecords.value.filter(r => r.auditStatus === 'approved')
  )

  const holidaySet = computed(() => {
    const set = new Set<string>()
    holidays.value.filter(h => !h.isWorkday).forEach(h => set.add(h.date))
    return set
  })

  function getCommunityById(id: string): Community | undefined {
    return communitiesMap.value.get(id)
  }

  function getBinPointById(id: string): BinPoint | undefined {
    return binPointsMap.value.get(id)
  }

  function getBinPointsByCommunity(communityId: string): BinPoint[] {
    return binPoints.value.filter(b => b.communityId === communityId)
  }

  function getMisuseRecordsByBinPoint(binPointId: string, approvedOnly = false): MisuseRecord[] {
    const records = misuseRecords.value.filter(r => r.binPointId === binPointId)
    return approvedOnly ? records.filter(r => r.auditStatus === 'approved') : records
  }

  function getCollectionLogsByBinPoint(
    binPointId: string,
    excludeHolidays = true
  ): CollectionLog[] {
    let logs = collectionLogs.value.filter(l => l.binPointId === binPointId)
    if (excludeHolidays) {
      logs = logs.filter(l => !l.isHoliday)
    }
    return logs
  }

  function getPhotosByBinPoint(binPointId: string): InspectionPhoto[] {
    return inspectionPhotos.value.filter(p => p.binPointId === binPointId)
  }

  function getReturnVisitsByBinPoint(binPointId: string): ReturnVisit[] {
    return returnVisits.value.filter(v => v.binPointId === binPointId)
  }

  function approvePhoto(photoId: string, auditor: string) {
    const photo = inspectionPhotos.value.find(p => p.id === photoId)
    if (photo) {
      photo.auditStatus = 'approved'
      const auditLog: AuditLog = {
        id: `audit-${Date.now()}`,
        photoId,
        auditor,
        auditTime: new Date().toISOString(),
        result: 'approved'
      }
      auditLogs.value.push(auditLog)
      photo.auditLogId = auditLog.id
      saveData()
    }
  }

  function rejectPhoto(photoId: string, auditor: string, rejectReason: string) {
    const photo = inspectionPhotos.value.find(p => p.id === photoId)
    if (photo) {
      photo.auditStatus = 'rejected'
      const auditLog: AuditLog = {
        id: `audit-${Date.now()}`,
        photoId,
        auditor,
        auditTime: new Date().toISOString(),
        result: 'rejected',
        rejectReason
      }
      auditLogs.value.push(auditLog)
      photo.auditLogId = auditLog.id
      saveData()
    }
  }

  function addReturnVisit(binPointId: string, visitor: string, issueType: string, rectification: string) {
    const visit: ReturnVisit = {
      id: `visit-${Date.now()}`,
      binPointId,
      visitTime: new Date().toISOString(),
      visitor,
      issueType,
      rectification,
      status: 'pending'
    }
    returnVisits.value.push(visit)
    saveData()
  }

  function updateReturnVisitStatus(visitId: string, status: ReturnVisit['status']) {
    const visit = returnVisits.value.find(v => v.id === visitId)
    if (visit) {
      visit.status = status
      saveData()
    }
  }

  function addHoliday(date: string, name: string, isWorkday: boolean) {
    const existing = holidays.value.findIndex(h => h.date === date)
    if (existing >= 0) {
      holidays.value[existing] = { date, name, isWorkday }
    } else {
      holidays.value.push({ date, name, isWorkday })
    }
    saveData()
  }

  function removeHoliday(date: string) {
    const index = holidays.value.findIndex(h => h.date === date)
    if (index >= 0) {
      holidays.value.splice(index, 1)
      saveData()
    }
  }

  function getCommunityStats(communityId: string, excludeHolidays = true) {
    const bins = getBinPointsByCommunity(communityId)
    const binIds = new Set(bins.map(b => b.id))

    const approvedMisuse = approvedMisuseRecords.value.filter(r => binIds.has(r.binPointId))
    const avgMisuseRate = approvedMisuse.length > 0
      ? approvedMisuse.reduce((sum, r) => sum + r.misuseRate, 0) / approvedMisuse.length
      : 0

    let collectionLogsFiltered = collectionLogs.value.filter(l => binIds.has(l.binPointId))
    if (excludeHolidays) {
      collectionLogsFiltered = collectionLogsFiltered.filter(l => !l.isHoliday)
    }
    const onTimeRate = collectionLogsFiltered.length > 0
      ? collectionLogsFiltered.filter(l => l.status === 'completed').length / collectionLogsFiltered.length * 100
      : 0

    const photos = inspectionPhotos.value.filter(p => binIds.has(p.binPointId))
    const inspectionRate = bins.length > 0
      ? new Set(photos.map(p => p.binPointId)).size / bins.length * 100
      : 0

    const alerts = fullAlerts.value.filter(a => binIds.has(a.binPointId))

    return {
      binCount: bins.length,
      avgMisuseRate: parseFloat(avgMisuseRate.toFixed(1)),
      onTimeRate: parseFloat(onTimeRate.toFixed(1)),
      inspectionRate: parseFloat(inspectionRate.toFixed(1)),
      alertCount: alerts.length,
      pendingAlertCount: alerts.filter(a => a.status !== 'resolved').length
    }
  }

  function getAggregatedPublicData() {
    const totalBins = binPoints.value.length
    const normalBins = binPoints.value.filter(b => b.status === 'normal').length
    const avgMisuseRate = approvedMisuseRecords.value.length > 0
      ? approvedMisuseRecords.value.reduce((sum, r) => sum + r.misuseRate, 0) / approvedMisuseRecords.value.length
      : 0

    const nonHolidayLogs = collectionLogs.value.filter(l => !l.isHoliday)
    const onTimeRate = nonHolidayLogs.length > 0
      ? nonHolidayLogs.filter(l => l.status === 'completed').length / nonHolidayLogs.length * 100
      : 0

    const districtStats = new Map<string, { bins: number; normalBins: number }>()
    communities.value.forEach(c => {
      if (!districtStats.has(c.district)) {
        districtStats.set(c.district, { bins: 0, normalBins: 0 })
      }
      const bins = getBinPointsByCommunity(c.id)
      const stats = districtStats.get(c.district)!
      stats.bins += bins.length
      stats.normalBins += bins.filter(b => b.status === 'normal').length
    })

    return {
      totalBins,
      normalBins,
      normalRate: totalBins > 0 ? parseFloat((normalBins / totalBins * 100).toFixed(1)) : 0,
      avgMisuseRate: parseFloat(avgMisuseRate.toFixed(1)),
      onTimeRate: parseFloat(onTimeRate.toFixed(1)),
      districtStats: Array.from(districtStats.entries()).map(([district, stats]) => ({
        district,
        binCount: stats.bins,
        normalRate: stats.bins > 0 ? parseFloat((stats.normalBins / stats.bins * 100).toFixed(1)) : 0
      }))
    }
  }

  function saveData() {
    const data: MockData = {
      communities: communities.value,
      binPoints: binPoints.value,
      holidays: holidays.value,
      misuseRecords: misuseRecords.value,
      fullAlerts: fullAlerts.value,
      collectionLogs: collectionLogs.value,
      inspectionPhotos: inspectionPhotos.value,
      auditLogs: auditLogs.value,
      returnVisits: returnVisits.value,
      cityGeoJson: cityGeoJson.value,
      users: users.value
    }
    localStorage.setItem('mockData', JSON.stringify(data))
    localStorage.setItem('mockDataVersion', String(MOCK_DATA_VERSION))
  }

  function resetData() {
    const data = initMockData()
    communities.value = data.communities
    binPoints.value = data.binPoints
    holidays.value = data.holidays
    misuseRecords.value = data.misuseRecords
    fullAlerts.value = data.fullAlerts
    collectionLogs.value = data.collectionLogs
    inspectionPhotos.value = data.inspectionPhotos
    auditLogs.value = data.auditLogs
    returnVisits.value = data.returnVisits
    cityGeoJson.value = data.cityGeoJson
    users.value = data.users
    localStorage.setItem('mockData', JSON.stringify(data))
    localStorage.setItem('mockDataVersion', String(MOCK_DATA_VERSION))
  }

  return {
    communities,
    binPoints,
    holidays,
    misuseRecords,
    fullAlerts,
    collectionLogs,
    inspectionPhotos,
    auditLogs,
    returnVisits,
    cityGeoJson,
    users,
    pendingPhotos,
    pendingAlerts,
    approvedMisuseRecords,
    holidaySet,
    getCommunityById,
    getBinPointById,
    getBinPointsByCommunity,
    getMisuseRecordsByBinPoint,
    getCollectionLogsByBinPoint,
    getPhotosByBinPoint,
    getReturnVisitsByBinPoint,
    approvePhoto,
    rejectPhoto,
    addReturnVisit,
    updateReturnVisitStatus,
    addHoliday,
    removeHoliday,
    getCommunityStats,
    getAggregatedPublicData,
    resetData
  }
})
