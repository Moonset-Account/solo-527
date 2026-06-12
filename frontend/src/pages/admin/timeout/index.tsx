import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Card, Typography, Modal, Form, Input, Select, message, Radio } from 'antd'
import { WarningOutlined, CheckOutlined, CloseOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { timeout, user } from '@/api'
import { formatDate } from '@/utils'
import type { TimeoutException, PageParams, HandleTimeoutRequest, User } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const Timeout: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setTimeoutData] = useState<TimeoutException[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [handled, setHandled] = useState<boolean | undefined>(undefined)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TimeoutException | null>(null)
  const [actionType, setActionType] = useState<'TRANSFER' | 'APPROVE' | 'REJECT'>('TRANSFER')
  const [approvers, setApprovers] = useState<User[]>([])
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: PageParams & { handled?: boolean } = {
        ...pagination,
        ...(handled !== undefined ? { handled } : {})
      }
      const result = await timeout.list(params)
      setTimeoutData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch timeout exceptions failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApprovers = async () => {
    try {
      const result = await user.list({ page: 1, pageSize: 100 })
      setApprovers(result.list)
    } catch (error) {
      console.error('Fetch approvers failed:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, handled])

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleAction = (record: TimeoutException) => {
    setSelectedRecord(record)
    setActionType('TRANSFER')
    form.resetFields()
    fetchApprovers()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    if (!selectedRecord) return
    try {
      const values = await form.validateFields()
      const request: HandleTimeoutRequest = {
        timeoutId: selectedRecord.id,
        action: actionType,
        targetApproverId: actionType === 'TRANSFER' ? values.targetApproverId : undefined,
        comment: values.comment
      }
      await timeout.handle(request)
      message.success('处理成功')
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Handle timeout failed:', error)
    }
  }

  const columns: ColumnsType<TimeoutException> = [
    {
      title: '异常ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span style={{ fontFamily: 'monospace' }}>#{id}</span>
    },
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 150,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '审批节点',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 120
    },
    {
      title: '当前审批人',
      dataIndex: 'approverName',
      key: 'approverName',
      width: 100
    },
    {
      title: '超时时长',
      dataIndex: 'timeoutHours',
      key: 'timeoutHours',
      width: 100,
      render: (hours: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: 4 }} />
          {hours} 小时
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'handled',
      key: 'handled',
      width: 100,
      render: (handled: boolean) => (
        <Tag color={handled ? 'success' : 'warning'}>
          {handled ? '已处理' : '待处理'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDate(date)
    },
    {
      title: '处理人',
      dataIndex: 'handledBy',
      key: 'handledBy',
      width: 100,
      render: (_, record) => record.handledBy || '-'
    },
    {
      title: '处理时间',
      dataIndex: 'handledAt',
      key: 'handledAt',
      width: 160,
      render: (date?: string) => date ? formatDate(date) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        !record.handled && (
          <Button
            type="link"
            size="small"
            onClick={() => handleAction(record)}
          >
            处理
          </Button>
        )
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Radio.Group
          value={handled}
          onChange={e => setHandled(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value={undefined}>全部</Radio.Button>
          <Radio.Button value={false}>待处理</Radio.Button>
          <Radio.Button value={true}>已处理</Radio.Button>
        </Radio.Group>
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>超时异常处理</Title>
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
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Modal
        title="处理超时异常"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <p>申请编号：<span style={{ fontFamily: 'monospace' }}>{selectedRecord?.applicationNo}</span></p>
        <p>当前节点：{selectedRecord?.nodeName}</p>
        <p>当前审批人：{selectedRecord?.approverName}</p>
        <p>超时时长：<span style={{ color: '#ff4d4f' }}>{selectedRecord?.timeoutHours} 小时</span></p>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="actionType"
            label="处理方式"
            initialValue={actionType}
            rules={[{ required: true, message: '请选择处理方式' }]}
          >
            <Radio.Group
              value={actionType}
              onChange={e => setActionType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="TRANSFER">
                <UserSwitchOutlined /> 转交他人
              </Radio.Button>
              <Radio.Button value="APPROVE">
                <CheckOutlined /> 直接通过
              </Radio.Button>
              <Radio.Button value="REJECT">
                <CloseOutlined /> 拒绝申请
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          {actionType === 'TRANSFER' && (
            <Form.Item
              name="targetApproverId"
              label="转交审批人"
              rules={[{ required: true, message: '请选择转交审批人' }]}
            >
              <Select placeholder="请选择审批人">
                {approvers.map(u => (
                  <Option key={u.id} value={u.id}>
                    {u.realName || u.username} ({u.department})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="comment"
            label="处理意见"
            rules={[{ required: true, message: '请输入处理意见' }]}
          >
            <TextArea rows={3} placeholder="请输入处理意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Timeout
