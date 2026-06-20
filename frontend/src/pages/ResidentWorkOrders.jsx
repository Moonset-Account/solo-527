import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Rate, message, Spin, Space, Descriptions, Drawer, TextArea } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { getResidentWorkOrders, createWorkOrder, getWorkOrderDetail, getVisitRecord, getReview, createReview } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'default', text: '待处理' },
  ASSIGNED: { color: 'blue', text: '已派工' },
  PROCESSING: { color: 'processing', text: '处理中' },
  COMPLETED: { color: 'green', text: '已完成' },
  CLOSED: { color: 'geekblue', text: '已关闭' },
  CANCELLED: { color: 'gray', text: '已取消' }
}

const priorityMap = {
  LOW: { color: 'green', text: '低' },
  MEDIUM: { color: 'blue', text: '中' },
  HIGH: { color: 'orange', text: '高' },
  URGENT: { color: 'red', text: '紧急' }
}

export default function ResidentWorkOrders({ residentId }) {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [visitRecord, setVisitRecord] = useState(null)
  const [reviewRecord, setReviewRecord] = useState(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [residentId, pagination.current, pagination.pageSize, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getResidentWorkOrders(residentId, {
        current: pagination.current,
        size: pagination.pageSize,
        status: statusFilter
      })
      setList(data.records || [])
      setPagination(p => ({ ...p, total: data.total || 0 }))
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await createWorkOrder({ residentId, ...values })
      message.success('提交成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error(e.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetail = async (order) => {
    try {
      setCurrentOrder(order)
      const [detail, visit, review] = await Promise.all([
        getWorkOrderDetail(order.id),
        getVisitRecord(order.id).catch(() => null),
        getReview(order.id).catch(() => null)
      ])
      setCurrentOrder(detail)
      setVisitRecord(visit)
      setReviewRecord(review)
      setDetailVisible(true)
    } catch (e) {
      message.error('加载详情失败')
    }
  }

  const handleReview = () => {
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields()
      setSubmitting(true)
      await createReview({
        workOrderId: currentOrder.id,
        residentId,
        ...values
      })
      message.success('评价成功')
      setReviewModalVisible(false)
      setDetailVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '评价失败')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: '工单编号', dataIndex: 'orderNo', width: 160 },
    { title: '标题', dataIndex: 'title' },
    { title: '分类', dataIndex: 'category' },
    {
      title: '优先级', dataIndex: 'priority', width: 80,
      render: v => priorityMap[v] ? <Tag color={priorityMap[v].color}>{priorityMap[v].text}</Tag> : v
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>查看</Button>
          {(r.status === 'COMPLETED') && (
            <Button size="small" type="primary" onClick={() => { handleViewDetail(r); setTimeout(handleReview, 500) }}>评价</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">我的报修</h2>
          <Space>
            <Select
              placeholder="筛选状态"
              style={{ width: 150 }}
              allowClear
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, current: 1 })) }}
              options={[
                { value: 'PENDING', label: '待处理' },
                { value: 'ASSIGNED', label: '已派工' },
                { value: 'PROCESSING', label: '处理中' },
                { value: 'COMPLETED', label: '已完成' }
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              发起报修
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Modal
          title="发起报修"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="报修标题"
              name="title"
              rules={[{ required: true, message: '请输入报修标题' }]}
            >
              <Input placeholder="请简要描述问题" />
            </Form.Item>
            <Form.Item
              label="报修分类"
              name="category"
              rules={[{ required: true, message: '请选择报修分类' }]}
            >
              <Select options={[
                { value: '水电维修', label: '水电维修' },
                { value: '家电维修', label: '家电维修' },
                { value: '门窗维修', label: '门窗维修' },
                { value: '墙面地面', label: '墙面地面' },
                { value: '其他', label: '其他' }
              ]} />
            </Form.Item>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select options={[
                { value: 'LOW', label: '低' },
                { value: 'MEDIUM', label: '中' },
                { value: 'HIGH', label: '高' },
                { value: 'URGENT', label: '紧急' }
              ]} />
            </Form.Item>
            <Form.Item
              label="详细描述"
              name="description"
              rules={[{ required: true, message: '请输入详细描述' }]}
            >
              <Input.TextArea rows={4} placeholder="请详细描述问题情况" />
            </Form.Item>
            <Form.Item
              label="联系人"
              name="contactName"
            >
              <Input placeholder="默认住户本人" />
            </Form.Item>
            <Form.Item
              label="联系电话"
              name="contactPhone"
            >
              <Input placeholder="默认住户电话" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>
                提交报修
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Drawer
          title="工单详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={600}
        >
          {currentOrder && (
            <div>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="工单编号">{currentOrder.orderNo}</Descriptions.Item>
                <Descriptions.Item label="标题">{currentOrder.title}</Descriptions.Item>
                <Descriptions.Item label="分类">{currentOrder.category}</Descriptions.Item>
                <Descriptions.Item label="优先级">{priorityMap[currentOrder.priority]?.text || currentOrder.priority}</Descriptions.Item>
                <Descriptions.Item label="状态">{statusMap[currentOrder.status]?.text || currentOrder.status}</Descriptions.Item>
                <Descriptions.Item label="位置">{currentOrder.buildingNo} {currentOrder.roomNo}</Descriptions.Item>
                <Descriptions.Item label="联系人">{currentOrder.contactName} {currentOrder.contactPhone}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{dayjs(currentOrder.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="详细描述">{currentOrder.description}</Descriptions.Item>
              </Descriptions>

              {visitRecord && (
                <>
                  <h3 style={{ marginTop: 24 }}>回访记录</h3>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="回访时间">{dayjs(visitRecord.visitedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                    <Descriptions.Item label="回访结果">{visitRecord.visitResult}</Descriptions.Item>
                    <Descriptions.Item label="是否满意">{visitRecord.residentSatisfied === 1 ? '是' : '否'}</Descriptions.Item>
                    <Descriptions.Item label="是否需要跟进">{visitRecord.needFollowUp === 1 ? '是' : '否'}</Descriptions.Item>
                    {visitRecord.followUpNote && <Descriptions.Item label="跟进备注">{visitRecord.followUpNote}</Descriptions.Item>}
                  </Descriptions>
                </>
              )}

              {reviewRecord && (
                <>
                  <h3 style={{ marginTop: 24 }}>评价信息</h3>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="综合评分">
                      <Rate disabled value={reviewRecord.rating} />
                    </Descriptions.Item>
                    {reviewRecord.speedRating && <Descriptions.Item label="响应速度"><Rate disabled value={reviewRecord.speedRating} /></Descriptions.Item>}
                    {reviewRecord.attitudeRating && <Descriptions.Item label="服务态度"><Rate disabled value={reviewRecord.attitudeRating} /></Descriptions.Item>}
                    {reviewRecord.qualityRating && <Descriptions.Item label="维修质量"><Rate disabled value={reviewRecord.qualityRating} /></Descriptions.Item>}
                    {reviewRecord.content && <Descriptions.Item label="评价内容">{reviewRecord.content}</Descriptions.Item>}
                  </Descriptions>
                </>
              )}

              {currentOrder.status === 'COMPLETED' && !reviewRecord && (
                <Button type="primary" block style={{ marginTop: 24 }} onClick={handleReview}>
                  去评价
                </Button>
              )}
            </div>
          )}
        </Drawer>

        <Modal
          title="工单评价"
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
            <Form.Item label="综合评分" name="rating" rules={[{ required: true, message: '请评分' }]}>
              <Rate />
            </Form.Item>
            <Form.Item label="响应速度" name="speedRating">
              <Rate />
            </Form.Item>
            <Form.Item label="服务态度" name="attitudeRating">
              <Rate />
            </Form.Item>
            <Form.Item label="维修质量" name="qualityRating">
              <Rate />
            </Form.Item>
            <Form.Item label="评价内容" name="content">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>
                提交评价
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  )
}
