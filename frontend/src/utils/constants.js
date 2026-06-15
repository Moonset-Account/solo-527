export const statusOptions = [
  { label: '待办', value: 1, type: 'info' },
  { label: '处理中', value: 2, type: 'warning' },
  { label: '已完成', value: 3, type: 'success' },
  { label: '异常', value: 4, type: 'danger' }
]

export const reviewTypeOptions = [
  { label: '选题审核', value: 1 },
  { label: '脚本审核', value: 2 },
  { label: '素材标签审核', value: 3 }
]

export const abnormalTypeOptions = [
  { label: '版权授权风险', value: 1, type: 'danger' },
  { label: '肖像权风险', value: 2, type: 'warning' },
  { label: '商标侵权风险', value: 3, type: 'danger' },
  { label: '背景音乐授权', value: 4, type: 'warning' },
  { label: '其他风险', value: 99, type: 'info' }
]

export const userRoleOptions = [
  { label: '内容创作者', value: 1 },
  { label: '审核员', value: 2 },
  { label: '新媒体运营', value: 3 },
  { label: '内容负责人', value: 4 }
]

export const platformOptions = [
  { label: '抖音', value: '抖音' },
  { label: '快手', value: '快手' },
  { label: '视频号', value: '视频号' },
  { label: 'B站', value: 'B站' },
  { label: '小红书', value: '小红书' }
]

export function getStatusTag(status) {
  const item = statusOptions.find(o => o.value === status)
  return item || { label: '未知', type: 'info' }
}

export function getAbnormalTypeTag(code) {
  const item = abnormalTypeOptions.find(o => o.value === code)
  return item || { label: '未知', type: 'info' }
}
