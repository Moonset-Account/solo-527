import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export type LogType = 'create' | 'update' | 'delete' | 'review' | 'login' | 'logout' | 'export'

export interface ChangeField {
  field: string
  fieldLabel: string
  oldValue: string | number | boolean | null
  newValue: string | number | boolean | null
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  avatarColor: string
  type: LogType
  typeLabel: string
  module: string
  action: string
  targetId: string
  targetName: string
  description: string
  timestamp: string
  changes: ChangeField[]
  ip?: string
}

function randomAvatarColor() {
  const colors = ['#1A8A7D', '#6366F1', '#FF8C42', '#EC4899', '#8B5CF6', '#10B981', '#0EA5E9', '#F97316']
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getLogTypeInfo(type: LogType) {
  const map: Record<LogType, { label: string; color: string; tagType: 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
    create: { label: '创建', color: '#10B981', tagType: 'success' },
    update: { label: '修改', color: '#3B82F6', tagType: 'primary' },
    delete: { label: '删除', color: '#EF4444', tagType: 'error' },
    review: { label: '审核', color: '#1A8A7D', tagType: 'success' },
    login: { label: '登录', color: '#8B5CF6', tagType: 'info' },
    logout: { label: '登出', color: '#6B7280', tagType: 'info' },
    export: { label: '导出', color: '#F59E0B', tagType: 'warning' },
  }
  return map[type]
}

export const useAuditLogsStore = defineStore('auditLogs', () => {
  const logs = ref<AuditLog[]>([
    {
      id: 'l1',
      userId: 'u1',
      userName: '张小明',
      userRole: '高级美容师',
      avatarColor: '#1A8A7D',
      type: 'review',
      typeLabel: '审核',
      module: '领养管理',
      action: '审核通过领养申请',
      targetId: 'adopt-001',
      targetName: '李女士 - 奶茶',
      description: '审核通过客户李女士对宠物"奶茶"的领养申请',
      timestamp: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'status', fieldLabel: '审核状态', oldValue: 'pending', newValue: 'approved' },
        { field: 'reviewer', fieldLabel: '审核人', oldValue: null, newValue: '张小明' },
      ],
      ip: '192.168.1.101',
    },
    {
      id: 'l2',
      userId: 'u2',
      userName: '李小红',
      userRole: '护理师',
      avatarColor: '#6366F1',
      type: 'create',
      typeLabel: '创建',
      module: '订单管理',
      action: '创建洗护订单',
      targetId: 'order-20240032',
      targetName: '订单#20240032',
      description: '为客户王先生创建金毛犬洗护服务订单',
      timestamp: dayjs().subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'orderNo', fieldLabel: '订单编号', oldValue: null, newValue: '20240032' },
        { field: 'serviceType', fieldLabel: '服务类型', oldValue: null, newValue: '洗护' },
        { field: 'petName', fieldLabel: '宠物名称', oldValue: null, newValue: '豆豆' },
        { field: 'amount', fieldLabel: '订单金额', oldValue: null, newValue: 288 },
      ],
      ip: '192.168.1.102',
    },
    {
      id: 'l3',
      userId: 'u3',
      userName: '王小刚',
      userRole: '寄养专员',
      avatarColor: '#FF8C42',
      type: 'update',
      typeLabel: '修改',
      module: '宠物档案',
      action: '更新宠物健康档案',
      targetId: 'pet-007',
      targetName: '宠物：豆豆',
      description: '更新宠物"豆豆"的健康档案，补充今日体检数据',
      timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'weight', fieldLabel: '体重(kg)', oldValue: '12.5', newValue: '12.8' },
        { field: 'temperature', fieldLabel: '体温(℃)', oldValue: '38.2', newValue: '38.5' },
        { field: 'healthNote', fieldLabel: '健康备注', oldValue: '正常', newValue: '食欲略有下降，建议观察' },
      ],
      ip: '192.168.1.103',
    },
    {
      id: 'l4',
      userId: 'u4',
      userName: '赵小芳',
      userRole: '前台接待',
      avatarColor: '#EC4899',
      type: 'delete',
      typeLabel: '删除',
      module: '订单管理',
      action: '删除作废订单',
      targetId: 'order-20240021',
      targetName: '订单#20240021',
      description: '删除客户取消的作废订单#20240021',
      timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'status', fieldLabel: '订单状态', oldValue: 'cancelled', newValue: null },
      ],
      ip: '192.168.1.104',
    },
    {
      id: 'l5',
      userId: 'u1',
      userName: '张小明',
      userRole: '高级美容师',
      avatarColor: '#1A8A7D',
      type: 'update',
      typeLabel: '修改',
      module: '回访管理',
      action: '完成回访记录',
      targetId: 'visit-0045',
      targetName: '客户：陈先生',
      description: '完成对客户陈先生的售后回访并记录反馈',
      timestamp: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'status', fieldLabel: '回访状态', oldValue: 'pending', newValue: 'completed' },
        { field: 'feedback', fieldLabel: '客户反馈', oldValue: '', newValue: '服务满意，下次还会光顾' },
        { field: 'rating', fieldLabel: '评分', oldValue: null, newValue: 5 },
      ],
      ip: '192.168.1.101',
    },
    {
      id: 'l6',
      userId: 'u5',
      userName: '孙小伟',
      userRole: '美容师助理',
      avatarColor: '#8B5CF6',
      type: 'login',
      typeLabel: '登录',
      module: '系统登录',
      action: '用户登录系统',
      targetId: 'user-u5',
      targetName: '孙小伟',
      description: '用户孙小伟成功登录系统',
      timestamp: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [],
      ip: '192.168.1.105',
    },
    {
      id: 'l7',
      userId: 'u2',
      userName: '李小红',
      userRole: '护理师',
      avatarColor: '#6366F1',
      type: 'export',
      typeLabel: '导出',
      module: '报表中心',
      action: '导出月度报表',
      targetId: 'report-2024-06',
      targetName: '2024年6月经营报表',
      description: '导出2024年6月经营数据报表（Excel格式）',
      timestamp: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [],
      ip: '192.168.1.102',
    },
    {
      id: 'l8',
      userId: 'u6',
      userName: '周小美',
      userRole: '资深美容师',
      avatarColor: '#10B981',
      type: 'update',
      typeLabel: '修改',
      module: '排班管理',
      action: '调整排班安排',
      targetId: 'schedule-w25',
      targetName: '第25周排班',
      description: '调整下周三排班，将本人班次从晚班改为全天',
      timestamp: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'shift_06_19', fieldLabel: '6月19日班次', oldValue: 'evening', newValue: 'full' },
      ],
      ip: '192.168.1.106',
    },
    {
      id: 'l9',
      userId: 'u3',
      userName: '王小刚',
      userRole: '寄养专员',
      avatarColor: '#FF8C42',
      type: 'review',
      typeLabel: '审核',
      module: '寄养管理',
      action: '审核寄养申请',
      targetId: 'foster-012',
      targetName: '寄养：小白',
      description: '审核通过宠物"小白"的寄养入住申请',
      timestamp: dayjs().subtract(7, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'status', fieldLabel: '审核状态', oldValue: 'pending', newValue: 'approved' },
        { field: 'roomNo', fieldLabel: '分配房间', oldValue: null, newValue: 'A-03' },
      ],
      ip: '192.168.1.103',
    },
    {
      id: 'l10',
      userId: 'u4',
      userName: '赵小芳',
      userRole: '前台接待',
      avatarColor: '#EC4899',
      type: 'create',
      typeLabel: '创建',
      module: '客户管理',
      action: '新增客户档案',
      targetId: 'customer-089',
      targetName: '客户：刘女士',
      description: '为新客户刘女士建立客户档案',
      timestamp: dayjs().subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'name', fieldLabel: '客户姓名', oldValue: null, newValue: '刘女士' },
        { field: 'phone', fieldLabel: '联系电话', oldValue: null, newValue: '138****5678' },
        { field: 'petName', fieldLabel: '宠物名称', oldValue: null, newValue: '咪咪' },
      ],
      ip: '192.168.1.104',
    },
    {
      id: 'l11',
      userId: 'u1',
      userName: '张小明',
      userRole: '高级美容师',
      avatarColor: '#1A8A7D',
      type: 'logout',
      typeLabel: '登出',
      module: '系统登录',
      action: '用户退出系统',
      targetId: 'user-u1',
      targetName: '张小明',
      description: '用户张小明安全退出系统',
      timestamp: dayjs().subtract(9, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [],
      ip: '192.168.1.101',
    },
    {
      id: 'l12',
      userId: 'u6',
      userName: '周小美',
      userRole: '资深美容师',
      avatarColor: '#10B981',
      type: 'delete',
      typeLabel: '删除',
      module: '宠物档案',
      action: '删除宠物档案',
      targetId: 'pet-023',
      targetName: '宠物：花花',
      description: '删除已离店宠物"花花"的档案（已归档）',
      timestamp: dayjs().subtract(1, 'day').subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      changes: [
        { field: 'status', fieldLabel: '档案状态', oldValue: 'archived', newValue: null },
      ],
      ip: '192.168.1.106',
    },
  ])

  const operatorOptions = computed(() => {
    const unique = new Map<string, { label: string; value: string }>()
    logs.value.forEach((l) => {
      if (!unique.has(l.userId)) {
        unique.set(l.userId, { label: l.userName, value: l.userId })
      }
    })
    return Array.from(unique.values())
  })

  const typeOptions: { label: string; value: LogType }[] = [
    { label: '创建', value: 'create' },
    { label: '修改', value: 'update' },
    { label: '删除', value: 'delete' },
    { label: '审核', value: 'review' },
    { label: '登录', value: 'login' },
    { label: '登出', value: 'logout' },
    { label: '导出', value: 'export' },
  ]

  const moduleOptions = computed(() => {
    const unique = new Set<string>()
    logs.value.forEach((l) => unique.add(l.module))
    return Array.from(unique).map((m) => ({ label: m, value: m }))
  })

  function getFilteredLogs(filters: {
    operatorId?: string
    type?: LogType
    module?: string
    startDate?: string
    endDate?: string
    keyword?: string
  }): AuditLog[] {
    return logs.value.filter((log) => {
      if (filters.operatorId && log.userId !== filters.operatorId) return false
      if (filters.type && log.type !== filters.type) return false
      if (filters.module && log.module !== filters.module) return false
      if (filters.startDate) {
        if (dayjs(log.timestamp).isBefore(dayjs(filters.startDate).startOf('day'))) return false
      }
      if (filters.endDate) {
        if (dayjs(log.timestamp).isAfter(dayjs(filters.endDate).endOf('day'))) return false
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        const haystack = [log.action, log.description, log.targetName, log.userName].join(' ').toLowerCase()
        if (!haystack.includes(kw)) return false
      }
      return true
    })
  }

  function getLogById(id: string) {
    return logs.value.find((l) => l.id === id)
  }

  return {
    logs,
    operatorOptions,
    typeOptions,
    moduleOptions,
    getFilteredLogs,
    getLogById,
  }
})
