import React, { useState, useEffect } from 'react'
import {
  Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, Drawer,
  Descriptions, DatePicker, Rate, Row, Col
} from 'antd'
import {
  SearchOutlined, EyeOutlined, UserOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StarOutlined
} from '@ant-design/icons'
import {
  getWorkOrders, getWorkOrderDetail, assignWorkOrder, startWorkOrder,
  completeWorkOrder, createVisitRecord, getVisitRecord, getReview,
  getWorkOrderStats
} from '../api'
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

export default function WorkOrderList() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [stats, setStats] = useState({ pendingCount: 0, processingCount: 0, completedCount: 0 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [visitRecord, setVisitRecord] = useState(null)
  const [reviewRecord, setReviewRecord] = useState(null)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [visitModalVisible, setVisitModalVisible] = useState(false)
  const [assignForm] = Form.useForm()
  const [visitForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  useEffect(() => {
    loadData()
    loadStats()
  }, [pagination.current, pagination.pageSize, filters])

  const loadStats = async () => {
    try {
      const data = await getWorkOrderStats()
      setStats(data || { pendingCount: 0, processingCount: 0, completedCount: 0 })
    } catch (e) { }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getWorkOrders({
        ...filters,
        current: pagination.current,
        size: pagination.pageSize
      })
      setList(data.records || [])
      setPagination(p => ({ ...p, total: data.total || 0 }))
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params = {}
    if (values.status) params.status = values.status
    if (values.priority) params.priority = values.priority
    if (values.category) params.category = values.category
    if (values.buildingNo) params.buildingNo = values.buildingNo
    setFilters(params)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleViewDetail = async (order) => {
    try {
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

  const handleAssign = (order) => {
    setCurrentOrder(order)
    assignForm.resetFields()
    setAssignModalVisible(true)
  }

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields()
      await assignWorkOrder(currentOrder.id, values.staffId)
      message.success('派工成功')
      setAssignModalVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '派工失败')
    }
  }

  const handleStart = async (id) => {
    try {
      await startWorkOrder(id)
      message.success('已开始处理')
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    }
  }

  const handleComplete = async (id) => {
    try {
      await completeWorkOrder(id)
      message.success('工单已完成')
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    }
  }

  const handleCreateVisit = () => {
    visitForm.resetFields()
    setVisitModalVisible(true)
  }

  const handleVisitSubmit = async () => {
    try {
      const values = await visitForm.validateFields()
      await createVisitRecord({
        workOrderId: currentOrder.id,
        visitedBy: 1,
        ...values,
        residentSatisfied: values.residentSatisfied ? 1 : 0,
        needFollowUp: values.needFollowUp ? 1 : 0
      })
      message.success('回访记录已保存')
      setVisitModalVisible(false)
      setDetailVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '保存失败')
    }
  }

  const columns = [
    { title: '工单编号', dataIndex: 'orderNo', width: 150, fixed: 'left' },
    { title: '标题', dataIndex: 'title', width: 180 },
    { title: '分类', dataIndex: 'category', width: 100 },
    {
      title: '优先级', dataIndex: 'priority', width: 80,
      render: v => priorityMap[v] ? <Tag color={priorityMap[v].color}>{priorityMap[v].text}</Tag> : v
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    { title: '位置', dataIndex: 'buildingNo', width: 120, render: (_, r) => `${r.buildingNo} ${r.roomNo}` },
    { title: '联系人', dataIndex: 'contactName', width: 100 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 120 },
    {
      title: '指派人员', dataIndex: 'assignedTo', width: 100,
      render: v => v ? `工程师#${v}` : '-'
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 150, render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === 'PENDING' && (
            <Button size="small" type="primary" onClick={() => handleAssign(r)}>派工</Button>
          )}
          {r.status === 'ASSIGNED' && (
            <Button size="small" icon={<ClockCircleOutlined />} onClick={() => handleStart(r.id)}>开始处理</Button>
          )}
          {r.status === 'PROCESSING' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleComplete(r.id)}>完成</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">工单管理</h2>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={8} sm={8} md={8}>
            <div className="stat-card" style={{ background: '#fff7e6', borderRadius: 8 }}>
              <div className="stat-value" style={{ color: '#faad14' }}>{stats.pendingCount}</div>
              <div className="stat-label">待处理工单</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={8}>
            <div className="stat-card" style={{ background: '#e6f7ff', borderRadius: 8 }}>
              <div className="stat-value" style={{ color: '#1890ff' }}>{stats.processingCount}</div>
              <div className="stat-label">处理中工单</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={8}>
            <div className="stat-card" style={{ background: '#f6ffed', borderRadius: 8 }}>
              <div className="stat-value" style={{ color: '#52c41a' }}>{stats.completedCount}</div>
              <div className="stat-label">已完成工单</div>
            </div>
          </Col>
        </Row>

        <Form form={searchForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 130 }} options={[
              { value: 'PENDING', label: '待处理' },
              { value: 'ASSIGNED', label: '已派工' },
              { value: 'PROCESSING', label: '处理中' },
              { value: 'COMPLETED', label: '已完成' },
              { value: 'CLOSED', label: '已关闭' }
            ]} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[
              { value: 'LOW', label: '低' },
              { value: 'MEDIUM', label: '中' },
              { value: 'HIGH', label: '高' },
              { value: 'URGENT', label: '紧急' }
            ]} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
              { value: '水电维修', label: '水电维修' },
              { value: '家电维修', label: '家电维修' },
              { value: '门窗维修', label: '门窗维修' },
              { value: '墙面地面', label: '墙面地面' },
              { value: '其他', label: '其他' }
            ]} />
          </Form.Item>
          <Form.Item name="buildingNo" label="楼栋">
            <Input placeholder="楼栋号" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Drawer
          title="工单详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={600}
          extra={
            currentOrder?.status === 'COMPLETED' && !visitRecord && (
              <Button type="primary" onClick={handleCreateVisit}>录入回访</Button>
            )
          }
        >
          {currentOrder && (
            <div>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="工单编号">{currentOrder.orderNo}</Descriptions.Item>
                <Descriptions.Item label="标题">{currentOrder.title}</Descriptions.Item>
                <Descriptions.Item label="分类">{currentOrder.category}</Descriptions.Item>
                <Descriptions.Item label="优先级">{priorityMap[currentOrder.priority]?.text}</Descriptions.Item>
                <Descriptions.Item label="状态">{statusMap[currentOrder.status]?.text}</Descriptions.Item>
                <Descriptions.Item label="位置">{currentOrder.buildingNo} {currentOrder.roomNo}</Descriptions.Item>
                <Descriptions.Item label="联系人">{currentOrder.contactName} - {currentOrder.contactPhone}</Descriptions.Item>
                <Descriptions.Item label="指派人员">{currentOrder.assignedTo ? `工程师#${currentOrder.assignedTo}` : '未指派'}</Descriptions.Item>
                <Descriptions.Item label="派工时间">{currentOrder.assignedAt ? dayjs(currentOrder.assignedAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                <Descriptions.Item label="完成时间">{currentOrder.completedAt ? dayjs(currentOrder.completedAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{dayjs(currentOrder.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="问题描述">{currentOrder.description}</Descriptions.Item>
                {currentOrder.remark && <Descriptions.Item label="备注">{currentOrder.remark}</Descriptions.Item>}
              </Descriptions>

              {visitRecord && (
                <>
                  <h3 style={{ marginTop: 24 }}>回访记录</h3>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="回访时间">{dayjs(visitRecord.visitedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                    <Descriptions.Item label="回访结果">{visitRecord.visitResult}</Descriptions.Item>
                    <Descriptions.Item label="住户是否满意">{visitRecord.residentSatisfied === 1 ? '是' : '否'}</Descriptions.Item>
                    <Descriptions.Item label="是否需要跟进">{visitRecord.needFollowUp === 1 ? '是' : '否'}</Descriptions.Item>
                    {visitRecord.followUpNote && <Descriptions.Item label="跟进备注">{visitRecord.followUpNote}</Descriptions.Item>}
                  </Descriptions>
                </>
              )}

              {reviewRecord && (
                <>
                  <h3 style={{ marginTop: 24 }}>住户评价</h3>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="综合评分"><Rate disabled value={reviewRecord.rating} /></Descriptions.Item>
                    {reviewRecord.speedRating && <Descriptions.Item label="响应速度"><Rate disabled value={reviewRecord.speedRating} /></Descriptions.Item>}
                    {reviewRecord.attitudeRating && <Descriptions.Item label="服务态度"><Rate disabled value={reviewRecord.attitudeRating} /></Descriptions.Item>}
                    {reviewRecord.qualityRating && <Descriptions.Item label="维修质量"><Rate disabled value={reviewRecord.qualityRating} /></Descriptions.Item>}
                    {reviewRecord.content && <Descriptions.Item label="评价内容">{reviewRecord.content}</Descriptions.Item>}
                  </Descriptions>
                </>
              )}
            </div>
          )}
        </Drawer>

        <Modal
          title="工单派工"
          open={assignModalVisible}
          onCancel={() => setAssignModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          {currentOrder && (
            <p style={{ marginBottom: 16 }}>工单：{currentOrder.orderNo} - {currentOrder.title}</p>
          )}
          <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
            <Form.Item label="指派工程师" name="staffId" rules={[{ required: true, message: '请选择工程师' }]}>
              <Select options={[
                { value: 2, label: '张工 (S002)' },
                { value: 3, label: '李工 (S003)' }
              ]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>确认派工</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="录入回访记录"
          open={visitModalVisible}
          onCancel={() => setVisitModalVisible(false)}
          footer={null}
          destroyOnClose
          width={500}
        >
          <Form form={visitForm} layout="vertical" onFinish={handleVisitSubmit}>
            <Form.Item label="回访结果" name="visitResult" rules={[{ required: true, message: '请输入回访结果' }]}>
              <Input.TextArea rows={4} placeholder="请描述回访情况" />
            </Form.Item>
            <Form.Item label="住户是否满意" name="residentSatisfied" valuePropName="checked">
              <Select options={[
                { value: true, label: '满意' },
                { value: false, label: '不满意' }
              ]} />
            </Form.Item>
            <Form.Item label="是否需要跟进" name="needFollowUp" valuePropName="checked">
              <Select options={[
                { value: false, label: '不需要' },
                { value: true, label: '需要' }
              ]} />
            </Form.Item>
            <Form.Item label="跟进备注" name="followUpNote">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>保存回访记录</Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  )
}
