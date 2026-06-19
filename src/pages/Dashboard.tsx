import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Modal, Form, Select, Input, message } from 'antd'
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useContractStore } from '@/stores/contractStore'
import { useReminderStore } from '@/stores/reminderStore'
import { useStatisticsStore } from '@/stores/statisticsStore'
import StuckNodeCard from '@/components/StuckNodeCard'
import type { RemindType } from '../../shared/types'

export default function Dashboard() {
  const { stuckNodes, fetchStuckNodes, contracts, fetchContracts, loading } = useContractStore()
  const { createReminder } = useReminderStore()
  const { completeness, fetchCompleteness } = useStatisticsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null)
  const [activeContractId, setActiveContractId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchStuckNodes()
    fetchContracts()
    fetchCompleteness()
  }, [fetchStuckNodes, fetchContracts, fetchCompleteness])

  const pendingCount = (stuckNodes || []).filter((n) => !n.isOverdue).length
  const overdueCount = (stuckNodes || []).filter((n) => n.isOverdue).length
  const handledCount = (contracts || []).filter((c) => c.status === 'COMPLETED').length

  const handleRemind = (nodeId: number) => {
    const node = (stuckNodes || []).find((n) => n.nodeId === nodeId)
    setActiveNodeId(nodeId)
    setActiveContractId(node?.contractId || null)
    setModalOpen(true)
  }

  const handleRemindSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (activeNodeId && activeContractId) {
        await createReminder({
          nodeId: activeNodeId,
          contractId: activeContractId,
          remindType: values.remindType as RemindType,
          remindContent: values.remindContent,
          remindBy: 'system',
          remindTo: (stuckNodes || []).find((n) => n.nodeId === activeNodeId)?.assignee || '',
        })
        message.success('催办已发送')
      }
      setModalOpen(false)
      form.resetFields()
    } catch {}
  }

  const completenessRate = completeness?.rate ?? 0

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={8}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic
              title="待催办数"
              value={pendingCount}
              prefix={<AlertTriangle size={20} className="text-amber-500" />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic
              title="已超时数"
              value={overdueCount}
              prefix={<Clock size={20} className="text-red-500" />}
              valueStyle={{ color: '#EF4444' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic
              title="已处理数"
              value={handledCount}
              prefix={<CheckCircle size={20} className="text-emerald-500" />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={8}>
          <Card title="材料完整率" className="shadow-sm" style={{ borderRadius: 8 }}>
            <div className="flex justify-center">
              <div className="progress-ring" style={{ '--progress': completenessRate } as React.CSSProperties}>
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="#10B981" strokeWidth="10"
                    strokeDasharray={`${completenessRate * 3.14} ${314 - completenessRate * 3.14}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="text-xl font-semibold" fill="#1E293B">
                    {Math.round(completenessRate)}%
                  </text>
                </svg>
              </div>
            </div>
            {completeness && (
              <div className="flex justify-around text-center text-xs text-slate-500 mt-2">
                <div>已提交 <span className="font-medium text-emerald-600">{completeness.submitted}</span></div>
                <div>缺失 <span className="font-medium text-red-500">{completeness.missing}</span></div>
                <div>补齐中 <span className="font-medium text-amber-500">{completeness.supplementing}</span></div>
              </div>
            )}
          </Card>
        </Col>
        <Col span={16}>
          <Card title="卡顿节点列表" className="shadow-sm" style={{ borderRadius: 8 }} loading={loading}>
            {(stuckNodes || []).length === 0 && (
              <div className="text-slate-400 text-sm text-center py-8">暂无卡顿节点</div>
            )}
            {(stuckNodes || []).map((node) => (
              <StuckNodeCard key={node.nodeId} node={node} onRemind={handleRemind} />
            ))}
          </Card>
        </Col>
      </Row>

      <Modal
        title="发送催办"
        open={modalOpen}
        onOk={handleRemindSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        okText="发送"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="remindType" label="催办方式" rules={[{ required: true, message: '请选择催办方式' }]}>
            <Select
              options={[
                { value: 'SMS', label: '短信' },
                { value: 'EMAIL', label: '邮件' },
                { value: 'SYSTEM', label: '系统消息' },
              ]}
              placeholder="请选择催办方式"
            />
          </Form.Item>
          <Form.Item name="remindContent" label="催办内容" rules={[{ required: true, message: '请输入催办内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入催办内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
