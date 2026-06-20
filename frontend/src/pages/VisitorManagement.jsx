import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, DatePicker, Drawer, Descriptions } from 'antd'
import { SearchOutlined, DownloadOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, LoginOutlined, LogoutOutlined, EyeOutlined } from '@ant-design/icons'
import { queryVisitors, createVisitorAppointment, approveVisitor, visitorCheckIn, visitorCheckOut, exportVisitors } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'default', text: '待审批' },
  APPROVED: { color: 'green', text: '已批准' },
  REJECTED: { color: 'red', text: '已拒绝' },
  CHECKED_IN: { color: 'blue', text: '已到访' },
  CHECKED_OUT: { color: 'geekblue', text: '已离开' },
  EXPIRED: { color: 'gray', text: '已过期' }
}

export default function VisitorManagement() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await queryVisitors({
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
    if (values.visitorName) params.visitorName = values.visitorName
    if (values.visitorPhone) params.visitorPhone = values.visitorPhone
    if (values.buildingNo) params.buildingNo = values.buildingNo
    if (values.status) params.status = values.status
    if (values.visitDate) params.visitDate = values.visitDate.format('YYYY-MM-DD')
    setFilters(params)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await createVisitorAppointment({
        ...values,
        residentId: 1,
        visitDate: values.visitDate.format('YYYY-MM-DD'),
        visitTimeStart: values.visitTime[0].format('HH:mm'),
        visitTimeEnd: values.visitTime[1].format('HH:mm')
      })
      message.success('预约成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (item, approved) => {
    try {
      await approveVisitor(item.id, 1, approved)
      message.success(approved ? '已批准' : '已拒绝')
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    }
  }

  const handleCheckIn = async (item) => {
    try {
      await visitorCheckIn(item.id)
      message.success('已登记到访')
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    }
  }

  const handleCheckOut = async (item) => {
    try {
      await visitorCheckOut(item.id)
      message.success('已登记离开')
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    }
  }

  const handleViewDetail = (item) => {
    setCurrentItem(item)
    setDetailVisible(true)
  }

  const columns = [
    { title: '预约编号', dataIndex: 'appointmentNo', width: 150 },
    { title: '访客姓名', dataIndex: 'visitorName', width: 100 },
    { title: '访客电话', dataIndex: 'visitorPhone', width: 120 },
    { title: '来访人数', dataIndex: 'visitorCount', width: 80 },
    { title: '位置', width: 140, render: (_, r) => `${r.buildingNo} ${r.roomNo}` },
    { title: '来访日期', dataIndex: 'visitDate', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '时段', width: 140, render: (_, r) => `${r.visitTimeStart} - ${r.visitTimeEnd}` },
    { title: '事由', dataIndex: 'visitPurpose' },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(r, true)}>批准</Button>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleApprove(r, false)}>拒绝</Button>
            </>
          )}
          {r.status === 'APPROVED' && (
            <Button size="small" type="primary" icon={<LoginOutlined />} onClick={() => handleCheckIn(r)}>登记到访</Button>
          )}
          {r.status === 'CHECKED_IN' && (
            <Button size="small" icon={<LogoutOutlined />} onClick={() => handleCheckOut(r)}>登记离开</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">访客管理</h2>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => exportVisitors(filters)}>导出Excel</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新增预约</Button>
          </Space>
        </div>

        <Form form={searchForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="visitorName" label="访客姓名">
            <Input placeholder="姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="visitorPhone" label="访客电话">
            <Input placeholder="手机号" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="buildingNo" label="楼栋">
            <Input placeholder="楼栋号" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="visitDate" label="来访日期">
            <DatePicker style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
              { value: 'PENDING', label: '待审批' },
              { value: 'APPROVED', label: '已批准' },
              { value: 'REJECTED', label: '已拒绝' },
              { value: 'CHECKED_IN', label: '已到访' },
              { value: 'CHECKED_OUT', label: '已离开' }
            ]} />
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

        <Modal
          title="新增访客预约"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="访客姓名" name="visitorName" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="访客电话" name="visitorPhone" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="楼栋" name="buildingNo" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="房间号" name="roomNo" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="来访人数" name="visitorCount" rules={[{ required: true }]} initialValue={1}>
                  <Input type="number" min={1} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="来访日期" name="visitDate" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="来访时段" name="visitTime" rules={[{ required: true }]}>
                  <DatePicker.RangePicker showTime={{ format: 'HH:mm' }} format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="来访事由" name="visitPurpose">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>提交</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Drawer
          title="访客预约详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={500}
        >
          {currentItem && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="预约编号">{currentItem.appointmentNo}</Descriptions.Item>
              <Descriptions.Item label="访客姓名">{currentItem.visitorName}</Descriptions.Item>
              <Descriptions.Item label="访客电话">{currentItem.visitorPhone}</Descriptions.Item>
              <Descriptions.Item label="来访人数">{currentItem.visitorCount}</Descriptions.Item>
              <Descriptions.Item label="位置">{currentItem.buildingNo} {currentItem.roomNo}</Descriptions.Item>
              <Descriptions.Item label="来访日期">{dayjs(currentItem.visitDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="时段">{currentItem.visitTimeStart} - {currentItem.visitTimeEnd}</Descriptions.Item>
              <Descriptions.Item label="事由">{currentItem.visitPurpose || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{statusMap[currentItem.status]?.text}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentItem.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              {currentItem.approvedAt && <Descriptions.Item label="审批时间">{dayjs(currentItem.approvedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>}
              {currentItem.checkInAt && <Descriptions.Item label="到访时间">{dayjs(currentItem.checkInAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>}
              {currentItem.checkOutAt && <Descriptions.Item label="离开时间">{dayjs(currentItem.checkOutAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>}
            </Descriptions>
          )}
        </Drawer>
      </div>
    </Spin>
  )
}
