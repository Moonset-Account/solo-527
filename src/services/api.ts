const API_BASE = '/api'

async function fetchAPI<T = any>(path: string, params: Record<string, any> = {}): Promise<{ sql: string; params: Record<string, any>; data: T; rowCount: number }> {
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  const url = `${API_BASE}${path}${query ? '?' + query : ''}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`API Error: ${resp.status} ${resp.statusText}`)
  return resp.json()
}

export const api = {
  spatial: {
    queryByBbox(minLng: number, maxLng: number, minLat: number, maxLat: number) {
      return fetchAPI('/spatial/bbox', { minLng, maxLng, minLat, maxLat })
    },
    queryByGeoHash(prefix: string) {
      return fetchAPI(`/spatial/geohash/${encodeURIComponent(prefix)}`)
    },
    getSpatialIndex() {
      return fetchAPI('/spatial/index')
    },
    getNeighbors(hash: string) {
      return fetchAPI(`/spatial/neighbors/${encodeURIComponent(hash)}`)
    },
    getDistrictsGeoJson() {
      return fetchAPI('/spatial/districts/geojson')
    }
  },

  misuse: {
    getTrend(params: { startDate: string; endDate: string; communityId?: string; misuseType?: string }) {
      return fetchAPI('/misuse/trend', params)
    },
    getByType(params: { startDate: string; communityId?: string }) {
      return fetchAPI('/misuse/by-type', params)
    }
  },

  collection: {
    getEfficiencyByTimeWindow(params: { startDate: string; excludeHolidays?: boolean; communityId?: string }) {
      return fetchAPI('/collection/efficiency/time-window', params)
    },
    getEfficiencyByCommunity(params: { startDate: string; excludeHolidays?: boolean }) {
      return fetchAPI('/collection/efficiency/community', params)
    },
    getTrend(params: { startDate: string; excludeHolidays?: boolean }) {
      return fetchAPI('/collection/trend', params)
    }
  },

  audit: {
    getRejectLogs(params: { limit?: number }) {
      return fetchAPI('/audit/reject-logs', params)
    },
    getCommunityRanking(params: { excludeHolidays?: boolean }) {
      return fetchAPI('/audit/community-ranking', params)
    },
    getPhotos(params: { status?: string; communityId?: string }) {
      return fetchAPI('/audit/photos', params)
    },
    getPendingAlerts() {
      return fetchAPI('/audit/pending-alerts')
    }
  },

  public: {
    getReport() {
      return fetchAPI('/public/report')
    },
    downloadCSV() {
      return `${API_BASE}/public/report/csv`
    }
  },

  holidays: {
    list(params?: { year?: string }) {
      return fetchAPI('/holidays', params || {})
    },
    getNonWorkdays(params?: { startDate?: string; endDate?: string }) {
      return fetchAPI('/holidays/non-workdays', params || {})
    },
    check(date: string) {
      return fetchAPI('/holidays/check', { date })
    }
  },

  binpoints: {
    list(params?: { status?: string; district?: string; communityId?: string }) {
      return fetchAPI('/binpoints', params || {})
    },
    getStats() {
      return fetchAPI('/binpoints/stats')
    },
    get(id: string) {
      return fetchAPI(`/binpoints/${encodeURIComponent(id)}`)
    }
  },

  inspection: {
    getCoverage() {
      return fetchAPI('/inspection/coverage')
    },
    getReturnVisits(params?: { binPointId?: string }) {
      return fetchAPI('/inspection/return-visits', params || {})
    }
  }
}
