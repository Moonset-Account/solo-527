'use client'

import type { KnowledgeStatus, ResultStatus, RiskLevel, NotificationType } from '@prisma/client'

interface StatusBadgeProps {
  status: string
  type?: 'knowledge' | 'result' | 'risk' | 'notification' | 'source'
}

const statusColors: Record<string, Record<string, string>> = {
  knowledge: {
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  },
  result: {
    ACCEPTED: 'bg-green-100 text-green-800',
    MODIFIED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
  },
  risk: {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  },
  notification: {
    ACCURACY_ALERT: 'bg-red-100 text-red-800',
    LOW_HIT_RATE: 'bg-orange-100 text-orange-800',
    KNOWLEDGE_EXPIRING: 'bg-yellow-100 text-yellow-800',
    RISK_DETECTED: 'bg-purple-100 text-purple-800',
    SYSTEM: 'bg-blue-100 text-blue-800',
  },
  source: {
    KNOWLEDGE_BASE: 'bg-blue-100 text-blue-800',
    FAQ: 'bg-green-100 text-green-800',
    POLICY_DOCUMENT: 'bg-purple-100 text-purple-800',
    TRAINING_MATERIAL: 'bg-yellow-100 text-yellow-800',
    PREVIOUS_CONVERSATION: 'bg-gray-100 text-gray-800',
  },
}

const statusLabels: Record<string, Record<string, string>> = {
  knowledge: {
    ACTIVE: '生效中',
    EXPIRED: '已过期',
    UNDER_REVIEW: '审核中',
    ARCHIVED: '已归档',
  },
  result: {
    ACCEPTED: '已采纳',
    MODIFIED: '已修改',
    REJECTED: '已拒绝',
    PENDING: '待处理',
  },
  risk: {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
    CRITICAL: '严重风险',
  },
  notification: {
    ACCURACY_ALERT: '准确率告警',
    LOW_HIT_RATE: '低命中率',
    KNOWLEDGE_EXPIRING: '知识过期提醒',
    RISK_DETECTED: '风险检测',
    SYSTEM: '系统通知',
  },
  source: {
    KNOWLEDGE_BASE: '知识库',
    FAQ: '常见问题',
    POLICY_DOCUMENT: '政策文档',
    TRAINING_MATERIAL: '培训材料',
    PREVIOUS_CONVERSATION: '历史会话',
  },
}

export default function StatusBadge({ status, type = 'knowledge' }: StatusBadgeProps) {
  const colors = statusColors[type] || statusColors.knowledge
  const labels = statusLabels[type] || statusLabels.knowledge
  
  const colorClass = colors[status] || 'bg-gray-100 text-gray-800'
  const label = labels[status] || status

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
