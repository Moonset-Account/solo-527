import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Input,
  Form,
  InputNumber,
  Checkbox,
  Tag,
  Row,
  Col,
  Statistic,
  Progress,
  Divider,
  message,
  Modal
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { inspectionService } from '@/services/inspectionService'
import { sessionService } from '@/services/sessionService'
import { ticketService } from '@/services/ticketService'
import type { QualityInspection, InspectionItem, Session } from '@/types'
import { formatDateTime, getScoreColor } from '@/utils'

const { TextArea } = Input
const { confirm } = Modal

export default function InspectionEdit() {
  const { id, sessionId } = useParams<{ id?: string; sessionId?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inspection, setInspection] = useState<QualityInspection | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [form] = Form.useForm()
  const [items, setItems] = useState<InspectionItem[]>([])
  const [showSessionPreview, setShowSessionPreview] = useState(false)
  const [createTicketModal, setCreateTicketModal] = useState(false)

  const isNew = !!sessionId

  useEffect(() => {
    if (isNew && sessionId) {
      loadSession(parseInt(sessionId))
      initNewInspection(parseInt(sessionId))
    } else if (id) {
      loadInspection(parseInt(id))
    }
  }, [id, sessionId])

  const loadSession = async (sid: number) => {
    try {
      const res = await sessionService.getSession(sid)
      if (res.success) {
        setSession(res.data!)
      }
    } catch (error) {
      console.error('加载会话失败', error)
    }
  }

  const initNewInspection = async (sid: number) => {
    try {
      const templatesRes = await inspectionService.getTemplates()
      if (templatesRes.success && templatesRes.data && templatesRes.data.length > 0) {
        const template = templatesRes.data[0]
        const initItems: InspectionItem[] = template.items.map((item, index) => ({
          id: -index - 1,
          inspectionId: 0,
          itemName: item.itemName,
          description: item.description,
          category: item.category,
          maxScore: item.maxScore,
          score: item.maxScore,
          isDeducted: false,
          deductionReason: '',
          sortOrder: item.sortOrder
        }))
        setItems(initItems)
      }
    } catch (error) {
      console.error('加载模板失败', error)
    }
  }

  const loadInspection = async (inspectionId: number) => {
    setLoading(true)
    try {
      const res = await inspectionService.getInspection(inspectionId)
      if (res.success && res.data) {
        setInspection(res.data)
        setItems(res.data.inspectionItems)
        if (res.data.sessionId) {
          loadSession(res.data.sessionId)
        }
        form.setFieldsValue({
          overallComment: res.data.overallComment,
          improvementSuggestion: res.data.improvementSuggestion,
          isRequiresRetrain: res.data.isRequiresRetrain
        })
      }
    } catch (error) {
      console.error('加载质检记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (index: number, value: number | null) => {
    const newItems = [...items]
    const item = newItems[index]
    item.score = value || 0
    item.isDeducted = item.score < item.maxScore
    if (!item.isDeducted) {
      item.deductionReason = ''
    }
    setItems(newItems)
  }

  const handleDeductionReasonChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index].deductionReason = value
    setItems(newItems)
  }

  const calculateTotal = () => {
    const totalScore = items.reduce((sum, item) => sum + item.score, 0)
    const maxScore = items.reduce((sum, item) => sum + item.maxScore, 0)
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const deductedCount = items.filter(item => item.isDeducted).length
    return { totalScore, maxScore, percentage, deductedCount }
  }

  const { totalScore, maxScore, percentage, deductedCount } = calculateTotal()

  const handleSave = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      const updateData = {
        id: id ? parseInt(id) : 0,
        overallComment: values.overallComment,
        improvementSuggestion: values.improvementSuggestion,
        isRequiresRetrain: values.isRequiresRetrain,
        items: items.map(item => ({
          id: item.id,
          score: item.score,
          deductionReason: item.deductionReason
        }))
      }

      if (isNew && sessionId) {
        const res = await inspectionService.createInspection({
          sessionId: parseInt(sessionId),
          inspectorId: 2,
          templateId: 1
        })
        if (res.success && res.data) {
          const updateRes = await inspectionService.updateInspection({
            ...updateData,
            id: res.data.id
          })
          if (updateRes.success) {
            message.success('质检保存成功')
            navigate(`/inspections/${res.data.id}`)
          }
        }
      } else if (id) {
        const res = await inspectionService.updateInspection(updateData)
        if (res.success) {
          message.success('质检保存成功')
          navigate(`/inspections/${id}`)
        }
      }
    } catch (error) {
      console.error('保存失败', error)
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = () => {
    confirm({
      title: '确认完成质检',
      icon: <ExclamationCircleOutlined />,
      content: '完成质检后将无法修改评分，确认要提交吗？',
      okText: '确认提交',
      cancelText: '继续编辑',
      onOk: async () => {
        try {
          if (id) {
            const res = await inspectionService.completeInspection(parseInt(id), 2)
            if (res.success) {
              message.success('质检完成')
              navigate(`/inspections/${id}`)
            }
          }
        } catch (error) {
          console.error('完成质检失败', error)
        }
      }
    })
  }

  const handleCreateTicket = () => {
    setCreateTicketModal(true)
  }

  const confirmCreateTicket = async () => {
    try {
      const res = await ticketService.createTicket({
        type: 0,
        title: `质检问题跟进 - ${inspection?.inspectionNumber || session?.sessionNumber}`,
        description: form.getFieldValue('overallComment') || '',
        priority: 1,
        assigneeDepartmentId: 1,
        relatedInspectionId: inspection?.id,
        relatedSessionId: session?.id
      })
      if (res.success) {
        message.success('工单创建成功')
        setCreateTicketModal(false)
        navigate(`/tickets/${res.data!.id}`)
      }
    } catch (error) {
      console.error('创建工单失败', error)
    }
  }

  const groupByCategory = (itemList: InspectionItem[]) => {
    const groups: Record<string, InspectionItem[]> = {}
    itemList.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }

  const categoryGroups = groupByCategory(items)

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h1 className="page-title">
            {isNew ? '新建质检评分' : '编辑质检评分'}
            {inspection?.inspectionNumber && <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 12 }}>
              {inspection.inspectionNumber}
            </span>}
          </h1>
        </Space>
        <Space>
          <Button icon={<MessageOutlined />} onClick={() => setShowSessionPreview(!showSessionPreview)}>
            {showSessionPreview ? '隐藏会话' : '查看会话'}
          </Button>
          <Button icon={<FileTextOutlined />} onClick={handleCreateTicket}>
            创建工单
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete}>
            完成质检
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={showSessionPreview ? 14 : 18}>
          <Card title="质检评分项" bordered={false} loading={loading}>
            {Object.entries(categoryGroups).map(([category, categoryItems]) => {
              const categoryScore = categoryItems.reduce((sum, item) => sum + item.score, 0)
              const categoryMax = categoryItems.reduce((sum, item) => sum + item.maxScore, 0)
              const catPercentage = categoryMax > 0 ? (categoryScore / categoryMax) * 100 : 0

              return (
                <div key={category} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                      {category}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: getScoreColor(catPercentage), fontWeight: 600, fontSize: 18 }}>
                        {categoryScore.toFixed(1)}
                      </span>
                      <span style={{ color: 'rgba(0,0,0,0.45)' }}>/ {categoryMax} 分</span>
                    </div>
                  </div>
                  <Progress
                    percent={Math.round(catPercentage)}
                    strokeColor={getScoreColor(catPercentage)}
                    showInfo={false}
                    style={{ marginBottom: 16 }}
                  />

                  {categoryItems.map((item, index) => {
                    const actualIndex = items.findIndex(i => i.id === item.id)
                    return (
                      <Card
                        key={item.id}
                        size="small"
                        style={{ marginBottom: 12, borderLeft: `4px solid ${item.isDeducted ? '#f5222d' : '#52c41a'}` }}
                      >
                        <Row gutter={16} align="middle">
                          <Col flex="auto">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 500 }}>{item.itemName}</span>
                              {item.isDeducted && <Tag color="red">已扣分</Tag>}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                                {item.description}
                              </div>
                            )}
                            {item.isDeducted && (
                              <div style={{ marginTop: 12 }}>
                                <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', marginBottom: 4, display: 'block' }}>
                                  扣分原因
                                </label>
                                <TextArea
                                  rows={2}
                                  placeholder="请输入扣分原因"
                                  value={item.deductionReason}
                                  onChange={(e) => handleDeductionReasonChange(actualIndex, e.target.value)}
                                  maxLength={500}
                                />
                              </div>
                            )}
                          </Col>
                          <Col style={{ width: 140 }}>
                            <div style={{ textAlign: 'center' }}>
                              <InputNumber
                                min={0}
                                max={item.maxScore}
                                step={0.5}
                                value={item.score}
                                onChange={(v) => handleScoreChange(actualIndex, v as number)}
                                style={{ width: '100%', textAlign: 'center' }}
                                size="large"
                              />
                              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                                满分 {item.maxScore}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    )
                  })}
                </div>
              )
            })}
          </Card>

          <Card title="总体评价" bordered={false} style={{ marginTop: 16 }}>
            <Form form={form} layout="vertical">
              <Form.Item
                label="总体评语"
                name="overallComment"
                rules={[{ max: 2000, message: '评语不能超过2000字' }]}
              >
                <TextArea rows={4} placeholder="请输入对本次客服服务的总体评价" maxLength={2000} showCount />
              </Form.Item>
              <Form.Item
                label="改进建议"
                name="improvementSuggestion"
                rules={[{ max: 500, message: '建议不能超过500字' }]}
              >
                <TextArea rows={3} placeholder="请输入改进建议" maxLength={500} showCount />
              </Form.Item>
              <Form.Item name="isRequiresRetrain" valuePropName="checked">
                <Checkbox>需要进行培训</Checkbox>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col flex="auto">
          <Card title="评分概览" bordered={false} style={{ marginBottom: 16, position: 'sticky', top: 24 }}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: getScoreColor(percentage)
              }}>
                {percentage.toFixed(1)}
              </div>
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>
                总分 {maxScore} / 得分 {totalScore}
              </div>
              <Progress
                percent={Math.round(percentage)}
                strokeColor={getScoreColor(percentage)}
                size="large"
                showInfo={false}
                style={{ marginTop: 16 }}
              />
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="质检项" value={items.length} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="扣分项"
                  value={deductedCount}
                  valueStyle={{ color: deductedCount > 0 ? '#f5222d' : 'rgba(0,0,0,0.45)' }}
                />
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              <div style={{ marginBottom: 8 }}>会话信息</div>
              <div style={{ marginBottom: 4 }}>会话编号：{session?.sessionNumber}</div>
              <div style={{ marginBottom: 4 }}>客服人员：{session?.agentName}</div>
              <div style={{ marginBottom: 4 }}>创建时间：{formatDateTime(session?.createdAt)}</div>
              <div>响应时长：{session?.responseTimeDisplay || '-'}</div>
            </div>
          </Card>
        </Col>
      </Row>

      {showSessionPreview && session && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 64,
          bottom: 0,
          width: 400,
          background: '#fff',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 100,
          overflow: 'auto'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>会话详情</span>
            <Button type="link" size="small" onClick={() => navigate(`/sessions/${session.id}`)}>
              打开
            </Button>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>
              <div>客户：{session.customerName}</div>
              <div>客服：{session.agentName}</div>
              <div>标题：{session.title}</div>
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 12, minHeight: 300 }}>
              <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)', padding: 40 }}>
                点击"打开"查看完整会话内容
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        title="创建跟进工单"
        open={createTicketModal}
        onCancel={() => setCreateTicketModal(false)}
        onOk={confirmCreateTicket}
        okText="创建工单"
      >
        <p style={{ color: 'rgba(0,0,0,0.65)' }}>
          将根据本次质检结果创建一个跟进工单，分配给客服部门处理。
        </p>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>
          <div>工单类型：质量问题</div>
          <div>优先级：中</div>
          <div>处理部门：客服一部</div>
        </div>
      </Modal>
    </div>
  )
}
