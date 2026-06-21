import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TodoCard {
  id: string
  title: string
  count: number
  icon: string
  color: string
  route: string
  bgGradient: string
}

export interface AlertItem {
  id: string
  type: 'danger' | 'warning'
  title: string
  description: string
  time: string
}

export interface OrderTrend {
  date: string
  orders: number
  revenue: number
}

export interface ScheduleItem {
  id: string
  staffName: string
  role: string
  startTime: string
  endTime: string
  tasks: number
  load: 'low' | 'medium' | 'high'
  avatarColor: string
}

export interface OperationLog {
  id: string
  user: string
  action: string
  target: string
  time: string
  type: 'create' | 'update' | 'delete' | 'review'
}

export const useDashboardStore = defineStore('dashboard', () => {
  const todoCards = ref<TodoCard[]>([
    {
      id: '1',
      title: '待审核领养',
      count: 8,
      icon: 'HeartSharp',
      color: '#FF5A5F',
      route: '/adoption/pending',
      bgGradient: 'from-rose-50 to-rose-100',
    },
    {
      id: '2',
      title: '待处理售后',
      count: 5,
      icon: 'AlertCircleSharp',
      color: '#FF8C42',
      route: '/orders/pending',
      bgGradient: 'from-orange-50 to-orange-100',
    },
    {
      id: '3',
      title: '今日预约',
      count: 12,
      icon: 'CalendarSharp',
      color: '#1A8A7D',
      route: '/orders/list',
      bgGradient: 'from-teal-50 to-teal-100',
    },
    {
      id: '4',
      title: '回访任务',
      count: 6,
      icon: 'TimeSharp',
      color: '#6366F1',
      route: '/follow-up',
      bgGradient: 'from-indigo-50 to-indigo-100',
    },
  ])

  const alerts = ref<AlertItem[]>([
    {
      id: 'a1',
      type: 'danger',
      title: '超期订单 #20240015',
      description: '金毛犬洗护服务已超时2天未完成',
      time: '2小时前',
    },
    {
      id: 'a2',
      type: 'danger',
      title: '寄养风险预警',
      description: '寄养宠物"豆豆"出现异常食欲下降',
      time: '3小时前',
    },
    {
      id: 'a3',
      type: 'warning',
      title: '订单即将超时',
      description: '订单#20240028 还有2小时到期',
      time: '5小时前',
    },
    {
      id: 'a4',
      type: 'warning',
      title: '回访任务待处理',
      description: '3位客户回访即将超期',
      time: '1天前',
    },
  ])

  const orderTrend = ref<OrderTrend[]>([
    { date: '06-16', orders: 28, revenue: 4200 },
    { date: '06-17', orders: 35, revenue: 5100 },
    { date: '06-18', orders: 42, revenue: 6300 },
    { date: '06-19', orders: 31, revenue: 4650 },
    { date: '06-20', orders: 48, revenue: 7200 },
    { date: '06-21', orders: 52, revenue: 7800 },
    { date: '06-22', orders: 45, revenue: 6750 },
  ])

  const schedules = ref<ScheduleItem[]>([
    {
      id: 's1',
      staffName: '张小明',
      role: '高级美容师',
      startTime: '09:00',
      endTime: '18:00',
      tasks: 6,
      load: 'high',
      avatarColor: '#1A8A7D',
    },
    {
      id: 's2',
      staffName: '李小红',
      role: '护理师',
      startTime: '10:00',
      endTime: '19:00',
      tasks: 4,
      load: 'medium',
      avatarColor: '#6366F1',
    },
    {
      id: 's3',
      staffName: '王小刚',
      role: '寄养专员',
      startTime: '08:00',
      endTime: '17:00',
      tasks: 3,
      load: 'low',
      avatarColor: '#FF8C42',
    },
    {
      id: 's4',
      staffName: '赵小芳',
      role: '前台接待',
      startTime: '09:00',
      endTime: '18:00',
      tasks: 5,
      load: 'medium',
      avatarColor: '#EC4899',
    },
  ])

  const operationLogs = ref<OperationLog[]>([
    {
      id: 'o1',
      user: '张小明',
      action: '审核通过领养申请',
      target: '客户：李女士 - 宠物：奶茶',
      time: '10分钟前',
      type: 'review',
    },
    {
      id: 'o2',
      user: '李小红',
      action: '创建洗护订单',
      target: '订单#20240032',
      time: '30分钟前',
      type: 'create',
    },
    {
      id: 'o3',
      user: '王小刚',
      action: '更新宠物健康档案',
      target: '宠物：豆豆',
      time: '1小时前',
      type: 'update',
    },
    {
      id: 'o4',
      user: '赵小芳',
      action: '删除作废订单',
      target: '订单#20240021',
      time: '2小时前',
      type: 'delete',
    },
    {
      id: 'o5',
      user: '张小明',
      action: '完成回访记录',
      target: '客户：陈先生',
      time: '3小时前',
      type: 'update',
    },
  ])

  function incrementTodoCount(id: string) {
    const card = todoCards.value.find((c) => c.id === id)
    if (card && card.count > 0) {
      card.count--
    }
  }

  function dismissAlert(id: string) {
    const index = alerts.value.findIndex((a) => a.id === id)
    if (index > -1) {
      alerts.value.splice(index, 1)
    }
  }

  return {
    todoCards,
    alerts,
    orderTrend,
    schedules,
    operationLogs,
    incrementTodoCount,
    dismissAlert,
  }
})
