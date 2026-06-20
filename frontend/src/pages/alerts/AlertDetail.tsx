import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Descriptions, Tag, Button, Space, Card, List, Timeline, Input, Upload,
  Modal, Form, Select, Tabs, message, Empty, Divider
} from 'antd'
import { ArrowLeftOutlined, UploadOutlined, CommentOutlined } from '@ant-design/icons'
import { alertApi, Alert, AlertRecord, AlertAttachment, AlertHistory } from '../../api/alerts'
import dayjs from 'dayjs'

const { TextArea } = Input

const AlertDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(false)
  const [commentVisible, setCommentVisible] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [solutionVisible, setSolutionVisible] = useState(false)
  const [solutionForm] = Form.useForm()

  useEffect(() => {
    if (id) loadDetail(Number(id))
  }, [id])

  const loadDetail = async (alertId: number) => {
    setLoading(true)
    try {
      const res = await alertApi.detail(alertId)
      setAlert(res)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = { info: 'blue', warning: 'orange', critical: 'red', emergency: 'magenta' }
    return map[level] || 'default'
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { pending: 'gold', acknowledged: 'blue', processing: 'cyan', closed: 'green' }
    return map[status] || 'default'
  }

  const handleAcknowledge = async () => {
    if (!alert) return
    try {
      await alertApi.acknowledge(alert.id)
      message.success('已确认告警')
      loadDetail(alert.id)
    } catch (e) {}
  }

  const handleStartProcess = async () => {
    if (!alert) return
    try {
      await alertApi.startProcess(alert.id)
      message.success('已开始处理')
      loadDetail(alert.id)
    } catch (e) {}
  }

  const handleClose = async () => {
    if (!alert) return
    Modal.confirm({
      title: '关闭告警',
      content: '确定要关闭此告警吗?',
      onOk: async () => {
        try {
          await alertApi.close(alert.id)
          message.success('告警已关闭')
          loadDetail(alert.id)
        } catch (e) {}
      },
    })
  }

  const handleAddComment = async () => {
    if (!alert || !commentText.trim()) return
    try {
      await alertApi.addComment(alert.id, { comment: commentText })
      message.success('备注已添加')
      setCommentText('')
      setCommentVisible(false)
      loadDetail(alert.id)
    } catch (e) {}
  }

  const handleUpload = (file: File) => {
    if (!alert) return
    alertApi.uploadAttachment(alert.id, file).then(() => {
      message.success('上传成功')
      loadDetail(alert.id)
    }).catch(() => {})
    return false
  }

  const handleSaveSolution = async () => {
    if (!alert) return
    try {
      const values = await solutionForm.validateFields()
      await alertApi.update(alert.id, values)
      message.success('保存成功')
      setSolutionVisible(false)
      loadDetail(alert.id)
    } catch (e) {}
  }

  if (!alert) return <div style={{ padding: 24 }}>加载中...</div>

  const renderActionButtons = () => {
    const buttons: React.ReactNode[] = []
    if (alert.status === 'pending') {
      buttons.push(<Button type="primary" key="ack" onClick={handleAcknowledge}>确认告警</Button>)
    }
    if (['pending', 'acknowledged'].includes(alert.status)) {
      buttons.push(<Button type="primary" key="start" onClick={handleStartProcess}>开始处理</Button>)
    }
    if (alert.status !== 'closed') {
      buttons.push(<Button key="close" danger onClick={handleClose}>关闭告警</Button>)
    }
    buttons.push(<Button key="comment" icon={<CommentOutlined />} onClick={() => setCommentVisible(true)}>添加备注</Button>)
    return buttons
  }

  const records = alert.records || []
  const attachments = alert.attachments || []
  const histories = alert.histories || []

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alerts')}>返回</Button>
          <h2 style={{ margin: 0 }}>{alert.code} - {alert.title}</h2>
          <Tag color={getLevelColor(alert.level)}>{alert.level_display}</Tag>
          <Tag color={getStatusColor(alert.status)}>{alert.status_display}</Tag>
        </Space>
        <Space>{renderActionButtons()}</Space>
      </div>

      <div className="detail-section">
        <Descriptions title="告警信息" bordered column={2} size="small">
          <Descriptions.Item label="告警编号">{alert.code}</Descriptions.Item>
          <Descriptions.Item label="告警标题">{alert.title}</Descriptions.Item>
          <Descriptions.Item label="告警来源">{alert.source_display}</Descriptions.Item>
          <Descriptions.Item label="告警级别"><Tag color={getLevelColor(alert.level)}>{alert.level_display}</Tag></Descriptions.Item>
          <Descriptions.Item label="处理状态"><Tag color={getStatusColor(alert.status)}>{alert.status_display}</Tag></Descriptions.Item>
          <Descriptions.Item label="告警分类">{alert.category_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="关联服务器">{alert.server_name ? `${alert.server_name}(${alert.server_ip})` : '-'}</Descriptions.Item>
          <Descriptions.Item label="关联变更窗口">{alert.change_window_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="监控指标">{alert.metric || '-'}</Descriptions.Item>
          <Descriptions.Item label="指标值/阈值">{alert.metric_value ? `${alert.metric_value} / ${alert.threshold}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="当前处理人">{alert.handler_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="发生时间">{alert.occurred_at}</Descriptions.Item>
          <Descriptions.Item label="确认人/时间">{alert.acknowledged_by_name ? `${alert.acknowledged_by_name} / ${alert.acknowledged_at}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="处理完成/时间">{alert.processed_by_name ? `${alert.processed_by_name} / ${alert.processed_at}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="关闭人/时间">{alert.closed_by_name ? `${alert.closed_by_name} / ${alert.closed_at}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="告警内容" span={2}>{alert.content}</Descriptions.Item>
        </Descriptions>
      </div>

      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="detail-section-title" style={{ border: 0, margin: 0, padding: 0 }}>解决方案与复盘</div>
          <Button type="primary" size="small" onClick={() => {
            solutionForm.setFieldsValue({ solution: alert.solution, root_cause: alert.root_cause, review_summary: alert.review_summary })
            setSolutionVisible(true)
          }}>编辑</Button>
        </div>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="解决方案">{alert.solution || '暂无'}</Descriptions.Item>
          <Descriptions.Item label="根本原因">{alert.root_cause || '暂无'}</Descriptions.Item>
          <Descriptions.Item label="复盘总结">{alert.review_summary || '暂无'}</Descriptions.Item>
        </Descriptions>
      </div>

      <Tabs defaultActiveKey="records" items={[
        {
          key: 'records',
          label: `处理记录(${records.length})`,
          children: records.length > 0 ? (
            <Timeline
              items={records.map((r: AlertRecord) => ({
                color: r.action.includes('失败') ? 'red' : 'blue',
                children: (
                  <Card size="small" style={{ marginBottom: 8 }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space>
                        <strong>{r.action}</strong>
                        {r.old_status && <Tag>{r.old_status_display}</Tag>}
                        {r.old_status && r.new_status && '→'}
                        {r.new_status && <Tag color="blue">{r.new_status_display}</Tag>}
                        <span style={{ color: '#999' }}>{r.processed_at}</span>
                        <span style={{ color: '#999' }}>处理人: {r.processed_by_name || '系统'}</span>
                      </Space>
                      {r.comment && <div style={{ color: '#555' }}>{r.comment}</div>}
                    </Space>
                  </Card>
                ),
              }))}
            />
          ) : <Empty description="暂无处理记录" />,
        },
        {
          key: 'attachments',
          label: `附件(${attachments.length})`,
          children: (
            <div>
              <Space style={{ marginBottom: 16 }}>
                <Upload showUploadList={false} beforeUpload={handleUpload}>
                  <Button icon={<UploadOutlined />}>上传附件</Button>
                </Upload>
              </Space>
              {attachments.length > 0 ? (
                <List
                  dataSource={attachments}
                  renderItem={(item: AlertAttachment) => (
                    <List.Item
                      actions={[<a href={item.file_url} target="_blank" rel="noreferrer">下载</a>]}
                    >
                      <List.Item.Meta
                        title={item.file_name}
                        description={`${(item.file_size / 1024).toFixed(1)}KB · 上传人: ${item.uploaded_by_name} · ${item.created_at}`}
                      />
                    </List.Item>
                  )}
                />
              ) : <Empty description="暂无附件" />}
            </div>
          ),
        },
        {
          key: 'histories',
          label: `修改历史(${histories.length})`,
          children: histories.length > 0 ? (
            <List
              dataSource={histories}
              renderItem={(item: AlertHistory) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${item.changed_by_name || '系统'} 修改了 [${item.field}]`}
                    description={
                      <div>
                        <div>旧值: {item.old_value || '(空)'}</div>
                        <div>新值: {item.new_value || '(空)'}</div>
                        <div style={{ color: '#999' }}>{item.changed_at}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : <Empty description="暂无修改历史" />,
        },
      ]} />

      <Modal
        title="添加备注"
        open={commentVisible}
        onCancel={() => setCommentVisible(false)}
        onOk={handleAddComment}
        okText="提交"
      >
        <TextArea rows={4} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="请输入备注内容..." />
      </Modal>

      <Modal
        title="编辑解决方案"
        open={solutionVisible}
        onCancel={() => setSolutionVisible(false)}
        onOk={handleSaveSolution}
        okText="保存"
        width={600}
      >
        <Form form={solutionForm} layout="vertical">
          <Form.Item name="solution" label="解决方案">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="root_cause" label="根本原因">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="review_summary" label="复盘总结">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AlertDetail
