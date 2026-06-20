import dayjs from 'dayjs'

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const getStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'primary'
  }
  return map[status] || 'info'
}

export const getRepairStatusText = (status) => {
  const map = {
    0: '已取消',
    1: '待分配',
    2: '待开工',
    3: '施工中',
    4: '待质检',
    5: '已完成',
    6: '已关闭'
  }
  return map[status] || status
}

export const getRepairStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'primary',
    3: 'danger',
    4: 'warning',
    5: 'success',
    6: 'info'
  }
  return map[status] || 'info'
}

export const getQualityStatusText = (status) => {
  const map = {
    'PENDING': '未质检',
    'CHECKING': '质检中',
    'PASSED': '质检通过',
    'FAILED': '质检不通过'
  }
  return map[status] || status
}

export const getQualityStatusType = (status) => {
  const map = {
    'PENDING': 'info',
    'CHECKING': 'warning',
    'PASSED': 'success',
    'FAILED': 'danger'
  }
  return map[status] || 'info'
}

export const getPackageTypeText = (type) => {
  const map = {
    '基础保养': '基础保养',
    '综合保养': '综合保养',
    '深度保养': '深度保养',
    '定制': '定制'
  }
  return map[type] || type
}

export const getBatchStatusText = (status) => {
  const map = {
    0: '待确认',
    1: '已确认',
    2: '执行中',
    3: '执行完成',
    4: '执行失败'
  }
  return map[status] || status
}

export const getBatchStatusType = (status) => {
  const map = {
    0: 'warning',
    1: 'primary',
    2: 'warning',
    3: 'success',
    4: 'danger'
  }
  return map[status] || 'info'
}

export const getExceptionStatusText = (status) => {
  const map = {
    0: '待处理',
    1: '处理中',
    2: '已处理',
    3: '已忽略'
  }
  return map[status] || status
}

export const getExceptionStatusType = (status) => {
  const map = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'info'
  }
  return map[status] || 'info'
}

export const getDetectionStatusText = (status) => {
  const map = {
    0: '已取消',
    1: '待检测',
    2: '检测中',
    3: '已完成'
  }
  return map[status] || status
}

export const getDetectionStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'primary',
    3: 'success'
  }
  return map[status] || 'info'
}

export const getTestDriveStatusText = (status) => {
  const map = {
    0: '已取消',
    1: '待试驾',
    2: '试驾中',
    3: '已完成'
  }
  return map[status] || status
}

export const getTestDriveStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'primary',
    3: 'success'
  }
  return map[status] || 'info'
}

export const getPackageStatusText = (status) => {
  const map = {
    0: '已下架',
    1: '已上架',
    2: '已过期'
  }
  return map[status] || status
}

export const getPackageStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return map[status] || 'info'
}

export const getReportTypeText = (type) => {
  const map = {
    'DAILY': '日报',
    'WEEKLY': '周报',
    'MONTHLY': '月报',
    'QUARTERLY': '季报',
    'YEARLY': '年报'
  }
  return map[type] || type
}

export const enableStatusOptions = [
  { label: '全部', value: null },
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

export const repairStatusOptions = [
  { label: '全部', value: null },
  { label: '已取消', value: 0 },
  { label: '待分配', value: 1 },
  { label: '待开工', value: 2 },
  { label: '施工中', value: 3 },
  { label: '待质检', value: 4 },
  { label: '已完成', value: 5 },
  { label: '已关闭', value: 6 }
]

export const packageTypeOptions = [
  { label: '全部', value: null },
  { label: '基础保养', value: '基础保养' },
  { label: '综合保养', value: '综合保养' },
  { label: '深度保养', value: '深度保养' },
  { label: '定制', value: '定制' }
]

export const itemCategoryOptions = [
  { label: '全部', value: null },
  { label: '发动机', value: '发动机' },
  { label: '底盘', value: '底盘' },
  { label: '电气', value: '电气' },
  { label: '外观', value: '外观' },
  { label: '其他', value: '其他' }
]

export const itemCategoryText = (category) => {
  const map = {
    '发动机': '发动机',
    '底盘': '底盘',
    '电气': '电气',
    '外观': '外观',
    '其他': '其他'
  }
  return map[category] || category
}

export const orderTypeOptions = [
  { label: '全部', value: null },
  { label: '保养', value: '保养' },
  { label: '维修', value: '维修' },
  { label: '钣金', value: '钣金' },
  { label: '喷漆', value: '喷漆' }
]

export const orderTypeText = (type) => {
  const map = {
    '保养': '保养',
    '维修': '维修',
    '钣金': '钣金',
    '喷漆': '喷漆'
  }
  return map[type] || type
}

export const handleAPIError = (error) => {
  console.error('API Error:', error)
}
