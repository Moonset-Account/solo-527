import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tag, Steps, Select, Button, Descriptions, Spin } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { useContractStore } from '@/stores/contractStore'
import { useMaterialStore } from '@/stores/materialStore'
import { useReminderStore } from '@/stores/reminderStore'
import DuplicateAlert from '@/components/DuplicateAlert'
import MaterialTable from '@/components/MaterialTable'
import ReminderTimeline from '@/components/ReminderTimeline'
import type { ContractStatus, NodeStatus } from '../../shared/types'
import { CONTRACT_STATUS_MAP, NODE_STATUS_MAP } from '../../shared/types'

const contractStatusColorMap: Record<ContractStatus, string> = {
  PENDING: 'blue',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  ABNORMAL_CLOSED: 'red',
}

const nodeStepStatusMap: Record<NodeStatus, 'wait' | 'process' | 'finish' | 'error'> = {
  PENDING: 'wait',
  PROCESSING: 'process',
  COMPLETED: 'finish',
  TIMEOUT: 'error',
}

const statusOptions: { value: ContractStatus; label: string }[] = [
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '处理中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ABNORMAL_CLOSED', label: '异常关闭' },
]

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentContract, fetchContractById, updateContractStatus, loading } = useContractStore()
  const { materials, fetchMaterials, updateMaterialStatus, batchRemind } = useMaterialStore()
  const { reminders, fetchReminders } = useReminderStore()

  useEffect(() => {
    if (id) {
      fetchContractById(Number(id))
      fetchMaterials(Number(id))
      fetchReminders(Number(id))
    }
  }, [id, fetchContractById, fetchMaterials, fetchReminders])

  if (loading || !currentContract) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>
  }

  const nodes = currentContract.approvalNodes || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/')}
        />
        <h2 className="text-xl font-semibold text-slate-800">{currentContract.title}</h2>
        <Tag color={contractStatusColorMap[currentContract.status]}>
          {CONTRACT_STATUS_MAP[currentContract.status]}
        </Tag>
      </div>

      <Descriptions bordered size="small" column={3} className="mb-4">
        <Descriptions.Item label="合同编号">{currentContract.contractNo}</Descriptions.Item>
        <Descriptions.Item label="申请人">{currentContract.applicant}</Descriptions.Item>
        <Descriptions.Item label="部门">{currentContract.department}</Descriptions.Item>
        <Descriptions.Item label="创建日期">
          {new Date(currentContract.createdAt).toLocaleDateString('zh-CN')}
        </Descriptions.Item>
      </Descriptions>

      <DuplicateAlert contract={currentContract} />

      <Card title="审批节点" className="mb-4 shadow-sm" style={{ borderRadius: 8 }}>
        <Steps
          current={nodes.findIndex((n) => n.status === 'PROCESSING')}
          items={nodes.map((node) => ({
            title: node.nodeName,
            description: (
              <div className="text-xs">
                <div>处理人: {node.assignee}</div>
                <Tag color={node.status === 'TIMEOUT' ? 'red' : node.status === 'COMPLETED' ? 'green' : 'blue'} className="mt-1">
                  {NODE_STATUS_MAP[node.status]}
                </Tag>
              </div>
            ),
            status: nodeStepStatusMap[node.status],
          }))}
        />
      </Card>

      <Card title="材料清单" className="mb-4 shadow-sm" style={{ borderRadius: 8 }}>
        <MaterialTable
          materials={materials}
          onStatusChange={updateMaterialStatus}
          onBatchRemind={batchRemind}
        />
      </Card>

      <Card title="催办记录" className="mb-4 shadow-sm" style={{ borderRadius: 8 }}>
        <ReminderTimeline reminders={reminders} />
      </Card>

      <Card className="shadow-sm" style={{ borderRadius: 8 }}>
        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-medium">更新合同状态:</span>
          <Select
            value={currentContract.status}
            options={statusOptions}
            onChange={(val) => updateContractStatus(currentContract.id, val)}
            style={{ width: 160 }}
          />
        </div>
      </Card>
    </div>
  )
}
