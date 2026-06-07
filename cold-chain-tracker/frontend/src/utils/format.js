export function formatTemp(value) {
  if (value === null || value === undefined) return '--'
  return `${Number(value).toFixed(1)}°C`
}

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '--'
  if (minutes < 60) return `${Math.round(minutes)}分钟`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h < 24) return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return rh > 0 ? `${d}天${rh}小时` : `${d}天`
}

export function formatDatetime(iso) {
  if (!iso) return '--'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(iso) {
  if (!iso) return '--'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatGPS(lat, lng) {
  if (lat == null || lng == null) return '--'
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`
}

export function formatDistance(km) {
  if (km === null || km === undefined) return '--'
  return km < 1 ? `${Math.round(km * 1000)}m` : `${Number(km).toFixed(1)}km`
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '--'
  return `${Number(value).toFixed(1)}%`
}
