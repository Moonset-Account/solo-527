import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Tabs, Modal, Form, Input, message, Card, Statistic, Row, Col } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { approvalApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function ApprovalList() {
  const [pending, setPending] = useState([])
  const [submitted, setSubmitted] = useState([])
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        approvalApi.requests.myPending(),
        approvalApi.requests.mySubmitted(),
        approvalApi.requests.list({ ordering: '-created_at' })
      ])
      setPending(pRes.data || [])
      setSubmitted(sRes.data.results || sRes.data || [])
      setAll(aRes.data.results || aRes.data || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'processing', label: '待审批' },
      in_progress: { color: 'processing', label: '审批中' },
      approved: { color: 'green', label: '已通过' },
      rejected: { color: 'red', label: '已驳回' },
      cancelled: { color: 'default', label: '已取消' }
    }
    const s = map[status] || { color: 'default', label: status }
    return <Tag color={s.color}>{s.label}</Tag>
  }

  const getFlowTypeTag = (type) => {
    const map = {
      contract: '合同审批',
      invoice: '发票审批',
      supplier: '供应商准入',
      price_adjustment: '价格调整',
      risk_handle: '风险处理'
    }
    return <Tag color="blue">{map[type] || type}</Tag>
  }

  const handleApprove = async (values) => {
    try {
      await approvalApi.requests.approve(currentItem.id, values)
      message.success('审批通过')
      setDetailModal(false)
      loadData()
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const handleReject = async (values) => {
    try {
      await approvalApi.requests.reject(currentItem.id, values)
      message.success('已驳回')
      setDetailModal(false)
      loadData()
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const columns = (showActions = false) => [
    { title: '审批类型', dataIndex: 'flow_type', key: 'flow_type', render: getFlowTypeTag },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '申请人', dataIndex: 'requester_name', key: 'requester_name' },
    { title: '当前层级', dataIndex: 'current_level_info', key: 'current_level_info',
      render: v => v?.level_name || '-'
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    showActions && {
      title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => { setCurrentItem(r); form.resetFields(); setDetailModal(true) }}>查看</Button>
          {r.status === 'pending' || r.status === 'in_progress' ? (
            <>
              <Button type="link" icon={<CheckCircleOutlined />} onClick={() => { setCurrentItem(r); form.resetFields(); setDetailModal(true) }}>审批</Button>
            </>
          ) : null}
        </Space>
      )
    }
  ].filter(Boolean)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">审批中心</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待我审批" value={pending.length} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="我提交的" value={submitted.length} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'pending',
            label: `待我审批 (${pending.length})`,
            children: (
              <Table
                loading={loading}
                rowKey="id"
                columns={columns(true)}
                dataSource={pending}
                pagination={{ pageSize: 20, showTotal: t => `共 ${t} 条` }}
              />
            )
          },
          {
            key: 'submitted',
            label: '我提交的',
            children: (
              <Table
                loading={loading}
                rowKey="id"
                columns={columns()}
                dataSource={submitted}
                pagination={{ pageSize: 20, showTotal: t => `共 ${t} 条` }}
              />
            )
          },
          {
            key: 'all',
            label: '全部审批',
            children: (
              <Table
                loading={loading}
                rowKey="id"
                columns={columns(true)}
                dataSource={all}
                pagination={{ pageSize: 20, showTotal: t => `共 ${t} 条` }}
              />
            )
          }
        ]}
      />

      <Modal
        title="审批详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {currentItem && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={24}>
                <Col span={8}><strong>类型:</strong> {getFlowTypeTag(currentItem.flow_type)}</Col>
                <Col span={16}><strong>标题:</strong> {currentItem.title}</Col>
                <Col span={8}><strong>申请人:</strong> {currentItem.requester_name}</Col>
                <Col span={8}><strong>状态:</strong> {getStatusTag(currentItem.status)}</Col>
                <Col span={8}><strong>申请时间:</strong> {dayjs(currentItem.created_at).format('YYYY-MM-DD HH:mm')}</Col>
              </Row>
              {currentItem.remarks && <div style={{ marginTop: 8 }}><strong>申请说明:</strong> {currentItem.remarks}</div>}
              {currentItem.current_level_info && (
                <div style={{ marginTop: 8 }}>
                  <strong>当前审批层级:</strong> {currentItem.current_level_info.level_name}
                  <span style={{ marginLeft: 16 }}>
                    <strong>可审批人:</strong> {currentItem.current_level_info.approvers?.map(a => a.name).join(', ')}
                  </span>
                </div>
              )}
            </Card>

            <h4 style={{ marginBottom: 8 }}>审批记录</h4>
            <Table
              size="small"
              rowKey="id"
              dataSource={currentItem.records || []}
              columns={[
                { title: '审批层级', dataIndex: 'level_name', key: 'level_name' },
                { title: '审批人', dataIndex: 'approver_name', key: 'approver_name' },
                { title: '动作', dataIndex: 'action_display', key: 'action',
                  render: v => <Tag color={v === '同意' ? 'green' : v === '驳回' ? 'red' : 'blue'}>{v}</Tag>
                },
                { title: '审批意见', dataIndex: 'comment', key: 'comment', render: v => v || '-' },
                { title: '审批时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm') }
              ]}
              pagination={false}
            />

            {(currentItem.status === 'pending' || currentItem.status === 'in_progress') && (
              <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <Form.Item label="审批意见" name="comment">
                  <Input.TextArea rows={3} placeholder="请输入审批意见" />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={async () => {
                      const values = await form.validateFields()
                      handleApprove(values)
                    }}>同意</Button>
                    <Button danger icon={<CloseCircleOutlined />} onClick={async () => {
                      const values = await form.validateFields()
                      handleReject(values)
                    }}>驳回</Button>
                    <Button onClick={() => setDetailModal(false)}>取消</Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ApprovalList
