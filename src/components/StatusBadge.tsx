'use client'

import React from 'react'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'topic' | 'script' | 'todo' | 'anomaly' | 'export'
}

const statusColors: Record<string, Record<string, string>> = {
  topic: {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    REVISION_REQUIRED: 'bg-orange-100 text-orange-800',
    IN_PRODUCTION: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
  },
  script: {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    REVISION_REQUIRED: 'bg-orange-100 text-orange-800',
    RECORDING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
  },
  todo: {
    PENDING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
  },
  anomaly: {
    OPEN: 'bg-red-100 text-red-800',
    PROCESSING: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  },
  export: {
    PENDING: 'bg-gray-100 text-gray-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  },
  default: {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  },
}

const statusLabels: Record<string, Record<string, string>> = {
  topic: {
    DRAFT: '草稿',
    PENDING_REVIEW: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    REVISION_REQUIRED: '需修改',
    IN_PRODUCTION: '制作中',
    COMPLETED: '已完成',
  },
  script: {
    DRAFT: '草稿',
    PENDING_REVIEW: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    REVISION_REQUIRED: '需修改',
    RECORDING: '录制中',
    COMPLETED: '已完成',
  },
  todo: {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
  },
  anomaly: {
    OPEN: '待处理',
    PROCESSING: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭',
  },
  export: {
    PENDING: '等待中',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    FAILED: '失败',
  },
  default: {
    ACTIVE: '活跃',
    INACTIVE: '未激活',
  },
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
}) => {
  const colors = statusColors[variant] || statusColors.default
  const labels = statusLabels[variant] || statusLabels.default

  const colorClass = colors[status] || 'bg-gray-100 text-gray-800'
  const label = labels[status] || status

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge
