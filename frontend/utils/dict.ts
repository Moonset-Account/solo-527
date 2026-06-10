export const statusLabels: Record<string, string> = {
  submitted: '已投递',
  screening: '简历筛选中',
  screening_passed: '简历筛选通过',
  assessment: '测评中',
  assessment_passed: '测评通过',
  interview: '面试中',
  interview_passed: '面试通过',
  offer: 'Offer已发放',
  offer_accepted: 'Offer已接受',
  rejected: '已拒绝',
  cancelled: '已取消',
}

export const statusColors: Record<string, string> = {
  submitted: 'default',
  screening: 'info',
  screening_passed: 'success',
  assessment: 'warning',
  assessment_passed: 'success',
  interview: 'warning',
  interview_passed: 'success',
  offer: 'success',
  offer_accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
}

export const stageLabels: Record<string, string> = {
  resume_screen: '简历筛选',
  assessment: '测评',
  tech_interview: '技术面试',
  hr_interview: 'HR面试',
  offer: 'Offer',
  onboarding: '入职',
}

export const stageOrder = [
  'resume_screen',
  'assessment',
  'tech_interview',
  'hr_interview',
  'offer',
  'onboarding',
]

export const interviewTypeLabels: Record<string, string> = {
  phone: '电话面试',
  video: '视频面试',
  onsite: '现场面试',
  assessment: '测评',
}

export const interviewStatusLabels: Record<string, string> = {
  scheduled: '已安排',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未出席',
}

export const interviewResultLabels: Record<string, string> = {
  pass: '通过',
  fail: '不通过',
  pending: '待评价',
  need_review: '待复核',
}

export const priorityLabels: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
}

export const priorityColors: Record<string, string> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
}

export const todoTypeLabels: Record<string, string> = {
  normal: '普通待办',
  escalated: '升级催办',
  interview_conflict: '面试冲突',
  status_expired: '状态超时',
  follow_up: '跟进提醒',
}

export const offerStatusLabels: Record<string, string> = {
  draft: '草稿',
  sent: '已发送',
  accepted: '已接受',
  rejected: '已拒绝',
  expired: '已过期',
  cancelled: '已取消',
}

export const roleLabels: Record<string, string> = {
  admin: '管理员',
  recruiter: '招聘员',
  candidate: '候选人',
}

export const checkInStatusLabels: Record<string, string> = {
  checked_in: '已签到',
  late: '迟到',
  not_checked: '未签到',
  early: '提前签到',
}

export const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const questionTypeLabels: Record<string, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  true_false: '判断题',
  short_answer: '简答题',
  essay: '论述题',
  coding: '编程题',
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}
