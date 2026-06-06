import * as XLSX from 'xlsx'
import Task, { TaskStatus, TaskType } from '~/server/models/Task'
import { requireAuth } from '~/server/utils/auth'

const typeLabels: Record<string, string> = {
  [TaskType.MISSED_SORT]: '误投',
  [TaskType.BIN_FULL]: '桶满',
  [TaskType.POINT_DAMAGED]: '点位破损'
}

const statusLabels: Record<string, string> = {
  [TaskStatus.SUBMITTED]: '待认领',
  [TaskStatus.CLAIMED]: '已认领',
  [TaskStatus.IN_PROGRESS]: '整改中',
  [TaskStatus.PENDING_REVIEW]: '待复查',
  [TaskStatus.REJECTED]: '复查不通过',
  [TaskStatus.CLOSED]: '已关闭',
  [TaskStatus.ESCALATED]: '已升级',
  [TaskStatus.CANCELLED]: '已撤回'
}

export default requireAuth(async (event) => {
  const query = getQuery(event)
  const { 
    status, 
    type, 
    community, 
    propertyCompany,
    startDate,
    endDate
  } = query
  
  const filter: any = {}
  
  if (status) filter.status = status
  if (type) filter.type = type
  if (community) filter.community = community
  if (propertyCompany) filter.propertyCompany = propertyCompany
  
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate as string)
    if (endDate) filter.createdAt.$lte = new Date(endDate as string)
  }
  
  const tasks = await Task.find(filter).sort({ createdAt: -1 })
  
  const data = tasks.map(task => ({
    '任务编号': task.taskNumber,
    '问题类型': typeLabels[task.type] || task.type,
    '点位名称': task.pointName,
    '所属社区': task.community,
    '物业公司': task.propertyCompany,
    '描述': task.description,
    '提交人': task.submitterName,
    '认领人': task.assigneeName || '',
    '状态': statusLabels[task.status] || task.status,
    '是否升级': task.isEscalated ? '是' : '否',
    '提交时间': task.createdAt.toLocaleString('zh-CN'),
    '截止时间': task.deadline.toLocaleString('zh-CN'),
    '关闭时间': task.status === TaskStatus.CLOSED 
      ? task.updatedAt.toLocaleString('zh-CN') 
      : ''
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '整改任务')
  
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  const filename = `整改任务报表_${new Date().toISOString().split('T')[0]}.xlsx`
  
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  
  return excelBuffer
})
