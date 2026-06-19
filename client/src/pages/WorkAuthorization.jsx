import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getWorkAuthorizations, createWorkAuthorization, updateWorkAuthorization, deleteWorkAuthorization, getOrders } from '../services/api'
import dayjs from 'dayjs'

function WorkAuthorization() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [orders, setOrders] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadOrders()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getWorkAuthorizations()
      setList(res.list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await getOrders({ pageSize: 100 })
      setOrders(res.list)
    } catch (err) {
      console.error(err)
    }
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
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      fee: Number(record.fee)
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deleteWorkAuthorization(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async values => {
    try {
      const data = {
        ...values,
        startDate: values.startDate?.toDate(),
        endDate: values.endDate?.toDate(),
        fee: String(values.fee || 0)
      }
      if (currentRecord) {
        await updateWorkAuthorization(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createWorkAuthorization(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '授权类型', dataIndex: 'authType', key: 'authType', render: t => <Tag color="purple">{t}</Tag> },
    { title: '关联订单', dataIndex: ['order', 'title'], key: 'order', render: (v, r) => r.order?.orderNo + ' - ' + v },
    { title: '品牌', dataIndex: ['order', 'brand', 'name'], key: 'brand', render: v => v || '-' },
    { title: '授权范围', dataIndex: 'scope', key: 'scope' },
    { title: '地域', dataIndex: 'territory', key: 'territory' },
    { title: '期限', dataIndex: 'durationMonths', key: 'durationMonths', render: v => v ? `${v}个月` : '-' },
    { title: '授权费', dataIndex: 'fee', key: 'fee', render: v => `¥${v}` },
    {
      title: '有效期',
      dataIndex: 'startDate',
      key: 'validPeriod',
      render: (v, r) => v ? `${dayjs(v).format('YYYY-MM-DD')} ~ ${dayjs(r.endDate).format('YYYY-MM-DD')}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { PENDING: 'orange', ACTIVE: 'green', EXPIRED: 'red', REVOKED: 'default' }
        return <Tag color={colors[s]}>{s}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>作品授权</h2>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增授权</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title={currentRecord ? '编辑授权' : '新增授权'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={550}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orderId" label="关联订单" rules={[{ required: true }]}>
            <Select placeholder="请选择订单">
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
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
              <Select.Option value="REVOKED">已撤销</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
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

export default WorkAuthorization
