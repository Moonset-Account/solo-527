import type {
  SummaryData,
  TrendData,
  HeatmapData,
  ShiftRankData,
  AlarmCorrelationData,
  MetricsConfig,
  FilterState,
} from "@/types"

const API_BASE = "http://localhost:8001"

function buildQueryParams(filter: Partial<FilterState>): Record<string, string> {
  const params: Record<string, string> = {}
  if (filter.dateStart) params.start_time = filter.dateStart
  if (filter.dateEnd) params.end_time = filter.dateEnd
  if (filter.shift) params.shift = filter.shift
  if (filter.slot) params.slot = filter.slot
  if (filter.route) params.route = filter.route
  if (filter.device) params.device = filter.device
  if (filter.granularity) params.granularity = filter.granularity
  return params
}

export async function fetchSummary(filter: Partial<FilterState>): Promise<SummaryData> {
  const body = buildQueryParams(filter)
  const res = await fetch(`${API_BASE}/api/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to fetch summary")
  return res.json()
}

export async function fetchTrend(filter: Partial<FilterState>): Promise<TrendData> {
  const body = buildQueryParams(filter)
  const res = await fetch(`${API_BASE}/api/trend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to fetch trend")
  return res.json()
}

export async function fetchHeatmap(filter: Partial<FilterState>): Promise<HeatmapData> {
  const body = buildQueryParams(filter)
  const res = await fetch(`${API_BASE}/api/heatmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to fetch heatmap")
  return res.json()
}

export async function fetchShiftRank(filter: Partial<FilterState>): Promise<ShiftRankData> {
  const body = buildQueryParams(filter)
  const res = await fetch(`${API_BASE}/api/shift-rank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to fetch shift rank")
  return res.json()
}

export async function fetchAlarmCorrelation(filter: Partial<FilterState>): Promise<AlarmCorrelationData> {
  const body = buildQueryParams(filter)
  const res = await fetch(`${API_BASE}/api/alarm-correlation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to fetch alarm correlation")
  return res.json()
}

export async function fetchMetrics(): Promise<MetricsConfig> {
  const res = await fetch(`${API_BASE}/api/metrics`)
  if (!res.ok) throw new Error("Failed to fetch metrics")
  return res.json()
}

export async function createExport(filter: Partial<FilterState>, dataType: string): Promise<{ task_id: string; status: string }> {
  const body = { ...buildQueryParams(filter), data_type: dataType }
  const res = await fetch(`${API_BASE}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to create export")
  return res.json()
}

export async function getExportStatus(taskId: string): Promise<{ status: string; download_url?: string }> {
  const res = await fetch(`${API_BASE}/api/export/${taskId}`)
  if (!res.ok) throw new Error("Failed to get export status")
  return res.json()
}

export function getExportDownloadUrl(taskId: string): string {
  return `${API_BASE}/api/export/${taskId}/download`
}
