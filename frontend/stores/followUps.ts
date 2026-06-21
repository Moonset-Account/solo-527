import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled'
export type FollowUpType = 'phone' | 'wechat' | 'visit' | 'other'
export type FollowUpPriority = 'high' | 'medium' | 'low'

export interface FollowUpCustomer {
  id: string
  name: string
  phone: string
  avatar?: string
}

export interface FollowUpPet {
  id: string
  name: string
  breed: string
  avatar?: string
}

export interface FollowUpRecord {
  id: string
  content: string
  createdAt: string
  createdBy: string
  attachments?: string[]
}

export interface FollowUpTask {
  id: string
  taskNo: string
  customer: FollowUpCustomer
  pet: FollowUpPet
  type: FollowUpType
  typeLabel: string
  priority: FollowUpPriority
  planTime: string
  endTime?: string
  status: FollowUpStatus
  assignee?: string
  title: string
  description?: string
  lastRecord?: string
  lastRecordTime?: string
  records: FollowUpRecord[]
  source?: string
  cancelReason?: string
}

export const useFollowUpsStore = defineStore('followUps', () => {
  const tasks = ref<FollowUpTask[]>([
    {
      id: 'F001',
      taskNo: 'FU20240622001',
      customer: {
        id: 'U003',
        name: '张雅婷',
        phone: '137****9012',
      },
      pet: {
        id: 'P003',
        name: '橘子',
        breed: '中华田园猫',
      },
      type: 'phone',
      typeLabel: '电话回访',
      priority: 'high',
      planTime: '2024-06-22 10:00:00',
      status: 'pending',
      title: '领养后一周回访',
      description: '确认猫咪适应情况，指导饮食和护理注意事项。',
      source: '领养申请',
      records: [],
    },
    {
      id: 'F002',
      taskNo: 'FU20240622002',
      customer: {
        id: 'U006',
        name: '陈女士',
        phone: '138****2233',
      },
      pet: {
        id: 'P006',
        name: '可乐',
        breed: '柯基',
      },
      type: 'wechat',
      typeLabel: '微信回访',
      priority: 'medium',
      planTime: '2024-06-22 14:30:00',
      status: 'pending',
      title: '寄养服务回访',
      description: '了解寄养期间宠物状态反馈，收集客户意见。',
      source: '寄养订单',
      records: [],
    },
    {
      id: 'F003',
      taskNo: 'FU20240622003',
      customer: {
        id: 'U007',
        name: '王先生',
        phone: '139****4455',
      },
      pet: {
        id: 'P007',
        name: '布丁',
        breed: '布偶猫',
      },
      type: 'phone',
      typeLabel: '电话回访',
      priority: 'medium',
      planTime: '2024-06-22 16:00:00',
      status: 'pending',
      title: '洗护服务满意度调查',
      description: '询问洗护服务体验，是否有改进建议。',
      source: '服务订单',
      records: [],
    },
    {
      id: 'F004',
      taskNo: 'FU20240621001',
      customer: {
        id: 'U008',
        name: '刘小姐',
        phone: '136****6677',
      },
      pet: {
        id: 'P008',
        name: '毛毛',
        breed: '萨摩耶',
      },
      type: 'visit',
      typeLabel: '上门回访',
      priority: 'high',
      planTime: '2024-06-21 15:00:00',
      endTime: '2024-06-21 16:20:00',
      status: 'completed',
      title: '领养后首月上门回访',
      description: '实地查看宠物生活环境，评估领养情况。',
      source: '领养申请',
      lastRecord: '宠物状态良好，生活环境整洁，主人照顾细心。已赠送猫粮和驱虫药。',
      lastRecordTime: '2024-06-21 16:20:00',
      records: [
        {
          id: 'R001',
          content: '宠物状态良好，毛色光泽，精神状态佳。生活环境整洁，主人照顾细心，已正确掌握喂养和护理方法。已赠送猫粮一袋和驱虫药。',
          createdAt: '2024-06-21 16:20:00',
          createdBy: '张小明',
        },
      ],
    },
    {
      id: 'F005',
      taskNo: 'FU20240620001',
      customer: {
        id: 'U009',
        name: '周先生',
        phone: '135****8899',
      },
      pet: {
        id: 'P009',
        name: '豆豆',
        breed: '泰迪',
      },
      type: 'wechat',
      typeLabel: '微信回访',
      priority: 'low',
      planTime: '2024-06-20 10:00:00',
      endTime: '2024-06-20 10:15:00',
      status: 'completed',
      title: '疫苗接种提醒回访',
      description: '提醒客户下次疫苗接种时间，确认宠物健康状况。',
      source: '医疗档案',
      lastRecord: '客户表示狗狗健康，已记下下次疫苗时间为7月15日。',
      lastRecordTime: '2024-06-20 10:15:00',
      records: [
        {
          id: 'R002',
          content: '客户表示狗狗一切正常，饮食排便都很好。已告知下次疫苗接种时间为2024年7月15日，客户表示会按时来。',
          createdAt: '2024-06-20 10:15:00',
          createdBy: '李小红',
        },
      ],
    },
    {
      id: 'F006',
      taskNo: 'FU20240619001',
      customer: {
        id: 'U010',
        name: '吴女士',
        phone: '137****1122',
      },
      pet: {
        id: 'P010',
        name: '咪咪',
        breed: '美短',
      },
      type: 'phone',
      typeLabel: '电话回访',
      priority: 'low',
      planTime: '2024-06-19 09:00:00',
      status: 'cancelled',
      title: '商品购买回访',
      description: '询问购买猫粮使用情况，是否有其他需求。',
      source: '商品订单',
      cancelReason: '客户多次未接通电话，后续再联系。',
      records: [],
    },
  ])

  const selectedTasks = ref<string[]>([])

  const pendingTasks = computed(() => tasks.value.filter((t) => t.status === 'pending'))
  const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed'))
  const cancelledTasks = computed(() => tasks.value.filter((t) => t.status === 'cancelled'))

  const stats = computed(() => ({
    pending: pendingTasks.value.length,
    completed: completedTasks.value.length,
    cancelled: cancelledTasks.value.length,
    total: tasks.value.length,
  }))

  function getTaskById(id: string) {
    return tasks.value.find((t) => t.id === id) || null
  }

  function completeTask(id: string, content: string, attachments?: string[]) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) {
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).replace(/\//g, '-')
      task.status = 'completed'
      task.endTime = now
      task.lastRecord = content
      task.lastRecordTime = now
      task.records.push({
        id: `R${Date.now()}`,
        content,
        createdAt: now,
        createdBy: '当前用户',
        attachments,
      })
    }
  }

  function cancelTask(id: string, reason: string) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) {
      task.status = 'cancelled'
      task.cancelReason = reason
    }
  }

  function addTask(task: Omit<FollowUpTask, 'id' | 'taskNo' | 'records'>) {
    const newTask: FollowUpTask = {
      ...task,
      id: `F${Date.now()}`,
      taskNo: `FU${Date.now()}`,
      records: [],
    }
    tasks.value.unshift(newTask)
    return newTask
  }

  function toggleTaskSelection(id: string) {
    const index = selectedTasks.value.indexOf(id)
    if (index > -1) {
      selectedTasks.value.splice(index, 1)
    } else {
      selectedTasks.value.push(id)
    }
  }

  function clearSelection() {
    selectedTasks.value = []
  }

  return {
    tasks,
    selectedTasks,
    pendingTasks,
    completedTasks,
    cancelledTasks,
    stats,
    getTaskById,
    completeTask,
    cancelTask,
    addTask,
    toggleTaskSelection,
    clearSelection,
  }
})
