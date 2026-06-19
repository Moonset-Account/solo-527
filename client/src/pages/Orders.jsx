import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Row, Col, Tag, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getOrders, createOrder, updateOrder, deleteOrder, getBrands } from '../services/api'
import dayjs from 'dayjs'

function Orders() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [brands, setBrands] = useState([])
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadData()
    loadBrands()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const res = await getOrders({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...values
      })
      setList(res.list)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const res = await getBrands({ pageSize: 100 })
      setBrands(res.list)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleReset = () => {
    filterForm.resetFields()
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleAdd = () => {
    setCurrentRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = record => {
    setCurrentRecord(record)
    form.setFieldsValue({
      ...record,
      brandId: record.brandId
    })
    setModalVisible(true)
  }

  const handleDetail = record => {
    navigate(`/orders/${record.id}`)
  }

  const handleDelete = async id => {
    try {
      await deleteOrder(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async values => {
    try {
      const data = { ...values }
      if (data.totalAmount) data.totalAmount = String(data.totalAmount)
      if (currentRecord) {
        await updateOrder(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createOrder(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const statusColor = {
    PENDING: 'default',
    IN_PROGRESS: 'processing',
    DELIVERED: 'blue',
    COMPLETED: 'success',
    CANCELLED: 'error'
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '订单标题', dataIndex: 'title', key: 'title' },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand' },
    {
      title: '类型',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 100,
      render: t => <Tag color="blue">{t}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: s => <Tag color={statusColor[s] || 'default'}>{s}</Tag>
    },
    { title: '订单金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 100, render: v => `¥${v}` },
    { title: '已付金额', dataIndex: 'paidAmount', key: 'paidAmount', width: 100, render: v => `¥${v}` },
    { title: '选片确认', dataIndex: 'clientConfirm', key: 'clientConfirm', width: 100, render: v => v ? <Tag color="green">已确认</Tag> : <Tag>未确认</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: t => dayjs(t).format('MM-DD') },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>订单管理</h2>
      </div>

      <div className="filter-bar">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="订单号/标题" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="brandId" label="品牌">
            <Select placeholder="请选择" style={{ width: 150 }} allowClear>
              {brands.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value="PENDING">待处理</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="DELIVERED">已交付</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增订单</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{
          ...pagination,
          total,
          showTotal: t => `共 ${t} 条`,
          showSizeChanger: true
        }}
        onChange={pag => setPagination({ current: pag.current, pageSize: pag.pageSize })}
      />

      <Modal
        title={currentRecord ? '编辑订单' : '新增订单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brandId" label="品牌" rules={[{ required: true, message: '请选择品牌' }]}>
                <Select placeholder="请选择品牌">
                  {brands.map(b => (
                    <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="orderType" label="订单类型" initialValue="PHOTOSHOOT">
                <Select>
                  <Select.Option value="PHOTOSHOOT">商业拍摄</Select.Option>
                  <Select.Option value="PORTRAIT">人像写真</Select.Option>
                  <Select.Option value="PRODUCT">产品摄影</Select.Option>
                  <Select.Option value="EVENT">活动跟拍</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="订单标题" rules={[{ required: true, message: '请输入订单标题' }]}>
            <Input placeholder="请输入订单标题" />
          </Form.Item>
          <Form.Item name="description" label="订单描述">
            <Input.TextArea rows={3} placeholder="请输入订单描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalAmount" label="订单金额">
                <InputNumber style={{ width: '100%' }} placeholder="请输入金额" min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="PENDING">
                <Select>
                  <Select.Option value="PENDING">待处理</Select.Option>
                  <Select.Option value="IN_PROGRESS">进行中</Select.Option>
                  <Select.Option value="DELIVERED">已交付</Select.Option>
                  <Select.Option value="COMPLETED">已完成</Select.Option>
                  <Select.Option value="CANCELLED">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="photographer" label="摄影师">
            <Input placeholder="请输入摄影师姓名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Orders
