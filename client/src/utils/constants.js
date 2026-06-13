export const CONTENT_STATUS = {
  draft: { label: '草稿', type: 'info' },
  submitted: { label: '待审稿', type: 'warning' },
  reviewing: { label: '审稿中', type: 'primary' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  filming: { label: '拍摄中', type: 'warning' },
  editing: { label: '剪辑中', type: 'warning' },
  pending_publish: { label: '待发布', type: 'primary' },
  published: { label: '已发布', type: 'success' },
  publish_failed: { label: '发布失败', type: 'danger' },
  archived: { label: '已归档', type: 'info' }
}

export const PLATFORM_TYPE = {
  douyin: { label: '抖音', type: '' },
  kuaishou: { label: '快手', type: '' },
  xhs: { label: '小红书', type: '' },
  bilibili: { label: '哔哩哔哩', type: '' },
  wechat: { label: '微信视频号', type: '' },
  weibo: { label: '微博', type: '' }
}

export const SCHEDULE_STATUS = {
  pending: { label: '待发布', type: 'warning' },
  published: { label: '已发布', type: 'success' },
  cancelled: { label: '已取消', type: 'info' }
}

export const REVIEW_ACTION = {
  approve: { label: '通过', type: 'success' },
  reject: { label: '驳回', type: 'danger' },
  transfer: { label: '转交', type: 'warning' }
}

export const USERS = [
  { id: 'u001', name: '张三', role: '管理员' },
  { id: 'u002', name: '李四', role: '运营' },
  { id: 'u003', name: '王五', role: '内容创作' },
  { id: 'u004', name: '赵六', role: '企业文化专员' },
  { id: 'u005', name: '钱七', role: '审核员' },
  { id: 'u006', name: '孙八', role: '剪辑师' }
]

export function getStatusLabel(status, dict = CONTENT_STATUS) {
  return dict[status]?.label || status
}

export function getStatusType(status, dict = CONTENT_STATUS) {
  return dict[status]?.type || 'info'
}

export function formatDate(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  return fmt
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

export function getUserById(id) {
  return USERS.find(u => u.id === id) || { id, name: id }
}
