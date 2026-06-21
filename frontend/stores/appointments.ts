import { defineStore } from 'pinia'
import { ref } from 'vue'

export type OrderStatus = 'pending' | 'confirmed' | 'in_service' | 'completed' | 'cancelled' | 'after_sale'

export type PackageStatus = 'on_shelf' | 'off_shelf'

export type AfterSaleStatus = 'pending' | 'processing' | 'resolved' | 'rejected'

export interface Customer {
  id: string
  name: string
  phone: string
  avatar?: string
  memberLevel: '普通' | '银卡' | '金卡' | '钻石'
}

export interface Pet {
  id: string
  name: string
  species: '狗' | '猫' | '其他'
  breed: string
  age: number
  weight: number
  gender: '公' | '母'
  avatar?: string
}

export interface ServicePackage {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  duration: number
  services: string[]
  image: string
  status: PackageStatus
  sort: number
  createdAt: string
}

export interface ServiceRecord {
  id: string
  staffName: string
  serviceName: string
  startTime: string
  endTime?: string
  status: 'pending' | 'in_progress' | 'completed'
  note?: string
}

export interface AfterSaleRequest {
  id: string
  orderId: string
  type: 'refund' | 'exchange' | 'complaint'
  reason: string
  description: string
  status: AfterSaleStatus
  createdAt: string
  handledAt?: string
  handler?: string
  result?: string
}

export interface OperationLog {
  id: string
  user: string
  action: string
  target: string
  time: string
  remark?: string
}

export interface Appointment {
  id: string
  orderNo: string
  customer: Customer
  pet: Pet
  packageId: string
  packageName: string
  serviceType: string
  appointmentTime: string
  checkInTime?: string
  completeTime?: string
  status: OrderStatus
  amount: number
  discount: number
  paidAmount: number
  paymentMethod: string
  address?: string
  note?: string
  staffName?: string
  serviceRecords: ServiceRecord[]
  photos: string[]
  afterSaleRequests: AfterSaleRequest[]
  logs: OperationLog[]
  createdAt: string
}

export const statusOptions: { label: string; value: OrderStatus; color: string }[] = [
  { label: '待确认', value: 'pending', color: '#F59E0B' },
  { label: '已确认', value: 'confirmed', color: '#3B82F6' },
  { label: '服务中', value: 'in_service', color: '#8B5CF6' },
  { label: '已完成', value: 'completed', color: '#1A8A7D' },
  { label: '已取消', value: 'cancelled', color: '#6B7280' },
  { label: '售后中', value: 'after_sale', color: '#EF4444' },
]

export const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_service: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  after_sale: '售后中',
}

export const statusColorMap: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_service: '#8B5CF6',
  completed: '#1A8A7D',
  cancelled: '#6B7280',
  after_sale: '#EF4444',
}

export const afterSaleStatusMap: Record<AfterSaleStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#F59E0B' },
  processing: { label: '处理中', color: '#3B82F6' },
  resolved: { label: '已解决', color: '#1A8A7D' },
  rejected: { label: '已拒绝', color: '#EF4444' },
}

const mockCustomers: Customer[] = [
  { id: 'c1', name: '李女士', phone: '138****1234', memberLevel: '金卡' },
  { id: 'c2', name: '陈先生', phone: '139****5678', memberLevel: '钻石' },
  { id: 'c3', name: '王女士', phone: '137****9012', memberLevel: '银卡' },
  { id: 'c4', name: '张先生', phone: '136****3456', memberLevel: '普通' },
  { id: 'c5', name: '刘女士', phone: '135****7890', memberLevel: '金卡' },
]

const mockPets: Pet[] = [
  { id: 'p1', name: '奶茶', species: '猫', breed: '英短蓝猫', age: 2, weight: 4.5, gender: '母' },
  { id: 'p2', name: '豆豆', species: '狗', breed: '金毛犬', age: 3, weight: 28, gender: '公' },
  { id: 'p3', name: '糯米', species: '猫', breed: '布偶猫', age: 1, weight: 3.2, gender: '公' },
  { id: 'p4', name: '可乐', species: '狗', breed: '柯基', age: 4, weight: 12, gender: '母' },
  { id: 'p5', name: '糖糖', species: '猫', breed: '美短', age: 5, weight: 5.1, gender: '母' },
]

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref<Appointment[]>([
    {
      id: '1',
      orderNo: 'AP20240622001',
      customer: mockCustomers[0],
      pet: mockPets[0],
      packageId: 'pkg1',
      packageName: '基础洗护套餐',
      serviceType: '洗护',
      appointmentTime: '2024-06-22 10:00',
      checkInTime: '2024-06-22 09:58',
      status: 'in_service',
      amount: 198,
      discount: 20,
      paidAmount: 178,
      paymentMethod: '微信支付',
      note: '宠物比较胆小，请轻柔操作',
      staffName: '张小明',
      serviceRecords: [
        { id: 'sr1', staffName: '张小明', serviceName: '洗澡', startTime: '2024-06-22 10:10', status: 'completed', note: '水温38度，使用温和沐浴露' },
        { id: 'sr2', staffName: '张小明', serviceName: '吹干', startTime: '2024-06-22 10:45', status: 'in_progress', note: '低温慢吹' },
        { id: 'sr3', staffName: '张小明', serviceName: '剪指甲', startTime: '2024-06-22 11:15', status: 'pending' },
      ],
      photos: [
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      ],
      afterSaleRequests: [],
      logs: [
        { id: 'log1', user: '系统', action: '创建订单', target: '订单#AP20240622001', time: '2024-06-20 14:30', remark: '客户在线预约' },
        { id: 'log2', user: '赵小芳', action: '确认订单', target: '订单#AP20240622001', time: '2024-06-20 15:00', remark: '安排美容师张小明' },
        { id: 'log3', user: '张小明', action: '开始服务', target: '订单#AP20240622001', time: '2024-06-22 10:05' },
      ],
      createdAt: '2024-06-20 14:30',
    },
    {
      id: '2',
      orderNo: 'AP20240622002',
      customer: mockCustomers[1],
      pet: mockPets[1],
      packageId: 'pkg2',
      packageName: '精护SPA套餐',
      serviceType: 'SPA',
      appointmentTime: '2024-06-22 14:00',
      status: 'confirmed',
      amount: 598,
      discount: 60,
      paidAmount: 538,
      paymentMethod: '会员余额',
      staffName: '李小红',
      serviceRecords: [],
      photos: [],
      afterSaleRequests: [],
      logs: [
        { id: 'log1', user: '陈先生', action: '创建订单', target: '订单#AP20240622002', time: '2024-06-21 09:20' },
        { id: 'log2', user: '赵小芳', action: '确认订单', target: '订单#AP20240622002', time: '2024-06-21 09:45', remark: '安排美容师李小红' },
      ],
      createdAt: '2024-06-21 09:20',
    },
    {
      id: '3',
      orderNo: 'AP20240621008',
      customer: mockCustomers[2],
      pet: mockPets[2],
      packageId: 'pkg1',
      packageName: '基础洗护套餐',
      serviceType: '洗护',
      appointmentTime: '2024-06-21 15:30',
      checkInTime: '2024-06-21 15:25',
      completeTime: '2024-06-21 17:10',
      status: 'completed',
      amount: 198,
      discount: 0,
      paidAmount: 198,
      paymentMethod: '支付宝',
      staffName: '李小红',
      serviceRecords: [
        { id: 'sr1', staffName: '李小红', serviceName: '洗澡', startTime: '2024-06-21 15:35', endTime: '2024-06-21 16:05', status: 'completed' },
        { id: 'sr2', staffName: '李小红', serviceName: '吹干造型', startTime: '2024-06-21 16:10', endTime: '2024-06-21 16:50', status: 'completed' },
        { id: 'sr3', staffName: '李小红', serviceName: '剪指甲+清耳朵', startTime: '2024-06-21 16:55', endTime: '2024-06-21 17:08', status: 'completed' },
      ],
      photos: [
        'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400',
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400',
        'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400',
      ],
      afterSaleRequests: [],
      logs: [
        { id: 'log1', user: '系统', action: '创建订单', target: '订单#AP20240621008', time: '2024-06-20 16:00' },
        { id: 'log2', user: '赵小芳', action: '确认订单', target: '订单#AP20240621008', time: '2024-06-20 16:20' },
        { id: 'log3', user: '李小红', action: '开始服务', target: '订单#AP20240621008', time: '2024-06-21 15:30' },
        { id: 'log4', user: '李小红', action: '完成服务', target: '订单#AP20240621008', time: '2024-06-21 17:10', remark: '客户非常满意' },
      ],
      createdAt: '2024-06-20 16:00',
    },
    {
      id: '4',
      orderNo: 'AP20240620015',
      customer: mockCustomers[3],
      pet: mockPets[3],
      packageId: 'pkg3',
      packageName: '医疗体检套餐',
      serviceType: '医疗',
      appointmentTime: '2024-06-20 11:00',
      checkInTime: '2024-06-20 10:55',
      completeTime: '2024-06-20 14:30',
      status: 'after_sale',
      amount: 899,
      discount: 100,
      paidAmount: 799,
      paymentMethod: '微信支付',
      note: '定期年度体检',
      staffName: '兽医王医生',
      serviceRecords: [
        { id: 'sr1', staffName: '王医生', serviceName: '基础检查', startTime: '2024-06-20 11:10', endTime: '2024-06-20 11:40', status: 'completed' },
        { id: 'sr2', staffName: '王医生', serviceName: '血液检测', startTime: '2024-06-20 11:50', endTime: '2024-06-20 13:00', status: 'completed' },
        { id: 'sr3', staffName: '王医生', serviceName: 'X光检查', startTime: '2024-06-20 13:20', endTime: '2024-06-20 14:15', status: 'completed' },
      ],
      photos: [],
      afterSaleRequests: [
        {
          id: 'as1',
          orderId: '4',
          type: 'complaint',
          reason: '服务态度问题',
          description: '等待时间过长，前台态度不好',
          status: 'processing',
          createdAt: '2024-06-21 10:30',
          handler: '张店长',
        },
      ],
      logs: [
        { id: 'log1', user: '系统', action: '创建订单', target: '订单#AP20240620015', time: '2024-06-19 09:00' },
        { id: 'log2', user: '赵小芳', action: '确认订单', target: '订单#AP20240620015', time: '2024-06-19 09:30' },
        { id: 'log3', user: '王医生', action: '开始服务', target: '订单#AP20240620015', time: '2024-06-20 11:00' },
        { id: 'log4', user: '王医生', action: '完成服务', target: '订单#AP20240620015', time: '2024-06-20 14:30' },
        { id: 'log5', user: '系统', action: '发起售后', target: '订单#AP20240620015', time: '2024-06-21 10:30', remark: '客户投诉' },
      ],
      createdAt: '2024-06-19 09:00',
    },
    {
      id: '5',
      orderNo: 'AP20240623003',
      customer: mockCustomers[4],
      pet: mockPets[4],
      packageId: 'pkg2',
      packageName: '精护SPA套餐',
      serviceType: 'SPA',
      appointmentTime: '2024-06-23 09:30',
      status: 'pending',
      amount: 598,
      discount: 60,
      paidAmount: 538,
      paymentMethod: '微信支付',
      serviceRecords: [],
      photos: [],
      afterSaleRequests: [],
      logs: [
        { id: 'log1', user: '刘女士', action: '创建订单', target: '订单#AP20240623003', time: '2024-06-22 08:15' },
      ],
      createdAt: '2024-06-22 08:15',
    },
    {
      id: '6',
      orderNo: 'AP20240619007',
      customer: mockCustomers[0],
      pet: mockPets[0],
      packageId: 'pkg1',
      packageName: '基础洗护套餐',
      serviceType: '洗护',
      appointmentTime: '2024-06-19 16:00',
      status: 'cancelled',
      amount: 198,
      discount: 0,
      paidAmount: 0,
      paymentMethod: '',
      note: '客户临时有事取消',
      serviceRecords: [],
      photos: [],
      afterSaleRequests: [],
      logs: [
        { id: 'log1', user: '系统', action: '创建订单', target: '订单#AP20240619007', time: '2024-06-18 14:00' },
        { id: 'log2', user: '赵小芳', action: '确认订单', target: '订单#AP20240619007', time: '2024-06-18 14:20' },
        { id: 'log3', user: '李女士', action: '取消订单', target: '订单#AP20240619007', time: '2024-06-19 08:30', remark: '客户主动取消' },
      ],
      createdAt: '2024-06-18 14:00',
    },
  ])

  const packages = ref<ServicePackage[]>([
    {
      id: 'pkg1',
      name: '基础洗护套餐',
      description: '适合日常清洁护理，包含洗澡、吹干、基础修剪',
      price: 198,
      originalPrice: 258,
      duration: 90,
      services: ['专业洗澡', '吹干造型', '修剪指甲', '清洁耳道', '挤肛门腺', '基础毛发梳理'],
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600',
      status: 'on_shelf',
      sort: 1,
      createdAt: '2024-01-15',
    },
    {
      id: 'pkg2',
      name: '精护SPA套餐',
      description: '深度滋养护理，SPA浴+专业按摩，让宠物享受极致呵护',
      price: 598,
      originalPrice: 798,
      duration: 180,
      services: ['药浴SPA', '深度清洁', '臭氧消毒', '专业按摩', '精油护理', '造型修剪', '牙齿清洁', '驱虫护理'],
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
      status: 'on_shelf',
      sort: 2,
      createdAt: '2024-01-15',
    },
    {
      id: 'pkg3',
      name: '医疗体检套餐',
      description: '全面健康检查，由专业兽医执行，及早发现潜在健康问题',
      price: 899,
      originalPrice: 1299,
      duration: 240,
      services: ['基础体征检查', '血常规检测', '生化全套', '腹部B超', 'X光片', '心电图', '寄生虫筛查', '兽医咨询'],
      image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600',
      status: 'on_shelf',
      sort: 3,
      createdAt: '2024-02-01',
    },
    {
      id: 'pkg4',
      name: '造型设计套餐',
      description: '专业宠物造型师量身打造，适合参加比赛或特殊场合',
      price: 398,
      originalPrice: 498,
      duration: 150,
      services: ['洗澡护理', '创意造型', '染色挑染', '毛发护理', '指甲彩绘', '配饰搭配', '前后对比照'],
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
      status: 'off_shelf',
      sort: 4,
      createdAt: '2024-02-10',
    },
    {
      id: 'pkg5',
      name: '寄养护理套餐',
      description: '专业寄养服务，24小时专人照料，提供每日遛弯和视频反馈',
      price: 128,
      originalPrice: 168,
      duration: 1440,
      services: ['独立房间', '每日三餐', '定时遛弯', '视频监控', '日常护理', '健康监测', '紧急联系'],
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600',
      status: 'on_shelf',
      sort: 5,
      createdAt: '2024-03-01',
    },
  ])

  const selectedAppointmentId = ref<string | null>(null)

  function getAppointmentById(id: string) {
    return appointments.value.find((a) => a.id === id)
  }

  function getPackageById(id: string) {
    return packages.value.find((p) => p.id === id)
  }

  function updateOrderStatus(id: string, status: OrderStatus) {
    const order = appointments.value.find((a) => a.id === id)
    if (order) {
      order.status = status
      order.logs.push({
        id: `log${Date.now()}`,
        user: '管理员',
        action: `状态变更为${statusLabelMap[status]}`,
        target: `订单#${order.orderNo}`,
        time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      })
    }
  }

  function createAfterSale(data: Omit<AfterSaleRequest, 'id' | 'createdAt' | 'status'>) {
    const order = appointments.value.find((a) => a.id === data.orderId)
    if (order) {
      const afterSale: AfterSaleRequest = {
        ...data,
        id: `as${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      }
      order.afterSaleRequests.push(afterSale)
      order.status = 'after_sale'
      order.logs.push({
        id: `log${Date.now()}`,
        user: '管理员',
        action: '发起售后',
        target: `订单#${order.orderNo}`,
        time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        remark: `售后类型：${data.type}，原因：${data.reason}`,
      })
    }
  }

  function handleAfterSale(afterSaleId: string, result: 'resolved' | 'rejected', remark: string) {
    for (const order of appointments.value) {
      const as = order.afterSaleRequests.find((a) => a.id === afterSaleId)
      if (as) {
        as.status = result
        as.handledAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
        as.handler = '管理员'
        as.result = remark
        if (result === 'resolved') {
          order.status = 'completed'
        }
        order.logs.push({
          id: `log${Date.now()}`,
          user: '管理员',
          action: `售后${result === 'resolved' ? '已解决' : '已拒绝'}`,
          target: `订单#${order.orderNo}`,
          time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          remark,
        })
        break
      }
    }
  }

  function togglePackageStatus(id: string) {
    const pkg = packages.value.find((p) => p.id === id)
    if (pkg) {
      pkg.status = pkg.status === 'on_shelf' ? 'off_shelf' : 'on_shelf'
    }
  }

  function savePackage(data: Partial<ServicePackage> & { id?: string }) {
    if (data.id) {
      const index = packages.value.findIndex((p) => p.id === data.id)
      if (index > -1) {
        packages.value[index] = { ...packages.value[index], ...data }
      }
    } else {
      const newPkg: ServicePackage = {
        id: `pkg${Date.now()}`,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        originalPrice: data.originalPrice || 0,
        duration: data.duration || 60,
        services: data.services || [],
        image: data.image || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
        status: data.status || 'off_shelf',
        sort: packages.value.length + 1,
        createdAt: new Date().toISOString().split('T')[0],
      }
      packages.value.push(newPkg)
    }
  }

  function deletePackage(id: string) {
    const index = packages.value.findIndex((p) => p.id === id)
    if (index > -1) {
      packages.value.splice(index, 1)
    }
  }

  return {
    appointments,
    packages,
    selectedAppointmentId,
    getAppointmentById,
    getPackageById,
    updateOrderStatus,
    createAfterSale,
    handleAfterSale,
    togglePackageStatus,
    savePackage,
    deletePackage,
  }
})
