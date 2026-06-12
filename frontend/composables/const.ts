export const STATUS_OPTIONS = {
  submission: [
    { value: 'draft', label: '草稿', type: 'default' },
    { value: 'submitted', label: '已提交', type: 'info' },
    { value: 'under_review', label: '审核中', type: 'warning' },
    { value: 'lawyer_reviewed', label: '律师已审', type: 'primary' },
    { value: 'reviewer_approved', label: '复核通过', type: 'success' },
    { value: 'rejected', label: '已驳回', type: 'error' },
    { value: 'closed', label: '已关闭', type: 'default' },
  ],
  answer: [
    { value: 'compliant', label: '合规', type: 'success' },
    { value: 'non_compliant', label: '不合规', type: 'error' },
    { value: 'partial', label: '部分合规', type: 'warning' },
    { value: 'not_applicable', label: '不适用', type: 'default' },
    { value: 'pending', label: '待填写', type: 'info' },
  ],
  gap: [
    { value: 'open', label: '待处理', type: 'error' },
    { value: 'in_progress', label: '整改中', type: 'warning' },
    { value: 'mitigated', label: '已缓解', type: 'primary' },
    { value: 'closed', label: '已关闭', type: 'success' },
    { value: 'accepted', label: '已接受', type: 'default' },
  ],
  severity: [
    { value: 'critical', label: '极高', type: 'error' },
    { value: 'high', label: '高', type: 'warning' },
    { value: 'medium', label: '中', type: 'primary' },
    { value: 'low', label: '低', type: 'default' },
  ],
  assignment: [
    { value: 'assigned', label: '已分派', type: 'info' },
    { value: 'lawyer_processing', label: '律师处理中', type: 'warning' },
    { value: 'lawyer_done', label: '律师已完成', type: 'primary' },
    { value: 'reviewer_processing', label: '复核处理中', type: 'warning' },
    { value: 'completed', label: '已完成', type: 'success' },
  ],
  reminder: [
    { value: 'material_missing', label: '材料缺失' },
    { value: 'deadline_approaching', label: '临期提醒' },
    { value: 'deadline_overdue', label: '超期告警' },
    { value: 'gap_new', label: '新缺口' },
    { value: 'assignment_new', label: '新分派' },
    { value: 'status_change', label: '状态变更' },
  ],
  risk: [
    { value: 'critical', label: '极高', color: '#d03050' },
    { value: 'high', label: '高', color: '#f0a020' },
    { value: 'medium', label: '中', color: '#1d6ff2' },
    { value: 'low', label: '低', color: '#208080' },
  ],
  role: [
    { value: 'admin', label: '系统管理员' },
    { value: 'compliance_manager', label: '合规经理' },
    { value: 'lawyer', label: '律师' },
    { value: 'reviewer', label: '复核人' },
    { value: 'submitter', label: '业务提交人' },
  ],
}

export function colorOfStatus(kind: string, v?: string): string {
  const map: Record<string, Record<string, string>> = {
    submission: { draft: '#8a8f99', submitted: '#1d6ff2', under_review: '#f0a020', lawyer_reviewed: '#2080f0', reviewer_approved: '#18a058', rejected: '#d03050', closed: '#8a8f99' },
    answer: { compliant: '#18a058', non_compliant: '#d03050', partial: '#f0a020', not_applicable: '#8a8f99', pending: '#1d6ff2' },
    gap: { open: '#d03050', in_progress: '#f0a020', mitigated: '#1d6ff2', closed: '#18a058', accepted: '#8a8f99' },
    severity: { critical: '#d03050', high: '#f0a020', medium: '#1d6ff2', low: '#8a8f99' },
    risk: { critical: '#d03050', high: '#f0a020', medium: '#1d6ff2', low: '#208080' },
  }
  if (!v) return '#8a8f99'
  return map[kind]?.[v] || '#8a8f99'
}

export function labelOf(kind: string, v?: string): string {
  const list = (STATUS_OPTIONS as any)[kind] || []
  return list.find((x: any) => x.value === v)?.label || v || '-'
}

export function daysLeft(dateStr?: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function fmtDate(s?: string): string {
  if (!s) return '-'
  try { return s.slice(0, 10) } catch (_) { return '-' }
}
export function fmtDateTime(s?: string): string {
  if (!s) return '-'
  try { return s.slice(0, 19).replace('T', ' ') } catch (_) { return '-' }
}
