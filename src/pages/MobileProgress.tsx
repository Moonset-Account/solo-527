import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Steps, Tag, Button, Card, Spin } from 'antd'
import { ArrowLeft } from 'lucide-react'
import type { Contract, NodeStatus } from '../../shared/types'
import { CONTRACT_STATUS_MAP, NODE_STATUS_MAP } from '../../shared/types'

const contractStatusColorMap: Record<string, string> = {
  PENDING: 'blue',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  ABNORMAL_CLOSED: 'red',
}

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export default function MobileProgress() {
  const { contractNo } = useParams<{ contractNo: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (contractNo) {
      fetch(`/api/progress/${contractNo}`)
        .then((res) => res.json())
        .then((json) => setContract(json.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [contractNo])

  if (loading || !contract) {
    return (
      <div className="mobile-container flex justify-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  const nodes = contract.approvalNodes || []

  return (
    <div className="mobile-container">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">{contract.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-slate-500">{contract.contractNo}</span>
          <Tag color={contractStatusColorMap[contract.status]}>
            {CONTRACT_STATUS_MAP[contract.status]}
          </Tag>
        </div>
        <div className="text-sm text-slate-500 mt-1">
          申请人: {contract.applicant} | {contract.department}
        </div>
      </div>

      <div className="p-4">
        <Card size="small" style={{ borderRadius: 8 }}>
          <Steps
            direction="vertical"
            current={nodes.findIndex((n) => n.status === 'PROCESSING')}
            items={nodes.map((node) => ({
              title: node.nodeName,
              description: (
                <div className="text-xs space-y-1">
                  <div className="text-slate-500">处理人: {node.assignee}</div>
                  <div className="flex items-center gap-2">
                    <Tag
                      color={node.status === 'TIMEOUT' ? 'red' : node.status === 'COMPLETED' ? 'green' : 'blue'}
                      className="text-xs"
                    >
                      {NODE_STATUS_MAP[node.status as NodeStatus]}
                    </Tag>
                    <span className="text-slate-400">耗时: {formatElapsed(node.elapsedMinutes)}</span>
                  </div>
                </div>
              ),
              status: node.status === 'COMPLETED' ? 'finish' : node.status === 'TIMEOUT' ? 'error' : node.status === 'PROCESSING' ? 'process' : 'wait',
            }))}
          />
        </Card>
      </div>

      <div className="p-4">
        <Button
          block
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
          style={{ borderRadius: 6 }}
        >
          返回
        </Button>
      </div>
    </div>
  )
}
