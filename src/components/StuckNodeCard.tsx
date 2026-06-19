import { Card, Button, Tag } from 'antd'
import { Bell } from 'lucide-react'
import type { StuckNode } from '../../shared/types'
import { NODE_STATUS_MAP } from '../../shared/types'

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

interface StuckNodeCardProps {
  node: StuckNode
  onRemind: (nodeId: number) => void
}

export default function StuckNodeCard({ node, onRemind }: StuckNodeCardProps) {
  const borderColorClass = node.isOverdue ? 'stuck-card-overdue' : 'stuck-card-warning'

  return (
    <Card
      className={`${borderColorClass} mb-3`}
      size="small"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-800 font-medium">{node.contractNo}</span>
            <Tag color={node.isOverdue ? 'red' : 'orange'}>
              {node.isOverdue ? '已超时' : '即将超时'}
            </Tag>
          </div>
          <div className="text-slate-600 text-sm mb-1">{node.contractTitle}</div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>节点: <span className="text-slate-700">{node.nodeName}</span></span>
            <span>处理人: <span className="text-slate-700">{node.assignee}</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <span>已耗时: <span className={node.isOverdue ? 'text-red-500 font-medium' : 'text-amber-500 font-medium'}>{formatElapsed(node.elapsedMinutes)}</span></span>
            <span>超时阈值: {formatElapsed(node.timeoutMinutes)}</span>
          </div>
        </div>
        <Button
          type="primary"
          size="small"
          icon={<Bell size={14} />}
          onClick={() => onRemind(node.nodeId)}
          style={{ background: '#F59E0B', borderColor: '#F59E0B', borderRadius: 6 }}
        >
          催办
        </Button>
      </div>
    </Card>
  )
}
