import React, { useState, useEffect } from 'react'
import {
  Table, Button, Tag, Modal, Form, Input, message, Space, Tabs,
  Descriptions, List, Card, Alert,
} from 'antd'
import { CheckOutlined, CloseOutlined, PaperClipOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getMyApprovals, approveRequest, rejectRequest } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const ApprovalCenter = () => {
  const [pendingData, setPendingData] = useState([])
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [actionType, setActionType] = useState('')
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await getMyApprovals({ status: 'pending', pageSize: 100 })
      setPendingData(res.list)
    } finally {
      setLoading(false)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await getMyApprovals({ pageSize: 50 })
      setAllData(res.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = (record) => {
    setCurrentRecord(record)
    setActionType('approve')
    setModalVisible(true)
  }

  const handleReject = (record) => {
    setCurrentRecord(record)
    setActionType('reject')
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (actionType === 'approve') {
        await approveRequest(currentRecord.id, values)
        message.success('审批通过')
      } else {
        await rejectRequest(currentRecord.id, values)
        message.success('已驳回')
      }
      setModalVisible(false)
      form.resetFields()
      fetchPending()
      fetchAll()
    } catch (e) {}
  }

  const columns = [
    { title: '需求编号', dataIndex: ['request', 'requestNo'], width: 150 },
    { title: '标题', dataIndex: ['request', 'title'], ellipsis: true },
    { title: '项目名称', dataIndex: ['request', 'projectName'], width: 150 },
    {
      title: '总金额',
      dataIndex: ['request', 'totalAmount'],
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '申请人',
      dataIndex: ['request', 'requester', 'realName'],
      width: 100,
    },
    { title: '审批层级', dataIndex: 'level', width: 100 },
    {
      title: '附件数',
      dataIndex: ['request', 'attachments'],
      width: 80,
      render: (v) => v?.length > 0 ? <Tag color="blue">{v.length} 个</Tag> : '-',
    },
    {
      title: '价格波动',
      dataIndex: ['request', 'priceAlerts'],
      width: 100,
      render: (v) => {
        const unread = v?.filter(a => !a.isReviewed).length || 0
        return unread > 0 ? <Tag color="orange">{unread} 条待复盘</Tag> : '-'
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const map = {
          pending: { text: '待审批', color: 'processing' },
          approved: { text: '已通过', color: 'success' },
          rejected: { text: '已驳回', color: 'error' },
        }
        const s = map[v] || { text: v, color: 'default' }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '申请时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/purchase-requests/${record.requestId}`)}
          >
            查看详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const renderPriceAlerts = () => {
    const alerts = currentRecord?.request?.priceAlerts?.filter(a => !a.isReviewed) || []
    if (alerts.length === 0) return null
    return (
      <Alert
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 16 }}
        message={`价格波动提醒（${alerts.length} 项待复盘）`}
        description={
          <List size="small" dataSource={alerts}
            renderItem={a => (
              <List.Item>
                <strong>{a.materialName}：</strong>
                历史价 ¥{Number(a.oldPrice).toLocaleString()} →
                当前价 ¥{Number(a.newPrice).toLocaleString()}，
                <span style={{ color: a.fluctuation > 0 ? '#f5222d' : '#52c41a' }}>
                  波动 {a.fluctuation > 0 ? '+' : ''}{a.fluctuation}%
                </span>
              </List.Item>
            )}
          />
        }
      />
    )
  }

  return (
    <div className="page-container">
      <div className="page-title">审批中心</div>

      <Tabs
        defaultActiveKey="pending"
        onChange={(key) => {
          if (key === 'all') fetchAll()
          else fetchPending()
        }}
        items={[
          {
            key: 'pending',
            label: `待我审批 (${pendingData.length})`,
            children: (
              <Table
                columns={columns}
                dataSource={pendingData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            ),
          },
          {
            key: 'all',
            label: '全部审批',
            children: (
              <Table
                columns={columns}
                dataSource={allData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            ),
          },
        ]}
      />

      <Modal
        title={
          <Space>
            <span>{actionType === 'approve' ? '审批通过' : '审批驳回'}</span>
            <Tag>{currentRecord?.request?.requestNo}</Tag>
          </Space>
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={actionType === 'approve' ? '确认通过' : '确认驳回'}
        cancelText="取消"
        okButtonProps={{ danger: actionType === 'reject' }}
        width={700}
      >
        {currentRecord && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="需求标题">{currentRecord.request?.title}</Descriptions.Item>
              <Descriptions.Item label="项目">{currentRecord.request?.projectName}</Descriptions.Item>
              <Descriptions.Item label="申请人">{currentRecord.request?.requester?.realName}</Descriptions.Item>
              <Descriptions.Item label="总金额">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  ¥{Number(currentRecord.request?.totalAmount).toLocaleString()}
                </span>
              </Descriptions.Item>
            </Descriptions>

            {renderPriceAlerts()}

            <Card size="small" title="物料明细" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={currentRecord.request?.items || []}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '物料', dataIndex: 'materialName' },
                  { title: '规格', dataIndex: 'specification' },
                  { title: '单位', dataIndex: 'unit', width: 60 },
                  { title: '数量', dataIndex: 'quantity', width: 80 },
                  { title: '单价', dataIndex: 'estimatedPrice', width: 100, render: v => `¥${Number(v).toLocaleString()}` },
                  { title: '金额', dataIndex: 'totalAmount', width: 110, render: v => `¥${Number(v).toLocaleString()}` },
                ]}
              />
            </Card>

            {currentRecord.request?.attachments?.length > 0 && (
              <Card size="small" title={<Space><PaperClipOutlined />附件 ({currentRecord.request.attachments.length})</Space>} style={{ marginBottom: 16 }}>
                <List
                  size="small"
                  dataSource={currentRecord.request.attachments}
                  renderItem={att => (
                    <List.Item>
                      <List.Item.Meta title={att.fileName} description={`${(att.fileSize / 1024).toFixed(1)} KB`} />
                      <a href={att.fileUrl} target="_blank" rel="noreferrer">下载</a>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            <Form form={form} layout="vertical">
              <Form.Item
                name="comment"
                label={actionType === 'approve' ? '审批意见' : '驳回原因'}
                rules={actionType === 'reject' ? [{ required: true, message: '请输入驳回原因' }] : []}
              >
                <Input.TextArea rows={3} placeholder={actionType === 'approve' ? '请输入审批意见（选填）' : '请输入驳回原因（必填）'} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ApprovalCenter
