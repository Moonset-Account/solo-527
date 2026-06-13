import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Modal, Form, Input, message, Space, Tabs } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
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
      width: 200,
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
                scroll={{ x: 1000 }}
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
                scroll={{ x: 1000 }}
              />
            ),
          },
        ]}
      />

      <Modal
        title={actionType === 'approve' ? '审批通过' : '审批驳回'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="comment"
            label={actionType === 'approve' ? '审批意见' : '驳回原因'}
            rules={actionType === 'reject' ? [{ required: true, message: '请输入驳回原因' }] : []}
          >
            <Input.TextArea rows={4} placeholder={actionType === 'approve' ? '请输入审批意见（选填）' : '请输入驳回原因'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ApprovalCenter
