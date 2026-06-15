import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  List,
  Progress,
  Row,
  Col,
  Statistic,
  Empty,
  Typography
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { inspectionService } from '@/services/inspectionService'
import type { QualityInspection, InspectionItem } from '@/types'
import { formatDateTime, getScoreColor } from '@/utils'

const { Text } = Typography

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [inspection, setInspection] = useState<QualityInspection | null>(null)

  useEffect(() => {
    if (id) {
      loadInspection(parseInt(id))
    }
  }, [id])

  const loadInspection = async (inspectionId: number) => {
    setLoading(true)
    try {
      const res = await inspectionService.getInspection(inspectionId)
      if (res.success) {
        setInspection(res.data!)
      }
    } catch (error) {
      console.error('加载质检详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      0: 'default',
      1: 'processing',
      2: 'success',
      3: 'warning',
      4: 'purple'
    }
    return colors[status] || 'default'
  }

  const groupByCategory = (items: InspectionItem[]) => {
    const groups: Record<string, InspectionItem[]> = {}
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }

  if (!inspection && !loading) {
    return (
      <div className="page-container">
        <Empty description="质检记录不存在" />
      </div>
    )
  }

  const categoryGroups = inspection ? groupByCategory(inspection.inspectionItems) : {}

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h1 className="page-title">质检详情 - {inspection?.inspectionNumber}</h1>
          <Tag color={getStatusColor(inspection?.status || 0)}>
            {inspection?.statusText}
          </Tag>
        </Space>
        <Space>
          {inspection?.status !== 2 && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/inspections/edit/${id}`)}
            >
              编辑质检
            </Button>
          )}
          <Button icon={<MessageOutlined />}>查看会话</Button>
          <Button icon={<FileTextOutlined />}>生成报告</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="质检评分" bordered={false} loading={loading}>
            {Object.entries(categoryGroups).map(([category, items]) => {
              const categoryScore = items.reduce((sum, item) => sum + item.score, 0)
              const categoryMax = items.reduce((sum, item) => sum + item.maxScore, 0)
              const percentage = categoryMax > 0 ? (categoryScore / categoryMax) * 100 : 0

              return (
                <div key={category} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 15 }}>{category}</Text>
                    <Text style={{ color: getScoreColor(percentage), fontWeight: 500 }}>
                      {categoryScore.toFixed(1)} / {categoryMax} 分
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round(percentage)}
                    strokeColor={getScoreColor(percentage)}
                    showInfo={false}
                    style={{ marginBottom: 12 }}
                  />
                  <List
                    size="small"
                    dataSource={items}
                    renderItem={(item) => (
                      <List.Item
                        style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                      >
                        <List.Item.Meta
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{item.itemName}</span>
                              {item.isDeducted && <Tag color="red">扣分</Tag>}
                            </div>
                          }
                          description={
                            <div>
                              {item.description && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {item.description}
                                </Text>
                              )}
                              {item.deductionReason && (
                                <div style={{
                                  marginTop: 6,
                                  padding: '6px 10px',
                                  background: '#fff2f0',
                                  borderRadius: 4,
                                  fontSize: 12,
                                  color: '#cf1322'
                                }}>
                                  扣分原因：{item.deductionReason}
                                </div>
                              )}
                            </div>
                          }
                        />
                        <div style={{ textAlign: 'right' }}>
                          <Text strong style={{ color: getScoreColor(item.score / item.maxScore * 100), fontSize: 16 }}>
                            {item.score}
                          </Text>
                          <Text type="secondary"> / {item.maxScore}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              )
            })}
          </Card>

          <Card title="总体评价" bordered={false} style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总体评语">
                {inspection?.overallComment || '暂无'}
              </Descriptions.Item>
              <Descriptions.Item label="改进建议">
                {inspection?.improvementSuggestion || '暂无'}
              </Descriptions.Item>
              <Descriptions.Item label="是否需要培训">
                {inspection?.isRequiresRetrain ? <Tag color="red">是</Tag> : '否'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="质检概览" bordered={false} style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: getScoreColor(inspection?.scorePercentage || 0)
              }}>
                {inspection?.scorePercentage.toFixed(1)}
              </div>
              <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: -8 }}>
                总分 {inspection?.maxScore} / 得分 {inspection?.totalScore}
              </div>
              <Progress
                percent={Math.round(inspection?.scorePercentage || 0)}
                strokeColor={getScoreColor(inspection?.scorePercentage || 0)}
                showInfo={false}
                style={{ marginTop: 12 }}
              />
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="质检项" value={inspection?.inspectionItems.length || 0} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="扣分项"
                  value={inspection?.inspectionItems.filter(i => i.isDeducted).length || 0}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="关联信息" bordered={false} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="关联会话">
                <a onClick={() => navigate(`/sessions/${inspection?.sessionId}`)}>
                  {inspection?.sessionNumber}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="会话标题">
                {inspection?.sessionTitle}
              </Descriptions.Item>
              <Descriptions.Item label="质检员">
                {inspection?.inspectorName}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(inspection?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {formatDateTime(inspection?.completedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {inspection?.relatedTicketId && (
            <Card
              title="关联工单"
              bordered={false}
              extra={
                <Button type="link" size="small" onClick={() => navigate(`/tickets/${inspection.relatedTicketId}`)}>
                  查看
                </Button>
              }
            >
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                工单编号：TK20240115001
              </p>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
