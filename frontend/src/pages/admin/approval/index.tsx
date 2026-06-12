import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Typography, Modal, Form, Input, message, Drawer, Descriptions, List, Timeline } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'

import { approval, application, attachment } from '@/api'
import { formatDate, formatMoney } from '@/utils'
import type { ExpenseApplication, ApplicationStatus, ApprovalRequest, PageParams, ApprovalRecord, ExpenseAttachment } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { TextArea } = Input

const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PENDING: { text: '审批中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
}

const Approval: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExpenseApplication[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ExpenseApplication | null>(null)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [form] = Form.useForm<{ comment: string }>()
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await approval.getPendingList(pagination)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch pending approvals failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination])

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleViewDetail = async (record: ExpenseApplication) => {
    try {
      const detail = await application.getById(record.id)
      setSelectedRecord(detail)
      setDrawerVisible(true)
    } catch (error) {
      console.error('Fetch application detail failed:', error)
    }
  }

  const handleApprove = (record: ExpenseApplication) => {
    setSelectedRecord(record)
    setActionType('APPROVE')
    form.resetFields()
    setModalVisible(true)
  }

  const handleReject = (record: ExpenseApplication) => {
    setSelectedRecord(record)
    setActionType('REJECT')
    form.resetFields()
    setModalVisible(true)
  }

  const handleAction = async () => {
    if (!selectedRecord) return
    setActionLoading(true)
    try {
      const values = await form.validateFields()
      const request: ApprovalRequest = {
        applicationId: selectedRecord.id,
        comment: values.comment
      }
      if (actionType === 'APPROVE') {
        await approval.approve(request)
        message.success('审批通过')
      } else {
        await approval.reject(request)
        message.success('已拒绝')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Approval action failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownload = async (att: ExpenseAttachment) => {
    try {
      const blob = await attachment.download(att.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = att.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      message.error('下载失败')
    }
  }

  const columns: ColumnsType<ExpenseApplication> = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 150,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{formatMoney(amount)}</span>
    },
    {
      title: '当前节点',
      dataIndex: 'currentNodeName',
      key: 'currentNodeName',
      width: 120
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      render: (date?: string) => date ? formatDate(date) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
            style={{ color: '#52c41a' }}
          >
            通过
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
            style={{ color: '#ff4d4f' }}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>待我审批</Title>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条待审批`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Modal
        title={actionType === 'APPROVE' ? '审批通过' : '拒绝申请'}
        open={modalVisible}
        onOk={handleAction}
        onCancel={() => setModalVisible(false)}
        confirmLoading={actionLoading}
        okText={actionType === 'APPROVE' ? '确认通过' : '确认拒绝'}
        okButtonProps={{ danger: actionType === 'REJECT' }}
      >
        <p>申请编号：<span style={{ fontFamily: 'monospace' }}>{selectedRecord?.applicationNo}</span></p>
        <p>申请标题：{selectedRecord?.title}</p>
        <p>申请金额：<span style={{ fontWeight: 'bold', color: '#1890ff' }}>{selectedRecord && formatMoney(selectedRecord.amount)}</span></p>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="comment"
            label={actionType === 'APPROVE' ? '审批意见' : '拒绝原因'}
            rules={actionType === 'REJECT' ? [{ required: true, message: '请输入拒绝原因' }] : []}
          >
            <TextArea rows={4} placeholder={actionType === 'APPROVE' ? '请输入审批意见（选填）' : '请输入拒绝原因'} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="申请详情"
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedRecord && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedRecord.title}</Title>
                <Text type="secondary" style={{ fontFamily: 'monospace' }}>编号: {selectedRecord.applicationNo}</Text>
              </div>
              <Tag color={statusMap[selectedRecord.status].color as any}>{statusMap[selectedRecord.status].text}</Tag>
            </div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请人">{selectedRecord.applicantName}</Descriptions.Item>
              <Descriptions.Item label="部门">{selectedRecord.department}</Descriptions.Item>
              <Descriptions.Item label="费用类型">{selectedRecord.expenseType}</Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{formatMoney(selectedRecord.amount)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="当前节点">{selectedRecord.currentNodeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{selectedRecord.submittedAt ? formatDate(selectedRecord.submittedAt) : '-'}</Descriptions.Item>
              <Descriptions.Item label="费用说明" span={2}>{selectedRecord.description}</Descriptions.Item>
            </Descriptions>
            <Card title="附件列表" size="small" style={{ marginBottom: 16 }}>
              {selectedRecord.attachments.length === 0 ? (
                <Text type="secondary">暂无附件</Text>
              ) : (
                <List
                  size="small"
                  dataSource={selectedRecord.attachments}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small" onClick={() => handleDownload(item)}>下载</Button>
                      ]}
                    >
                      <List.Item.Meta title={item.fileName} />
                    </List.Item>
                  )}
                />
              )}
            </Card>
            <Card title="审批记录" size="small">
              {selectedRecord.approvalRecords.length === 0 ? (
                <Text type="secondary">暂无审批记录</Text>
              ) : (
                <Timeline
                  items={selectedRecord.approvalRecords.map((record: ApprovalRecord) => ({
                    color: record.action === 'APPROVE' ? 'green' : record.action === 'REJECT' ? 'red' : 'orange',
                    children: (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {record.nodeName} - {record.approverName}
                          <Tag color={record.action === 'APPROVE' ? 'success' : 'error'} style={{ marginLeft: 8 }}>
                            {record.action === 'APPROVE' ? '同意' : '拒绝'}
                          </Tag>
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>{record.comment || '无意见'}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>{formatDate(record.approvedAt)}</div>
                      </div>
                    )
                  }))}
                />
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default Approval
