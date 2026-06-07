export const STORE_CACHE_KEY = 'pharmacy_store_cache'
export const CACHE_TTL = 30 * 60 * 1000
export const MIN_SAMPLE_SIZE = 10

export const CHRONIC_LABELS = [
  { id: 'diabetes', name: '糖尿病', color: '#ef4444' },
  { id: 'hypertension', name: '高血压', color: '#f97316' },
  { id: 'cardiovascular', name: '心脑血管', color: '#eab308' },
  { id: 'respiratory', name: '呼吸系统', color: '#22c55e' },
  { id: 'gastrointestinal', name: '消化系统', color: '#14b8a6' },
  { id: 'neurological', name: '神经系统', color: '#3b82f6' },
  { id: 'endocrine', name: '内分泌', color: '#8b5cf6' },
  { id: 'oncology', name: '肿瘤相关', color: '#ec4899' }
]

export const MEMBER_TIERS = [
  { id: 'regular', name: '普通会员', color: '#94a3b8' },
  { id: 'silver', name: '银卡会员', color: '#94a3b8' },
  { id: 'gold', name: '金卡会员', color: '#f59e0b' },
  { id: 'platinum', name: '铂金会员', color: '#6366f1' },
  { id: 'diamond', name: '钻石会员', color: '#ec4899' }
]

export const STORES = [
  { id: 'STORE-001', name: '中心店', region: '华东区', address: '上海市浦东新区中心大道1号' },
  { id: 'STORE-002', name: '东门店', region: '华东区', address: '上海市浦东新区东门街23号' },
  { id: 'STORE-003', name: '西门店', region: '华东区', address: '上海市徐汇区西门路45号' },
  { id: 'STORE-004', name: '南门店', region: '华东区', address: '上海市黄浦区南大街67号' },
  { id: 'STORE-005', name: '北门店', region: '华东区', address: '上海市静安区北街89号' },
  { id: 'STORE-006', name: '中关村店', region: '华北区', address: '北京市海淀区中关村大街1号' },
  { id: 'STORE-007', name: '国贸店', region: '华北区', address: '北京市朝阳区国贸中心B座' },
  { id: 'STORE-008', name: '天河店', region: '华南区', address: '广州市天河区天河路385号' }
]

export const REGIONS = [
  { id: 'REG-001', name: '华东区', stores: ['STORE-001', 'STORE-002', 'STORE-003', 'STORE-004', 'STORE-005'] },
  { id: 'REG-002', name: '华北区', stores: ['STORE-006', 'STORE-007'] },
  { id: 'REG-003', name: '华南区', stores: ['STORE-008'] }
]

export const ACTIVITY_LIST = [
  { id: 'ACT-2024-001', name: '春季慢病关怀活动', startDate: '2024-03-01', endDate: '2024-03-31', status: 'completed' },
  { id: 'ACT-2024-002', name: '会员感恩回馈月', startDate: '2024-04-01', endDate: '2024-04-30', status: 'completed' },
  { id: 'ACT-2024-003', name: '夏季健康节', startDate: '2024-06-01', endDate: '2024-06-30', status: 'active' }
]
