const env = import.meta.env

export const clickhouseConfig = {
  host: env.VITE_CLICKHOUSE_HOST || 'localhost',
  port: env.VITE_CLICKHOUSE_PORT || 8123,
  user: env.VITE_CLICKHOUSE_USER || 'default',
  password: env.VITE_CLICKHOUSE_PASSWORD || '',
  database: env.VITE_CLICKHOUSE_DATABASE || 'water_sports_camp',
  protocol: env.VITE_CLICKHOUSE_PROTOCOL || 'http',
  useMockData: env.VITE_USE_MOCK_DATA !== 'false'
}

export const getConnectionUrl = () => {
  const { protocol, host, port } = clickhouseConfig
  return `${protocol}://${host}:${port}`
}

export const buildQueryUrl = (query) => {
  const baseUrl = getConnectionUrl()
  const encodedQuery = encodeURIComponent(query)
  return `${baseUrl}?query=${encodedQuery}`
}

export const TABLES = {
  REGISTRATIONS: 'registrations',
  CHECKINS: 'checkins',
  COACHES: 'coaches',
  WEATHER: 'weather_records',
  EQUIPMENT_USAGE: 'equipment_usage',
  INCIDENTS: 'incidents',
  CAMP_SESSIONS: 'camp_sessions',
  SPORTS_PROJECTS: 'sports_projects',
  AGE_GROUPS: 'age_groups',
  CANCEL_REASONS: 'cancel_reasons',
  EQUIPMENT_TYPES: 'equipment_types'
}
