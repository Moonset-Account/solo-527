import { Tag } from 'antd'

const statusColorMap = {
  pending: 'orange',
  approved: 'blue',
  rejected: 'red',
  completed: 'green',
  cancelled: 'default',
  processing: 'cyan',
  confirmed: 'purple'
}

const statusTextMap = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  completed: '已完成',
  cancelled: '已取消',
  processing: '处理中',
  confirmed: '已确认'
}

const StatusTag = ({ status }) => {
  const color = statusColorMap[status] || 'default'
  const text = statusTextMap[status] || status
  return <Tag color={color}>{text}</Tag>
}

export default StatusTag
