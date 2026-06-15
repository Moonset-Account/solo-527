import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Empty,
  Statistic,
  Row,
  Col,
  List,
  Modal,
  Form,
  Input,
  Select,
  message,
  Rate,
  Alert,
  Progress
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  BookOutlined,
  EyeOutlined,
  LikeOutlined,
  DislikeOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { knowledgeService } from '@/services/knowledgeService'
import type { KnowledgeBase, KnowledgeReviewRecord } from '@/types'
import { formatDateTime } from '@/utils'

const { TextArea } = Input
const { Option } = Select

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [knowledge, setKnowledge] = useState<KnowledgeBase | null>(null)
  const [reviewRecords, setReviewRecords] = useState<KnowledgeReviewRecord[]>([])
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [reviewForm] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    if (id) {
      loadKnowledge(parseInt(id))
      loadReviews(parseInt(id))
    }
  }, [id])

  const loadKnowledge = async (kid: number) => {
    setLoading(true)
    try {
      const res = await knowledgeService.getKnowledgeBase(kid)
      if (res.success) {
        setKnowledge(res.data!)
      }
    } catch (error) {
      console.error('加载知识详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async (kid: number) => {
    try {
      const res = await knowledgeService.getReviews(kid)
      if (res.success) {
        setReviewRecords(res.data || [])
      }
    } catch (error) {
      console.error('加载审核记录失败', error)
    }
  }

  const handleReview = async (values: any) => {
    try {
      const res = await knowledgeService.addReview({
        knowledgeBaseId: parseInt(id!),
        reviewerId: 2,
        reviewerName: '张质检',
        ...values
      })
      if (res.success) {
        message.success('审核提交成功')
        setReviewModalVisible(false)
        reviewForm.resetFields()
        loadKnowledge(parseInt(id!))
        loadReviews(parseInt(id!))
      }
    } catch (error) {
      console.error('提交审核失败', error)
    }
  }

  const handleEdit = async (values: any) => {
    try {
      const res = await knowledgeService.updateKnowledgeBase({
        id: parseInt(id!),
        ...values,
        expiryDate: values.expiryDate?.toISOString()
      })
      if (res.success) {
        message.success('更新成功')
        setEditModalVisible(false)
        editForm.resetFields()
        loadKnowledge(parseInt(id!))
      }
    } catch (error) {
      console.error('更新失败', error)
    }
  }

  const handleMarkUsed = (isHelpful: boolean) => {
    if (!id) return
    knowledgeService.markAsUsed(parseInt(id), isHelpful).then(res => {
      if (res.success) {
        message.success(isHelpful ? '感谢您的反馈' : '感谢反馈，我们会改进')
        loadKnowledge(parseInt(id!))
      }
    })
  }

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      0: 'default',
      1: 'processing',
      2: 'success',
      3: 'warning',
      4: 'default',
      5: 'error'
    }
    return colors[status] || 'default'
  }

  const getResultColor = (result: number) => {
    const colors: Record<number, string> = {
      0: 'success',
      1: 'warning',
      2: 'error',
      3: 'error'
    }
    return colors[result] || 'default'
  }

  const helpfulRate = knowledge
    ? knowledge.helpfulCount + knowledge.notHelpfulCount > 0
      ? Math.round(knowledge.helpfulCount / (knowledge.helpfulCount + knowledge.notHelpfulCount) * 100)
      : null
    : null

  if (!knowledge && !loading) {
    return (
      <div className="page-container">
        <Empty description="知识不存在" />
      </div>
    )
  }

  const isExpiringSoon = knowledge && !knowledge.isExpired && knowledge.daysUntilExpiry > 0 && knowledge.daysUntilExpiry <= 7

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h1 className="page-title">{knowledge?.title}</h1>
          <Tag color={getStatusColor(knowledge?.status || 0)}>
            {knowledge?.statusText}
          </Tag>
          {knowledge?.isExpired && (
            <Tag color="red">已失效</Tag>
          )}
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => {
            editForm.setFieldsValue({
              title: knowledge?.title,
              category: knowledge?.category,
              summary: knowledge?.summary,
              content: knowledge?.content,
              tags: knowledge?.tags,
              remark: knowledge?.remark,
              processingResult: knowledge?.processingResult,
              status: knowledge?.status
            })
            setEditModalVisible(true)
          }}>
            编辑
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => setReviewModalVisible(true)}>
            审核
          </Button>
          <Button type="primary" icon={<CheckCircleOutlined />}>
            标记有用
          </Button>
        </Space>
      </div>

      {knowledge?.isExpired && (
        <Alert
          message="该知识已失效"
          description="此条知识已超过失效日期，请谨慎参考，建议查阅最新版本。"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" danger>
              申请更新
            </Button>
          }
        />
      )}

      {isExpiringSoon && (
        <Alert
          message="知识即将失效"
          description={`此条知识将在 ${knowledge.daysUntilExpiry} 天后失效，请及时审核更新。`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => setReviewModalVisible(true)}>
              立即审核
            </Button>
          }
        />
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card title="知识内容" bordered={false} loading={loading}>
            {knowledge?.summary && (
              <div style={{
                padding: '12px 16px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>摘要</div>
                <div style={{ color: 'rgba(0,0,0,0.65)' }}>{knowledge.summary}</div>
              </div>
            )}

            <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {knowledge?.content}
            </div>

            <Divider style={{ margin: '24px 0' }} />

            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ marginBottom: 12 }}>这篇知识对您有帮助吗？</div>
              <Space size="large">
                <Button
                  icon={<LikeOutlined />}
                  onClick={() => handleMarkUsed(true)}
                >
                  有帮助 ({knowledge?.helpfulCount || 0})
                </Button>
                <Button
                  icon={<DislikeOutlined />}
                  onClick={() => handleMarkUsed(false)}
                >
                  没帮助 ({knowledge?.notHelpfulCount || 0})
                </Button>
              </Space>
              {helpfulRate !== null && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    有用率：
                  </span>
                  <span style={{ color: helpfulRate >= 80 ? '#52c41a' : helpfulRate >= 60 ? '#faad14' : '#f5222d' }}>
                    {helpfulRate}%
                  </span>
                </div>
              )}
            </div>
          </Card>

          {knowledge?.remark && (
            <Card title="备注信息" bordered={false} style={{ marginTop: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{knowledge.remark}</div>
            </Card>
          )}

          {knowledge?.processingResult && (
            <Card title="处理结果" bordered={false} style={{ marginTop: 16 }}>
              <div style={{
                padding: '12px 16px',
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 4
              }}>
                {knowledge.processingResult}
              </div>
            </Card>
          )}

          <Card
            title={`审核记录 (${reviewRecords.length})`}
            bordered={false}
            style={{ marginTop: 16 }}
            extra={
              <Button type="link" size="small" onClick={() => setReviewModalVisible(true)}>
                添加审核
              </Button>
            }
          >
            {reviewRecords.length === 0 ? (
              <Empty description="暂无审核记录" />
            ) : (
              <List
                dataSource={reviewRecords}
                itemLayout="horizontal"
                renderItem={(item) => (
                  <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{item.reviewerName}</span>
                          <Tag color={getResultColor(item.result)}>{item.resultText}</Tag>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                            {formatDateTime(item.reviewedAt)}
                          </span>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          {item.comment && (
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ color: 'rgba(0,0,0,0.65)' }}>审核意见：</span>
                              {item.comment}
                            </div>
                          )}
                          {item.processingResult && (
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ color: 'rgba(0,0,0,0.65)' }}>处理结果：</span>
                              <span style={{ color: '#1890ff' }}>{item.processingResult}</span>
                            </div>
                          )}
                          {item.customerSatisfaction && (
                            <div>
                              <span style={{ color: 'rgba(0,0,0,0.65)' }}>客户满意度：</span>
                              <span style={{ color: '#52c41a' }}>{item.customerSatisfaction}</span>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>

        <div style={{ width: 280, flexShrink: 0 }}>
          <Card title="知识信息" bordered={false} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="分类">
                {knowledge?.category}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(knowledge?.status || 0)}>
                  {knowledge?.statusText}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="作者">
                {knowledge?.authorName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审核人">
                {knowledge?.reviewerName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(knowledge?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(knowledge?.updatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="失效日期">
                {knowledge?.expiryDate ? (
                  <span style={{ color: knowledge?.isExpired ? '#f5222d' : undefined }}>
                    {formatDateTime(knowledge.expiryDate)}
                  </span>
                ) : '永不过期'}
              </Descriptions.Item>
              <Descriptions.Item label="最后审核">
                {knowledge?.lastReviewAt ? formatDateTime(knowledge.lastReviewAt) : '未审核'}
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                {knowledge?.tags?.split(',').map((tag, i) => (
                  <Tag key={i} color="blue">{tag}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="使用统计" bordered={false} style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="浏览量"
                  value={knowledge?.viewCount || 0}
                  prefix={<EyeOutlined />}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="使用量"
                  value={knowledge?.useCount || 0}
                  prefix={<BookOutlined />}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 6 }}>
                客户满意度
              </div>
              <Progress
                percent={helpfulRate || 0}
                strokeColor={helpfulRate && helpfulRate >= 80 ? '#52c41a' : helpfulRate && helpfulRate >= 60 ? '#faad14' : '#f5222d'}
                showInfo={true}
                format={percent => `${percent}%`}
              />
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                基于 {knowledge?.helpfulCount! + knowledge?.notHelpfulCount! || 0} 次反馈
              </div>
            </div>
          </Card>

          <Card
            title="快捷操作"
            bordered={false}
            style={{ position: 'sticky', top: 24 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<ClockCircleOutlined />} onClick={() => setReviewModalVisible(true)}>
                审核知识
              </Button>
              <Button block icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
                编辑知识
              </Button>
              <Button block icon={<FileTextOutlined />}>
                关联工单
              </Button>
              <Button block icon={<CheckCircleOutlined />}>
                分享知识
              </Button>
            </Space>
          </Card>
        </div>
      </div>

      <Modal
        title="审核知识"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleReview}
        >
          <Form.Item
            label="审核结果"
            name="result"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value={0}>通过</Option>
              <Option value={1}>需修订</Option>
              <Option value={2}>拒绝</Option>
              <Option value={3}>标记失效</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="审核意见"
            name="comment"
          >
            <TextArea rows={3} placeholder="请输入审核意见" maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            label="处理结果"
            name="processingResult"
            help="记录本次审核的最终处理结果"
          >
            <TextArea rows={2} placeholder="请输入处理结果" maxLength={500} />
          </Form.Item>
          <Form.Item
            label="客户满意统计"
            name="customerSatisfaction"
            help="可选：记录相关客户满意度数据"
          >
            <Input placeholder="如：95% 满意" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交审核</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑知识"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item
            label="知识标题"
            name="title"
            rules={[{ required: true, message: '请输入知识标题' }]}
          >
            <Input placeholder="请输入知识标题" maxLength={500} />
          </Form.Item>
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="产品使用">产品使用</Option>
              <Option value="常见问题">常见问题</Option>
              <Option value="政策法规">政策法规</Option>
              <Option value="操作指南">操作指南</Option>
              <Option value="故障排查">故障排查</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={0}>草稿</Option>
              <Option value={1}>审核中</Option>
              <Option value={2}>已发布</Option>
              <Option value={3}>待更新</Option>
              <Option value={4}>已归档</Option>
              <Option value={5}>已失效</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="摘要"
            name="summary"
          >
            <Input.TextArea rows={2} placeholder="请输入知识摘要" maxLength={200} />
          </Form.Item>
          <Form.Item
            label="知识内容"
            name="content"
            rules={[{ required: true, message: '请输入知识内容' }]}
          >
            <Input.TextArea rows={6} placeholder="请输入详细的知识内容" maxLength={10000} showCount />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
          >
            <TextArea rows={2} placeholder="可选：添加备注信息" maxLength={2000} />
          </Form.Item>
          <Form.Item
            label="处理结果"
            name="processingResult"
          >
            <TextArea rows={2} placeholder="可选：记录处理结果" maxLength={500} />
          </Form.Item>
          <Form.Item
            label="标签"
            name="tags"
          >
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

import { Divider } from 'antd'
