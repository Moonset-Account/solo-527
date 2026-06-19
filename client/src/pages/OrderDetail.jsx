import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Tabs, Table, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons'
import { getOrder, updateOrder, confirmPhotoSelection, markFinalDelivery } from '../services/api'
import {
  getSchedules, createSchedule, updateSchedule, deleteSchedule,
  getDeliveryNodes, createDeliveryNode, updateDeliveryNode, deleteDeliveryNode,
  getPayments, createPayment, updatePayment, deletePayment,
  getWorkAuthorizations, createWorkAuthorization, updateWorkAuthorization, deleteWorkAuthorization,
  updateSelectedPhoto,
  downloadFinalPhoto
} from '../services/api'
import dayjs from 'dayjs'

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('schedules')

  const [schedules, setSchedules] = useState([])
  const [deliveryNodes, setDeliveryNodes] = useState([])
  const [payments, setPayments] = useState([])
  const [workAuths, setWorkAuths] = useState([])
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [finalPhotos, setFinalPhotos] = useState([])

  const [scheduleModal, setScheduleModal] = useState(false)
  const [nodeModal, setNodeModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [authModal, setAuthModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  const [scheduleForm] = Form.useForm()
  const [nodeForm] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [authForm] = Form.useForm()

  useEffect(() => {
    loadOrderDetail()
  }, [id])

  const loadOrderDetail = async () => {
    setLoading(true)
    try {
      const data = await getOrder(id)
      setOrder(data)
      setSchedules(data.schedules || [])
      setDeliveryNodes(data.deliveryNodes || [])
      setPayments(data.payments || [])
      setWorkAuths(data.workAuthorizations || [])
      setSelectedPhotos(data.selectedPhotos || [])
      setFinalPhotos(data.finalPhotos || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    PENDING: 'default',
    IN_PROGRESS: 'processing',
    DELIVERED: 'blue',
    COMPLETED: 'success',
    CANCELLED: 'error'
  }

  const handleAddSchedule = () => {
    setCurrentRecord(null)
    scheduleForm.resetFields()
    setScheduleModal(true)
  }

  const handleEditSchedule = record => {
    setCurrentRecord(record)
    scheduleForm.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null
    })
    setScheduleModal(true)
  }

  const handleSubmitSchedule = async values => {
    try {
      const data = {
        ...values,
        orderId: Number(id),
        startTime: values.startTime?.toDate(),
        endTime: values.endTime?.toDate()
      }
      if (currentRecord) {
        await updateSchedule(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createSchedule(data)
        message.success('创建成功')
      }
      setScheduleModal(false)
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSchedule = async sid => {
    try {
      await deleteSchedule(sid)
      message.success('删除成功')
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddNode = () => {
    setCurrentRecord(null)
    nodeForm.resetFields()
    setNodeModal(true)
  }

  const handleEditNode = record => {
    setCurrentRecord(record)
    nodeForm.setFieldsValue({
      ...record,
      plannedDate: record.plannedDate ? dayjs(record.plannedDate) : null,
      actualDate: record.actualDate ? dayjs(record.actualDate) : null
    })
    setNodeModal(true)
  }

  const handleSubmitNode = async values => {
    try {
      const data = {
        ...values,
        orderId: Number(id),
        plannedDate: values.plannedDate?.toDate(),
        actualDate: values.actualDate?.toDate()
      }
      if (currentRecord) {
        await updateDeliveryNode(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createDeliveryNode(data)
        message.success('创建成功')
      }
      setNodeModal(false)
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNode = async nid => {
    try {
      await deleteDeliveryNode(nid)
      message.success('删除成功')
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddPayment = () => {
    setCurrentRecord(null)
    paymentForm.resetFields()
    setPaymentModal(true)
  }

  const handleEditPayment = record => {
    setCurrentRecord(record)
    paymentForm.setFieldsValue({
      ...record,
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null
    })
    setPaymentModal(true)
  }

  const handleSubmitPayment = async values => {
    try {
      const data = {
        ...values,
        orderId: Number(id),
        paymentDate: values.paymentDate?.toDate(),
        amount: values.amount ? String(values.amount) : '0'
      }
      if (currentRecord) {
        await updatePayment(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createPayment(data)
        message.success('创建成功')
      }
      setPaymentModal(false)
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeletePayment = async pid => {
    try {
      await deletePayment(pid)
      message.success('删除成功')
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddAuth = () => {
    setCurrentRecord(null)
    authForm.resetFields()
    setAuthModal(true)
  }

  const handleEditAuth = record => {
    setCurrentRecord(record)
    authForm.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null
    })
    setAuthModal(true)
  }

  const handleSubmitAuth = async values => {
    try {
      const data = {
        ...values,
        orderId: Number(id),
        startDate: values.startDate?.toDate(),
        endDate: values.endDate?.toDate(),
        fee: values.fee ? String(values.fee) : '0'
      }
      if (currentRecord) {
        await updateWorkAuthorization(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createWorkAuthorization(data)
        message.success('创建成功')
      }
      setAuthModal(false)
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAuth = async aid => {
    try {
      await deleteWorkAuthorization(aid)
      message.success('删除成功')
      loadOrderDetail()
    } catch (err) {
      console.error(err)
    }
  }

  const handleTogglePhoto = async photo => {
    if (order?.clientConfirm) return
    const newSelected = !photo.isSelected
    setSelectedPhotos(prev =>
      prev.map(p => p.id === photo.id ? { ...p, isSelected: newSelected } : p)
    )
    try {
      await updateSelectedPhoto(photo.id, { isSelected: newSelected })
    } catch (err) {
      console.error(err)
      message.error('更新失败')
      setSelectedPhotos(prev =>
        prev.map(p => p.id === photo.id ? { ...p, isSelected: !newSelected } : p)
      )
    }
  }

  const handleConfirmSelection = async () => {
    const selectedIds = selectedPhotos.filter(p => p.isSelected).map(p => p.id)
    if (selectedIds.length === 0) {
      message.warning('请至少选择一张照片')
      return
    }
    Modal.confirm({
      title: '确认选片',
      content: `已选择 ${selectedIds.length} 张照片，确认提交后将通知摄影师修片。`,
      onOk: async () => {
        try {
          await confirmPhotoSelection(id, { photoIds: selectedIds })
          message.success('选片确认成功')
          loadOrderDetail()
        } catch (err) {
          console.error(err)
          message.error('选片确认失败')
        }
      }
    })
  }

  const handleMarkFinalDelivery = async () => {
    Modal.confirm({
      title: '标记成片交付',
      content: '确认所有成片已交付给客户？',
      onOk: async () => {
        try {
          await markFinalDelivery(id)
          message.success('标记成片交付成功')
          loadOrderDetail()
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const handleDownloadPhoto = async photo => {
    try {
      await downloadFinalPhoto(photo.id)
      const link = document.createElement('a')
      link.href = photo.photoUrl
      link.download = photo.photoName
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success(`开始下载：${photo.photoName}`)
      loadOrderDetail()
    } catch (err) {
      console.error(err)
      message.error('下载失败')
    }
  }

  const scheduleColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: t => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', render: t => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSchedule(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteSchedule(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const nodeColumns = [
    { title: '节点名称', dataIndex: 'nodeName', key: 'nodeName' },
    { title: '类型', dataIndex: 'nodeType', key: 'nodeType', render: t => <Tag color="blue">{t}</Tag> },
    { title: '计划日期', dataIndex: 'plannedDate', key: 'plannedDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '实际日期', dataIndex: 'actualDate', key: 'actualDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'COMPLETED' ? 'green' : s === 'DELAYED' ? 'red' : 'orange'}>{s}</Tag> },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditNode(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteNode(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const paymentColumns = [
    { title: '回款编号', dataIndex: 'paymentNo', key: 'paymentNo' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '回款日期', dataIndex: 'paymentDate', key: 'paymentDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '方式', dataIndex: 'paymentMethod', key: 'paymentMethod' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'PAID' ? 'green' : 'orange'}>{s}</Tag> },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditPayment(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeletePayment(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const authColumns = [
    { title: '授权类型', dataIndex: 'authType', key: 'authType', render: t => <Tag color="purple">{t}</Tag> },
    { title: '授权范围', dataIndex: 'scope', key: 'scope' },
    { title: '地域', dataIndex: 'territory', key: 'territory' },
    { title: '期限', dataIndex: 'durationMonths', key: 'durationMonths', render: v => v ? `${v}个月` : '-' },
    { title: '授权费', dataIndex: 'fee', key: 'fee', render: v => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'ACTIVE' ? 'green' : 'orange'}>{s}</Tag> },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditAuth(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteAuth(r.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const formatFileSize = bytes => {
    if (!bytes || bytes < 1024) return (bytes || 0) + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const tabItems = [
    {
      key: 'schedules',
      label: '拍摄档期',
      children: (
        <div>
          <div className="table-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchedule}>添加档期</Button>
          </div>
          <Table size="small" dataSource={schedules} columns={scheduleColumns} rowKey="id" pagination={false} />
        </div>
      )
    },
    {
      key: 'deliveryNodes',
      label: '交付节点',
      children: (
        <div>
          <div className="table-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNode}>添加节点</Button>
          </div>
          <Table size="small" dataSource={deliveryNodes} columns={nodeColumns} rowKey="id" pagination={false} />
        </div>
      )
    },
    {
      key: 'payments',
      label: '回款记录',
      children: (
        <div>
          <div className="table-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPayment}>添加回款</Button>
          </div>
          <Table size="small" dataSource={payments} columns={paymentColumns} rowKey="id" pagination={false} />
        </div>
      )
    },
    {
      key: 'workAuth',
      label: '作品授权',
      children: (
        <div>
          <div className="table-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAuth}>添加授权</Button>
          </div>
          <Table size="small" dataSource={workAuths} columns={authColumns} rowKey="id" pagination={false} />
        </div>
      )
    },
    {
      key: 'selectedPhotos',
      label: '选片确认',
      children: (
        <div>
          <div className="table-toolbar">
            <Space>
              {!order?.clientConfirm && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleConfirmSelection} disabled={!selectedPhotos.some(p => p.isSelected)}>
                  确认选片
                </Button>
              )}
              <Tag color={order?.clientConfirm ? 'green' : 'orange'}>
                {order?.clientConfirm ? '客户已确认' : '待客户确认'}
              </Tag>
            </Space>
          </div>
          {selectedPhotos.length > 0 ? (
            <div className="photo-grid">
              {selectedPhotos.map(photo => (
                <div
                  key={photo.id}
                  className={`photo-item ${photo.isSelected ? 'selected' : ''}`}
                  onClick={() => handleTogglePhoto(photo)}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={photo.photoUrl} alt={photo.photoName} />
                    {photo.isSelected && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#1890ff', color: 'white', borderRadius: '50%',
                        width: 24, height: 24, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 14,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        <CheckOutlined />
                      </div>
                    )}
                  </div>
                  <div className="photo-info">
                    <div>{photo.photoName}</div>
                    <div style={{ color: photo.isSelected ? '#1890ff' : '#999' }}>
                      {photo.isSelected ? '✓ 已选中' : '点击选择'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无选片照片，摄影师上传后将在此显示</p>
          )}
        </div>
      )
    },
    {
      key: 'finalPhotos',
      label: '成片交付',
      children: (
        <div>
          <div className="table-toolbar">
            <Space>
              {!order?.finalDelivery && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleMarkFinalDelivery} disabled={finalPhotos.length === 0}>
                  标记成片交付
                </Button>
              )}
              <Tag color={order?.finalDelivery ? 'green' : 'orange'}>
                {order?.finalDelivery ? '已交付' : '待交付'}
              </Tag>
            </Space>
          </div>
          {finalPhotos.length > 0 ? (
            <div className="photo-grid">
              {finalPhotos.map(photo => (
                <div key={photo.id} className="photo-item" style={{ cursor: 'default' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={photo.photoUrl} alt={photo.photoName} />
                    {photo.isDownloaded && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#52c41a', color: 'white', borderRadius: '50%',
                        width: 24, height: 24, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 14,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        <CheckOutlined />
                      </div>
                    )}
                  </div>
                  <div className="photo-info">
                    <div>{photo.photoName}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{formatFileSize(photo.fileSize)}</div>
                    <Button
                      size="small"
                      type={photo.isDownloaded ? 'default' : 'primary'}
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadPhoto(photo)}
                      block
                      style={{ marginTop: 4 }}
                    >
                      {photo.isDownloaded ? '重新下载' : '下载'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无成片，摄影师修片完成后将在此显示</p>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <h2 style={{ margin: 0 }}>订单详情</h2>
        </Space>
      </div>

      {order && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions title={order.title} bordered column={2}>
              <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="品牌">{order.brand?.name}</Descriptions.Item>
              <Descriptions.Item label="订单类型">
                <Tag color="blue">{order.orderType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor[order.status] || 'default'}>{order.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{order.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="已付金额">¥{order.paidAmount}</Descriptions.Item>
              <Descriptions.Item label="摄影师">{order.photographer || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{order.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{order.remark || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          </Card>
        </>
      )}

      <Modal title={currentRecord ? '编辑档期' : '添加档期'} open={scheduleModal} onCancel={() => setScheduleModal(false)} footer={null} width={500}>
        <Form form={scheduleForm} layout="vertical" onFinish={handleSubmitSchedule}>
          <Form.Item name="title" label="档期标题" rules={[{ required: true }]}>
            <Input placeholder="请输入档期标题" />
          </Form.Item>
          <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input placeholder="请输入拍摄地点" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="SCHEDULED">
            <Select>
              <Select.Option value="SCHEDULED">已排期</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setScheduleModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={currentRecord ? '编辑节点' : '添加节点'} open={nodeModal} onCancel={() => setNodeModal(false)} footer={null} width={500}>
        <Form form={nodeForm} layout="vertical" onFinish={handleSubmitNode}>
          <Form.Item name="nodeName" label="节点名称" rules={[{ required: true }]}>
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item name="nodeType" label="节点类型" initialValue="NORMAL">
            <Select>
              <Select.Option value="NORMAL">普通节点</Select.Option>
              <Select.Option value="MILESTONE">里程碑</Select.Option>
              <Select.Option value="REVIEW">评审节点</Select.Option>
              <Select.Option value="DELIVERY">交付节点</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="plannedDate" label="计划日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actualDate" label="实际日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待开始</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="DELAYED">已延期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setNodeModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={currentRecord ? '编辑回款' : '添加回款'} open={paymentModal} onCancel={() => setPaymentModal(false)} footer={null} width={500}>
        <Form form={paymentForm} layout="vertical" onFinish={handleSubmitPayment}>
          <Form.Item name="amount" label="回款金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="paymentDate" label="回款日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="回款方式">
            <Select>
              <Select.Option value="BANK_TRANSFER">银行转账</Select.Option>
              <Select.Option value="WECHAT">微信支付</Select.Option>
              <Select.Option value="ALIPAY">支付宝</Select.Option>
              <Select.Option value="CASH">现金</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待回款</Select.Option>
              <Select.Option value="PAID">已回款</Select.Option>
              <Select.Option value="OVERDUE">逾期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setPaymentModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={currentRecord ? '编辑授权' : '添加授权'} open={authModal} onCancel={() => setAuthModal(false)} footer={null} width={500}>
        <Form form={authForm} layout="vertical" onFinish={handleSubmitAuth}>
          <Form.Item name="authType" label="授权类型" initialValue="COMMERCIAL">
            <Select>
              <Select.Option value="COMMERCIAL">商业使用</Select.Option>
              <Select.Option value="EDITORIAL">编辑使用</Select.Option>
              <Select.Option value="EXCLUSIVE">独家授权</Select.Option>
              <Select.Option value="NON_EXCLUSIVE">非独家授权</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="scope" label="授权范围">
            <Input placeholder="如：线上广告、线下海报等" />
          </Form.Item>
          <Form.Item name="territory" label="授权地域">
            <Input placeholder="如：中国大陆、全球等" />
          </Form.Item>
          <Form.Item name="durationMonths" label="授权期限(月)">
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item label="授权有效期">
            <Space>
              <Form.Item name="startDate" noStyle>
                <DatePicker placeholder="开始日期" />
              </Form.Item>
              <span>至</span>
              <Form.Item name="endDate" noStyle>
                <DatePicker placeholder="结束日期" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="fee" label="授权费">
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待授权</Select.Option>
              <Select.Option value="ACTIVE">生效中</Select.Option>
              <Select.Option value="EXPIRED">已过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setAuthModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderDetail
