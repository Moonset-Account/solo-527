import dayjs from 'dayjs'

export function formatDate(value) {
  if (!value) return ''
  return dayjs(value).format('YYYY-MM-DD')
}

export function formatDateTime(value) {
  if (!value) return ''
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

export function getPriorityTag(priority) {
  const map = {
    URGENT: 'danger',
    HIGH: 'warning',
    MEDIUM: '',
    LOW: 'info'
  }
  return map[priority] || ''
}

export function getStatusTag(status) {
  const map = {
    DRAFT: 'info',
    SUBMITTED: '',
    IN_PROGRESS: 'warning',
    IN_REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    COMPLETED: 'success',
    DELAYED: 'danger',
    CLOSED: 'info'
  }
  return map[status] || ''
}

export function getConclusionTag(conclusion) {
  const map = {
    APPROVED: 'success',
    REJECTED: 'danger',
    PENDING: 'warning',
    CONDITIONAL: ''
  }
  return map[conclusion] || ''
}
