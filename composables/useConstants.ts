export const stageLabels: Record<string, string> = {
  SCREENING: '简历筛选',
  TECH_ASSESSMENT: '技术测评',
  FIRST_INTERVIEW: '一面',
  SECOND_INTERVIEW: '二面',
  HR_INTERVIEW: 'HR面',
  OFFER: '发放Offer',
  HIRED: '已入职',
  REJECTED: '已拒绝',
  WITHDRAWN: '已撤回'
}

export const stageColors: Record<string, string> = {
  SCREENING: 'bg-gray-100 text-gray-800',
  TECH_ASSESSMENT: 'bg-blue-100 text-blue-800',
  FIRST_INTERVIEW: 'bg-indigo-100 text-indigo-800',
  SECOND_INTERVIEW: 'bg-purple-100 text-purple-800',
  HR_INTERVIEW: 'bg-pink-100 text-pink-800',
  OFFER: 'bg-green-100 text-green-800',
  HIRED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-orange-100 text-orange-800'
}

export const candidateStatusLabels: Record<string, string> = {
  ACTIVE: '进行中',
  ON_HOLD: '暂停',
  REJECTED: '已拒绝',
  HIRED: '已入职',
  WITHDRAWN: '已撤回'
}

export const interviewTypeLabels: Record<string, string> = {
  PHONE_SCREEN: '电话初筛',
  TECHNICAL: '技术面试',
  BEHAVIORAL: '行为面试',
  SYSTEM_DESIGN: '系统设计',
  CULTURE_FIT: '文化匹配',
  FINAL: '终面'
}

export const interviewStatusLabels: Record<string, string> = {
  SCHEDULED: '已安排',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到场',
  RESCHEDULED: '已改期'
}

export const interviewStatusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-orange-100 text-orange-800'
}

export const assessmentTypeLabels: Record<string, string> = {
  CODING: '代码测评',
  ALGORITHM: '算法测评',
  SYSTEM_DESIGN: '系统设计',
  BEHAVIORAL: '行为测评',
  TAKE_HOME: '作业题'
}

export const assessmentStatusLabels: Record<string, string> = {
  PENDING: '待开始',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  EXPIRED: '已过期'
}

export const checkInTypeLabels: Record<string, string> = {
  CANDIDATE_ARRIVED: '候选人已到场',
  INTERVIEWER_READY: '面试官已就绪',
  COMPLETED: '签到完成',
  NO_SHOW_CONFIRMED: '确认爽约'
}

export const reminderTypeLabels: Record<string, string> = {
  INTERVIEW_UPCOMING: '面试即将开始',
  ASSESSMENT_DUE: '测评即将到期',
  CANDIDATE_NO_SHOW: '候选人爽约',
  STAGE_STALLED: '阶段停滞',
  FOLLOW_UP_NEEDED: '需要跟进'
}

export const reminderSeverityLabels: Record<string, string> = {
  INFO: '普通提示',
  WARNING: '警告',
  CRITICAL: '阻断告警'
}

export const reminderSeverityColors: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200'
}

export const appliedActionLabels: Record<string, string> = {
  WARNING_SENT: '已发送警告',
  INTERVIEW_BLOCKED: '已阻断面试',
  PIPELINE_PAUSED: '已暂停管道',
  NOTIFY_HR: '已通知HR'
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
