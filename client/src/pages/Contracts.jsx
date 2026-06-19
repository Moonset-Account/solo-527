import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { getContracts, createContract, updateContract, deleteContract, getBrands, getOrders } from '../services/api'
import dayjs from 'dayjs'

function Contracts() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [brands, setBrands] = useState([])
  const [orders, setOrders] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadBrands()
    loadOrders()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getContracts({ page: pagination.current, pageSize: pagination.pageSize })
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
      signDate: record.signDate ? dayjs(record.signDate) : null,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      amount: Number(record.amount)
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deleteContract(id)
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
        signDate: values.signDate?.toDate(),
        startDate: values.startDate?.toDate(),
        endDate: values.endDate?.toDate(),
        amount: String(values.amount || 0)
      }
      if (currentRecord) {
        await updateContract(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createContract(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
    { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo', width: 140 },
    { title: '合同标题', dataIndex: 'title', key: 'title' },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand' },
    { title: '关联订单', dataIndex: ['order', 'orderNo'], key: 'order', render: v => v || '-' },
    { title: '合同类型', dataIndex: 'contractType', key: 'contractType', render: t => <Tag color="purple">{t}</Tag> },
    { title: '合同金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '签订日期', dataIndex: 'signDate', key: 'signDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { DRAFT: 'default', PENDING: 'processing', SIGNED: 'green', EXPIRED: 'orange', TERMINATED: 'red' }
        return <Tag color={colors[s]}>{s}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, r) => (
        <Space>
          {r.attachmentUrl && <Button type="link" size="small" onClick={() => window.open(r.attachmentUrl)}>查看附件</Button>}
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
        <h2>合同管理</h2>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增合同</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showTotal: t => `共 ${t} 条`
        }}
        onChange={pag => setPagination({ current: pag.current, pageSize: pag.pageSize })}
      />

      <Modal title={currentRecord ? '编辑合同' : '新增合同'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="brandId" label="品牌" rules={[{ required: true }]}>
            <Select placeholder="请选择品牌">
              {brands.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="orderId" label="关联订单">
            <Select placeholder="请选择订单" allowClear>
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="合同标题" rules={[{ required: true }]}>
            <Input placeholder="请输入合同标题" />
          </Form.Item>
          <Form.Item name="contractType" label="合同类型" initialValue="SERVICE">
            <Select>
              <Select.Option value="SERVICE">服务合同</Select.Option>
              <Select.Option value="COOPERATION">合作合同</Select.Option>
              <Select.Option value="SPONSORSHIP">赞助合同</Select.Option>
              <Select.Option value="LICENSE">授权合同</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="合同金额">
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="signDate" label="签订日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="合同期限">
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
          <Form.Item name="status" label="状态" initialValue="DRAFT">
            <Select>
              <Select.Option value="DRAFT">草稿</Select.Option>
              <Select.Option value="PENDING">待签署</Select.Option>
              <Select.Option value="SIGNED">已签署</Select.Option>
              <Select.Option value="EXPIRED">已到期</Select.Option>
              <Select.Option value="TERMINATED">已终止</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="attachmentUrl" label="合同附件">
            <Input placeholder="请输入附件链接" addonAfter={<UploadOutlined />} />
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

export default Contracts
