export const CAMP_SESSIONS = [
  { id: '2024-s1', name: '2024年暑期第一期', startDate: '2024-07-01', endDate: '2024-07-14' },
  { id: '2024-s2', name: '2024年暑期第二期', startDate: '2024-07-15', endDate: '2024-07-28' },
  { id: '2024-s3', name: '2024年暑期第三期', startDate: '2024-07-29', endDate: '2024-08-11' },
  { id: '2024-w1', name: '2024年冬季第一期', startDate: '2024-12-15', endDate: '2024-12-28' }
]

export const SPORTS_PROJECTS = [
  { id: 'swimming', name: '游泳' },
  { id: 'surfing', name: '冲浪' },
  { id: 'kayaking', name: '皮划艇' },
  { id: 'diving', name: '潜水' },
  { id: 'sailing', name: '帆船' },
  { id: 'water-ski', name: '滑水' }
]

export const AGE_GROUPS = [
  { id: '6-8', name: '6-8岁' },
  { id: '9-11', name: '9-11岁' },
  { id: '12-14', name: '12-14岁' },
  { id: '15-17', name: '15-17岁' },
  { id: '18+', name: '18岁以上' }
]

export const COACHES = [
  { id: 'c001', name: '张教练', specialty: '游泳', level: '高级' },
  { id: 'c002', name: '李教练', specialty: '冲浪', level: '高级' },
  { id: 'c003', name: '王教练', specialty: '皮划艇', level: '中级' },
  { id: 'c004', name: '赵教练', specialty: '潜水', level: '高级' },
  { id: 'c005', name: '刘教练', specialty: '帆船', level: '中级' },
  { id: 'c006', name: '陈教练', specialty: '滑水', level: '高级' }
]

export const INCIDENT_LEVELS = {
  minor: { label: '轻微', color: '#52c41a', value: 'minor' },
  medical: { label: '医疗介入', color: '#faad14', value: 'medical' },
  suspend: { label: '停课', color: '#f5222d', value: 'suspend' }
}

export const CANCEL_REASONS = [
  { id: 'weather', name: '天气原因' },
  { id: 'health', name: '健康原因' },
  { id: 'personal', name: '个人原因' },
  { id: 'equipment', name: '装备故障' },
  { id: 'other', name: '其他原因' }
]

export const EQUIPMENT_TYPES = [
  { id: 'life-jacket', name: '救生衣' },
  { id: 'surfboard', name: '冲浪板' },
  { id: 'kayak', name: '皮划艇' },
  { id: 'diving-gear', name: '潜水装备' },
  { id: 'sailboat', name: '帆船' },
  { id: 'ski-board', name: '滑水板' },
  { id: 'goggles', name: '泳镜' },
  { id: 'swim-cap', name: '泳帽' }
]

export const WEATHER_TYPES = [
  { id: 'sunny', name: '晴天', icon: '☀️' },
  { id: 'cloudy', name: '多云', icon: '⛅' },
  { id: 'rainy', name: '雨天', icon: '🌧️' },
  { id: 'stormy', name: '暴风雨', icon: '⛈️' },
  { id: 'windy', name: '大风', icon: '💨' }
]

export const FUNNEL_STAGES = [
  { id: 'register', name: '报名', key: 'registerCount' },
  { id: 'confirm', name: '确认参加', key: 'confirmCount' },
  { id: 'checkin', name: '签到', key: 'checkinCount' },
  { id: 'complete', name: '完成活动', key: 'completeCount' }
]

export const USER_ROLES = {
  admin: { name: '管理员', permissions: ['all'] },
  manager: { name: '营地负责人', permissions: ['view_dashboard', 'export_data', 'view_minor_aggregated', 'view_incident_photos_internal'] },
  coach: { name: '教练', permissions: ['view_dashboard', 'view_minor_aggregated'] },
  auditor: { name: '审计员', permissions: ['view_dashboard', 'export_data', 'view_minor_aggregated', 'view_incident_photos_internal'] }
}
