export type LeadQuality = 'A' | 'B' | 'C' | 'D'
export type Gender = 'M' | 'F' | 'UNKNOWN'
export type ReturnPlanType = 'FOLLOW_UP' | 'REVISIT' | 'QUOTATION'
export type ReturnPlanStatus = 'PENDING' | 'DONE' | 'CANCELLED'
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED'
export type Role = 'FRONT_DESK' | 'ADVISOR' | 'MANAGER' | 'DIRECTOR'

export interface User {
  id: number
  username: string
  password: string
  name: string
  role: Role
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Advisor {
  id: number
  name: string
  userId: number | null
  role: string
  active: boolean
  createdAt: string
}

export interface Tag {
  id: number
  name: string
  color: string
  active: boolean
  createdAt: string
}

export interface CustomerLevel {
  id: number
  name: string
  threshold: string
  benefits: string | null
  active: boolean
  createdAt: string
}

export interface SourceChannel {
  id: number
  name: string
  category: string
  active: boolean
  createdAt: string
}

export interface CustomerTag {
  customerId: number
  tagId: number
  assignedAt: string
}

export interface ConsultRecord {
  id: number
  customerId: number
  content: string
  consultDate: string
  operatorId: number | null
  createdAt: string
}

export interface Consumption {
  id: number
  customerId: number
  amount: string
  project: string
  consumeDate: string
  operatorId: number | null
  createdAt: string
}

export interface QuotationItem {
  id: number
  quotationId: number
  itemName: string
  price: string
  quantity: number
}

export interface ResponseNode {
  id: number
  quotationId: number
  nodeName: string
  ownerId: number
  dueAt: string
  doneAt: string | null
  remark: string | null
  createdAt: string
}

export interface Quotation {
  id: number
  customerId: number
  advisorId: number
  version: string
  totalAmount: string
  expireAt: string
  status: QuotationStatus
  expireReason: string | null
  createdAt: string
  updatedAt: string
  items: QuotationItem[]
  responseNodes: ResponseNode[]
}

export interface ReturnPlan {
  id: number
  customerId: number
  assigneeId: number
  planDate: string
  planType: ReturnPlanType
  content: string
  status: ReturnPlanStatus
  resultNote: string | null
  createdAt: string
}

export interface ChurnRecord {
  id: number
  customerId: number
  reasonCode: string
  reasonDetail: string | null
  quotationId: number | null
  churnDate: string
  createdAt: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  gender: Gender
  age: number | null
  leadQuality: LeadQuality
  consultIntent: string
  returnPreference: string | null
  totalConsumption: string
  visitCount: number
  levelId: number | null
  advisorId: number | null
  sourceChannelId: number
  createdAt: string
  updatedAt: string
  tagIds: number[]
}

const now = new Date().toISOString()

const mockUsers: User[] = [
  { id: 1, username: 'admin', password: '123456', name: '系统管理员', role: 'DIRECTOR', active: true, createdAt: now, updatedAt: now },
  { id: 2, username: 'manager', password: '123456', name: '张经理', role: 'MANAGER', active: true, createdAt: now, updatedAt: now },
  { id: 3, username: 'advisor1', password: '123456', name: '李顾问', role: 'ADVISOR', active: true, createdAt: now, updatedAt: now },
  { id: 4, username: 'advisor2', password: '123456', name: '王顾问', role: 'ADVISOR', active: true, createdAt: now, updatedAt: now },
]

const mockAdvisors: Advisor[] = [
  { id: 1, name: '李顾问', userId: 3, role: '资深咨询顾问', active: true, createdAt: now },
  { id: 2, name: '王顾问', userId: 4, role: '咨询顾问', active: true, createdAt: now },
  { id: 3, name: '陈顾问', userId: null, role: '高级咨询顾问', active: true, createdAt: now },
  { id: 4, name: '赵顾问', userId: null, role: '咨询顾问', active: true, createdAt: now },
]

const mockTags: Tag[] = [
  { id: 1, name: '高净值', color: '#E53935', active: true, createdAt: now },
  { id: 2, name: '老客户', color: '#FB8C00', active: true, createdAt: now },
  { id: 3, name: '种植牙意向', color: '#43A047', active: true, createdAt: now },
  { id: 4, name: '牙齿矫正意向', color: '#1E88E5', active: true, createdAt: now },
  { id: 5, name: '美白意向', color: '#8E24AA', active: true, createdAt: now },
  { id: 6, name: 'VIP客户', color: '#00ACC1', active: true, createdAt: now },
  { id: 7, name: '敏感客户', color: '#F4511E', active: true, createdAt: now },
  { id: 8, name: '转介绍', color: '#7CB342', active: true, createdAt: now },
]

const mockLevels: CustomerLevel[] = [
  { id: 1, name: '普通客户', threshold: '0', benefits: '基础服务', active: true, createdAt: now },
  { id: 2, name: '银卡客户', threshold: '5000', benefits: '9.5折优惠、优先预约', active: true, createdAt: now },
  { id: 3, name: '金卡客户', threshold: '20000', benefits: '9折优惠、专属顾问、免费洁牙2次/年', active: true, createdAt: now },
  { id: 4, name: '钻石客户', threshold: '50000', benefits: '8.5折优惠、VIP诊室、全套免费检查、生日礼品', active: true, createdAt: now },
]

const mockChannels: SourceChannel[] = [
  { id: 1, name: '抖音', category: '短视频', active: true, createdAt: now },
  { id: 2, name: '小红书', category: '社交媒体', active: true, createdAt: now },
  { id: 3, name: '美团点评', category: '本地生活', active: true, createdAt: now },
  { id: 4, name: '朋友转介绍', category: '口碑', active: true, createdAt: now },
  { id: 5, name: '百度推广', category: '搜索引擎', active: true, createdAt: now },
  { id: 6, name: '线下门店', category: '自然到店', active: true, createdAt: now },
]

const mockCustomerTags: CustomerTag[] = [
  { customerId: 1, tagId: 1, assignedAt: now },
  { customerId: 1, tagId: 3, assignedAt: now },
  { customerId: 1, tagId: 6, assignedAt: now },
  { customerId: 2, tagId: 2, assignedAt: now },
  { customerId: 2, tagId: 4, assignedAt: now },
  { customerId: 3, tagId: 5, assignedAt: now },
  { customerId: 4, tagId: 3, assignedAt: now },
  { customerId: 4, tagId: 8, assignedAt: now },
  { customerId: 5, tagId: 2, assignedAt: now },
  { customerId: 5, tagId: 7, assignedAt: now },
]

const mockConsults: ConsultRecord[] = [
  { id: 1, customerId: 1, content: '客户咨询全口种植牙方案，对价格比较敏感，建议推荐中端植体品牌。已安排CBCT检查。', consultDate: '2026-06-10T10:00:00Z', operatorId: 1, createdAt: now },
  { id: 2, customerId: 1, content: '二次沟通，客户对种植周期有顾虑，解释了即刻负重方案的优势。', consultDate: '2026-06-12T14:30:00Z', operatorId: 1, createdAt: now },
  { id: 3, customerId: 2, content: '咨询隐形矫正，已取模，等待方案设计。', consultDate: '2026-06-08T09:15:00Z', operatorId: 2, createdAt: now },
  { id: 4, customerId: 3, content: '咨询冷光美白，担心牙齿敏感问题，建议先做脱敏治疗。', consultDate: '2026-06-11T16:00:00Z', operatorId: 2, createdAt: now },
  { id: 5, customerId: 4, content: '朋友介绍过来，需要做两颗种植牙，已安排检查。', consultDate: '2026-06-09T11:20:00Z', operatorId: 3, createdAt: now },
]

const mockConsumptions: Consumption[] = [
  { id: 1, customerId: 1, amount: '15800', project: '韩国奥齿泰种植牙x2', consumeDate: '2026-05-20T00:00:00Z', operatorId: 1, createdAt: now },
  { id: 2, customerId: 1, amount: '800', project: '洁牙+抛光', consumeDate: '2026-04-15T00:00:00Z', operatorId: 1, createdAt: now },
  { id: 3, customerId: 2, amount: '32000', project: '隐适美隐形矫正（首期）', consumeDate: '2026-05-28T00:00:00Z', operatorId: 2, createdAt: now },
  { id: 4, customerId: 2, amount: '1200', project: '口腔检查+取模', consumeDate: '2026-05-10T00:00:00Z', operatorId: 2, createdAt: now },
  { id: 5, customerId: 3, amount: '1800', project: '冷光美白', consumeDate: '2026-06-01T00:00:00Z', operatorId: 2, createdAt: now },
  { id: 6, customerId: 4, amount: '28000', project: '瑞士ITI种植牙x1', consumeDate: '2026-03-15T00:00:00Z', operatorId: 3, createdAt: now },
  { id: 7, customerId: 5, amount: '680', project: '补牙x3', consumeDate: '2026-05-25T00:00:00Z', operatorId: 4, createdAt: now },
]

const mockQuotations: Quotation[] = [
  {
    id: 1, customerId: 1, advisorId: 1, version: 'v1.0', totalAmount: '45000', expireAt: '2026-07-15T00:00:00Z', status: 'SENT',
    expireReason: null, createdAt: '2026-06-10T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
    items: [
      { id: 1, quotationId: 1, itemName: '韩国奥齿泰植体', price: '8000', quantity: 4 },
      { id: 2, quotationId: 1, itemName: '基台', price: '2000', quantity: 4 },
      { id: 3, quotationId: 1, itemName: '全瓷牙冠', price: '3500', quantity: 4 },
      { id: 4, quotationId: 1, itemName: '植骨粉', price: '3000', quantity: 2 },
    ],
    responseNodes: [
      { id: 1, quotationId: 1, nodeName: '方案设计', ownerId: 1, dueAt: '2026-06-12T00:00:00Z', doneAt: '2026-06-11T00:00:00Z', remark: '已完成', createdAt: now },
      { id: 2, quotationId: 1, nodeName: '客户沟通确认', ownerId: 1, dueAt: '2026-06-15T00:00:00Z', doneAt: null, remark: '等待客户回复', createdAt: now },
      { id: 3, quotationId: 1, nodeName: '排期确认', ownerId: 3, dueAt: '2026-06-20T00:00:00Z', doneAt: null, remark: null, createdAt: now },
    ]
  },
  {
    id: 2, customerId: 1, advisorId: 1, version: 'v2.0', totalAmount: '52000', expireAt: '2026-07-20T00:00:00Z', status: 'DRAFT',
    expireReason: null, createdAt: '2026-06-14T10:00:00Z', updatedAt: '2026-06-14T10:00:00Z',
    items: [
      { id: 5, quotationId: 2, itemName: '瑞士ITI植体', price: '12000', quantity: 4 },
      { id: 6, quotationId: 2, itemName: '基台', price: '2500', quantity: 4 },
      { id: 7, quotationId: 2, itemName: '全瓷牙冠', price: '4000', quantity: 4 },
    ],
    responseNodes: [
      { id: 4, quotationId: 2, nodeName: '方案设计', ownerId: 1, dueAt: '2026-06-16T00:00:00Z', doneAt: null, remark: null, createdAt: now },
    ]
  },
  {
    id: 3, customerId: 2, advisorId: 2, version: 'v1.0', totalAmount: '38000', expireAt: '2026-06-10T00:00:00Z', status: 'EXPIRED',
    expireReason: '客户选择了其他诊所，价格因素', createdAt: '2026-05-25T10:00:00Z', updatedAt: '2026-06-11T10:00:00Z',
    items: [
      { id: 8, quotationId: 3, itemName: '隐适美隐形矫正', price: '38000', quantity: 1 },
    ],
    responseNodes: [
      { id: 5, quotationId: 3, nodeName: '方案设计', ownerId: 2, dueAt: '2026-05-28T00:00:00Z', doneAt: '2026-05-27T00:00:00Z', remark: null, createdAt: now },
      { id: 6, quotationId: 3, nodeName: '报价发送', ownerId: 2, dueAt: '2026-05-30T00:00:00Z', doneAt: '2026-05-29T00:00:00Z', remark: null, createdAt: now },
    ]
  },
  {
    id: 4, customerId: 4, advisorId: 3, version: 'v1.0', totalAmount: '28000', expireAt: '2026-07-01T00:00:00Z', status: 'ACCEPTED',
    expireReason: null, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-08T10:00:00Z',
    items: [
      { id: 9, quotationId: 4, itemName: '瑞士ITI植体', price: '14000', quantity: 2 },
      { id: 10, quotationId: 4, itemName: '基台+牙冠', price: '0', quantity: 0 },
    ],
    responseNodes: [
      { id: 7, quotationId: 4, nodeName: '方案设计', ownerId: 3, dueAt: '2026-06-03T00:00:00Z', doneAt: '2026-06-02T00:00:00Z', remark: null, createdAt: now },
      { id: 8, quotationId: 4, nodeName: '客户确认', ownerId: 3, dueAt: '2026-06-08T00:00:00Z', doneAt: '2026-06-08T00:00:00Z', remark: '客户已确认，安排手术', createdAt: now },
    ]
  },
]

const mockReturnPlans: ReturnPlan[] = [
  { id: 1, customerId: 1, assigneeId: 1, planDate: '2026-06-18T10:00:00Z', planType: 'QUOTATION', content: '跟进种植牙报价，确认客户是否有进一步疑问', status: 'PENDING', resultNote: null, createdAt: now },
  { id: 2, customerId: 2, assigneeId: 2, planDate: '2026-06-17T14:00:00Z', planType: 'FOLLOW_UP', content: '跟进矫正方案，了解客户对比结果', status: 'PENDING', resultNote: null, createdAt: now },
  { id: 3, customerId: 3, assigneeId: 2, planDate: '2026-06-20T11:00:00Z', planType: 'REVISIT', content: '美白后一周回访，确认效果及有无不适', status: 'PENDING', resultNote: null, createdAt: now },
  { id: 4, customerId: 4, assigneeId: 3, planDate: '2026-06-15T09:00:00Z', planType: 'REVISIT', content: '种植牙术后回访，确认恢复情况', status: 'DONE', resultNote: '客户恢复良好，无异常', createdAt: now },
  { id: 5, customerId: 5, assigneeId: 4, planDate: '2026-06-25T15:00:00Z', planType: 'FOLLOW_UP', content: '补牙后回访，询问使用感受', status: 'PENDING', resultNote: null, createdAt: now },
]

const mockChurnRecords: ChurnRecord[] = [
  { id: 1, customerId: 6, reasonCode: 'PRICE', reasonDetail: '客户认为报价过高，选择了周边更便宜的诊所', quotationId: 3, churnDate: '2026-06-12T00:00:00Z', createdAt: now },
]

const mockCustomers: Customer[] = [
  { id: 1, name: '张德华', phone: '13800138001', gender: 'M', age: 52, leadQuality: 'A', consultIntent: '全口种植牙', returnPreference: '工作日上午电话联系', totalConsumption: '16600', visitCount: 5, levelId: 3, advisorId: 1, sourceChannelId: 1, createdAt: '2026-01-15T10:00:00Z', updatedAt: now, tagIds: [1, 3, 6] },
  { id: 2, name: '李美玲', phone: '13800138002', gender: 'F', age: 28, leadQuality: 'A', consultIntent: '隐形矫正', returnPreference: '周末微信联系', totalConsumption: '33200', visitCount: 4, levelId: 3, advisorId: 2, sourceChannelId: 2, createdAt: '2026-02-20T14:00:00Z', updatedAt: now, tagIds: [2, 4] },
  { id: 3, name: '王思琪', phone: '13800138003', gender: 'F', age: 31, leadQuality: 'B', consultIntent: '牙齿美白', returnPreference: '工作日下午', totalConsumption: '1800', visitCount: 2, levelId: 1, advisorId: 2, sourceChannelId: 3, createdAt: '2026-05-10T16:00:00Z', updatedAt: now, tagIds: [5] },
  { id: 4, name: '陈建国', phone: '13800138004', gender: 'M', age: 58, leadQuality: 'A', consultIntent: '种植牙', returnPreference: '上午电话联系', totalConsumption: '28000', visitCount: 6, levelId: 4, advisorId: 3, sourceChannelId: 4, createdAt: '2026-03-01T09:00:00Z', updatedAt: now, tagIds: [3, 8] },
  { id: 5, name: '刘小燕', phone: '13800138005', gender: 'F', age: 26, leadQuality: 'C', consultIntent: '补牙/洁牙', returnPreference: '随时微信', totalConsumption: '680', visitCount: 1, levelId: 1, advisorId: 4, sourceChannelId: 5, createdAt: '2026-05-20T11:00:00Z', updatedAt: now, tagIds: [2, 7] },
  { id: 6, name: '赵志强', phone: '13800138006', gender: 'M', age: 45, leadQuality: 'B', consultIntent: '隐形矫正', returnPreference: '周末联系', totalConsumption: '1200', visitCount: 2, levelId: 2, advisorId: 2, sourceChannelId: 2, createdAt: '2026-04-15T13:00:00Z', updatedAt: now, tagIds: [4] },
  { id: 7, name: '孙雪梅', phone: '13800138007', gender: 'F', age: 42, leadQuality: 'B', consultIntent: '美容修复', returnPreference: '工作日下午', totalConsumption: '8500', visitCount: 3, levelId: 2, advisorId: 1, sourceChannelId: 6, createdAt: '2026-02-10T10:00:00Z', updatedAt: now, tagIds: [6] },
  { id: 8, name: '周明辉', phone: '13800138008', gender: 'M', age: 35, leadQuality: 'C', consultIntent: '常规检查', returnPreference: '周末上午', totalConsumption: '320', visitCount: 1, levelId: 1, advisorId: 4, sourceChannelId: 3, createdAt: '2026-06-01T10:00:00Z', updatedAt: now, tagIds: [] },
  { id: 9, name: '吴丽娟', phone: '13800138009', gender: 'F', age: 50, leadQuality: 'A', consultIntent: '全口烤瓷牙', returnPreference: '工作日电话', totalConsumption: '35000', visitCount: 8, levelId: 4, advisorId: 3, sourceChannelId: 4, createdAt: '2025-12-01T10:00:00Z', updatedAt: now, tagIds: [1, 6, 8] },
  { id: 10, name: '郑浩然', phone: '13800138010', gender: 'M', age: 23, leadQuality: 'D', consultIntent: '智齿拔除', returnPreference: '微信联系', totalConsumption: '800', visitCount: 1, levelId: 1, advisorId: 4, sourceChannelId: 1, createdAt: '2026-06-10T15:00:00Z', updatedAt: now, tagIds: [] },
  { id: 11, name: '黄雅婷', phone: '13800138011', gender: 'F', age: 29, leadQuality: 'B', consultIntent: '贴面美容', returnPreference: '随时联系', totalConsumption: '5600', visitCount: 3, levelId: 2, advisorId: 2, sourceChannelId: 2, createdAt: '2026-03-15T14:00:00Z', updatedAt: now, tagIds: [5, 6] },
  { id: 12, name: '马建军', phone: '13800138012', gender: 'M', age: 60, leadQuality: 'B', consultIntent: '活动义齿', returnPreference: '上午电话', totalConsumption: '4200', visitCount: 4, levelId: 1, advisorId: 1, sourceChannelId: 6, createdAt: '2026-01-20T10:00:00Z', updatedAt: now, tagIds: [2] },
]

let customersData = [...mockCustomers]
let customerTagsData = [...mockCustomerTags]
let consultsData = [...mockConsults]
let consumptionsData = [...mockConsumptions]
let quotationsData = [...mockQuotations]
let returnPlansData = [...mockReturnPlans]
let churnRecordsData = [...mockChurnRecords]
let tagsData = [...mockTags]
let levelsData = [...mockLevels]
let advisorsData = [...mockAdvisors]
let channelsData = [...mockChannels]
let usersData = [...mockUsers]

let nextIds = {
  customer: 13,
  consult: 6,
  consumption: 8,
  quotation: 5,
  returnPlan: 6,
  churn: 2,
  tag: 9,
  level: 5,
  advisor: 5,
  channel: 7,
  responseNode: 9,
  quotationItem: 11,
}

export const mockPrisma = {
  user: {
    findMany: async () => usersData,
    findUnique: async ({ where }: { where: { id?: number; username?: string } }) => {
      return usersData.find(u => (where.id && u.id === where.id) || (where.username && u.username === where.username)) || null
    },
  },
  advisor: {
    findMany: async () => advisorsData.filter(a => a.active),
    findUnique: async ({ where }: { where: { id: number } }) => advisorsData.find(a => a.id === where.id) || null,
  },
  tag: {
    findMany: async () => tagsData.filter(t => t.active),
    findUnique: async ({ where }: { where: { id: number } }) => tagsData.find(t => t.id === where.id) || null,
    create: async ({ data }: { data: Omit<Tag, 'id' | 'createdAt'> }) => {
      const tag: Tag = { id: nextIds.tag++, ...data, createdAt: new Date().toISOString() }
      tagsData.push(tag)
      return tag
    },
    update: async ({ where, data }: { where: { id: number }; data: Partial<Tag> }) => {
      const idx = tagsData.findIndex(t => t.id === where.id)
      if (idx >= 0) {
        tagsData[idx] = { ...tagsData[idx], ...data }
        return tagsData[idx]
      }
      return null
    },
  },
  customerLevel: {
    findMany: async () => levelsData.filter(l => l.active),
    findUnique: async ({ where }: { where: { id: number } }) => levelsData.find(l => l.id === where.id) || null,
    create: async ({ data }: { data: Omit<CustomerLevel, 'id' | 'createdAt'> }) => {
      const level: CustomerLevel = { id: nextIds.level++, ...data, createdAt: new Date().toISOString() }
      levelsData.push(level)
      return level
    },
    update: async ({ where, data }: { where: { id: number }; data: Partial<CustomerLevel> }) => {
      const idx = levelsData.findIndex(l => l.id === where.id)
      if (idx >= 0) {
        levelsData[idx] = { ...levelsData[idx], ...data }
        return levelsData[idx]
      }
      return null
    },
  },
  sourceChannel: {
    findMany: async () => channelsData.filter(c => c.active),
    findUnique: async ({ where }: { where: { id: number } }) => channelsData.find(c => c.id === where.id) || null,
  },
  customer: {
    findMany: async (opts?: { where?: any; orderBy?: any }) => {
      let result = [...customersData]
      if (opts?.where) {
        const w = opts.where
        if (w.leadQuality) result = result.filter(c => c.leadQuality === w.leadQuality)
        if (w.levelId) result = result.filter(c => c.levelId === w.levelId)
        if (w.advisorId) result = result.filter(c => c.advisorId === w.advisorId)
        if (w.sourceChannelId) result = result.filter(c => c.sourceChannelId === w.sourceChannelId)
        if (w.OR) {
          const or = w.OR as any[]
          result = result.filter(c => or.some(cond => {
            if (cond.name?.contains) return c.name.includes(cond.name.contains)
            if (cond.phone?.contains) return c.phone.includes(cond.phone.contains)
            return true
          }))
        }
      }
      return result
    },
    findUnique: async ({ where }: { where: { id: number } }) => customersData.find(c => c.id === where.id) || null,
    create: async ({ data }: { data: any }) => {
      const customer: Customer = {
        id: nextIds.customer++,
        name: data.name,
        phone: data.phone,
        gender: data.gender || 'UNKNOWN',
        age: data.age || null,
        leadQuality: data.leadQuality || 'B',
        consultIntent: data.consultIntent || '',
        returnPreference: data.returnPreference || null,
        totalConsumption: '0',
        visitCount: 0,
        levelId: data.levelId || null,
        advisorId: data.advisorId || null,
        sourceChannelId: data.sourceChannelId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tagIds: data.tagIds || [],
      }
      customersData.push(customer)
      if (data.tagIds?.length) {
        data.tagIds.forEach((tagId: number) => {
          customerTagsData.push({ customerId: customer.id, tagId, assignedAt: new Date().toISOString() })
        })
      }
      return customer
    },
    update: async ({ where, data }: { where: { id: number }; data: any }) => {
      const idx = customersData.findIndex(c => c.id === where.id)
      if (idx < 0) return null
      const oldTagIds = customersData[idx].tagIds
      customersData[idx] = {
        ...customersData[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      if (data.tagIds) {
        customerTagsData = customerTagsData.filter(ct => ct.customerId !== where.id)
        data.tagIds.forEach((tagId: number) => {
          customerTagsData.push({ customerId: where.id, tagId, assignedAt: new Date().toISOString() })
        })
      }
      return customersData[idx]
    },
  },
  customerTag: {
    findMany: async ({ where }: { where?: { customerId?: number; tagId?: number } } = {}) => {
      let result = [...customerTagsData]
      if (where?.customerId) result = result.filter(ct => ct.customerId === where.customerId)
      if (where?.tagId) result = result.filter(ct => ct.tagId === where.tagId)
      return result
    },
  },
  consultRecord: {
    findMany: async ({ where }: { where?: { customerId?: number } } = {}) => {
      let result = [...consultsData]
      if (where?.customerId) result = result.filter(c => c.customerId === where.customerId)
      return result.sort((a, b) => new Date(b.consultDate).getTime() - new Date(a.consultDate).getTime())
    },
    create: async ({ data }: { data: Omit<ConsultRecord, 'id' | 'createdAt'> }) => {
      const record: ConsultRecord = { id: nextIds.consult++, ...data, createdAt: new Date().toISOString() }
      consultsData.push(record)
      const cIdx = customersData.findIndex(c => c.id === data.customerId)
      if (cIdx >= 0) {
        customersData[cIdx].visitCount += 1
        customersData[cIdx].updatedAt = new Date().toISOString()
      }
      return record
    },
  },
  consumption: {
    findMany: async ({ where }: { where?: { customerId?: number } } = {}) => {
      let result = [...consumptionsData]
      if (where?.customerId) result = result.filter(c => c.customerId === where.customerId)
      return result.sort((a, b) => new Date(b.consumeDate).getTime() - new Date(a.consumeDate).getTime())
    },
    create: async ({ data }: { data: Omit<Consumption, 'id' | 'createdAt'> }) => {
      const record: Consumption = { id: nextIds.consumption++, ...data, createdAt: new Date().toISOString() }
      consumptionsData.push(record)
      const cIdx = customersData.findIndex(c => c.id === data.customerId)
      if (cIdx >= 0) {
        const current = parseFloat(customersData[cIdx].totalConsumption)
        const add = parseFloat(data.amount)
        customersData[cIdx].totalConsumption = (current + add).toFixed(2)
        customersData[cIdx].visitCount += 1
        customersData[cIdx].updatedAt = new Date().toISOString()
      }
      return record
    },
  },
  quotation: {
    findMany: async ({ where }: { where?: { customerId?: number } } = {}) => {
      let result = [...quotationsData]
      if (where?.customerId) result = result.filter(q => q.customerId === where.customerId)
      return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    findUnique: async ({ where }: { where: { id: number } }) => quotationsData.find(q => q.id === where.id) || null,
  },
  responseNode: {
    findMany: async ({ where }: { where?: { quotationId?: number } } = {}) => {
      let result: ResponseNode[] = []
      quotationsData.forEach(q => result = result.concat(q.responseNodes))
      if (where?.quotationId) result = result.filter(r => r.quotationId === where.quotationId)
      return result
    },
  },
  returnPlan: {
    findMany: async ({ where }: { where?: { customerId?: number } } = {}) => {
      let result = [...returnPlansData]
      if (where?.customerId) result = result.filter(r => r.customerId === where.customerId)
      return result.sort((a, b) => new Date(b.planDate).getTime() - new Date(a.planDate).getTime())
    },
    create: async ({ data }: { data: Omit<ReturnPlan, 'id' | 'createdAt' | 'status' | 'resultNote'> }) => {
      const plan: ReturnPlan = { id: nextIds.returnPlan++, ...data, status: 'PENDING', resultNote: null, createdAt: new Date().toISOString() }
      returnPlansData.push(plan)
      return plan
    },
  },
  churnRecord: {
    findUnique: async ({ where }: { where: { customerId?: number; id?: number } }) => {
      return churnRecordsData.find(c => (where.customerId && c.customerId === where.customerId) || (where.id && c.id === where.id)) || null
    },
    create: async ({ data }: { data: Omit<ChurnRecord, 'id' | 'createdAt'> }) => {
      const record: ChurnRecord = { id: nextIds.churn++, ...data, createdAt: new Date().toISOString() }
      churnRecordsData.push(record)
      return record
    },
  },
}

export function successResponse<T>(data: T, message = 'ok') {
  return { code: 0, data, message }
}

export function errorResponse(message: string, code = 1, data: any = null) {
  return { code, data, message }
}
