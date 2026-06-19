import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getSponsorships, createSponsorship, updateSponsorship, deleteSponsorship, getBrands } from '../services/api'
import dayjs from 'dayjs'

function Sponsorships() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [brands, setBrands] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadBrands()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getSponsorships({ page: pagination.current, pageSize: pagination.pageSize })
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
      amount: Number(record.amount)
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deleteSponsorship(id)
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
        amount: String(values.amount || 0)
      }
      if (currentRecord) {
        await updateSponsorship(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createSponsorship(data)
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
    { title: '赞助标题', dataIndex: 'title', key: 'title' },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand' },
    {
      title: '赞助类型',
      dataIndex: 'sponsorshipType',
      key: 'sponsorshipType',
      render: t => <Tag color="orange">{t}</Tag>
    },
    { title: '赞助金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { PENDING: 'orange', ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'default' }
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
        <h2>赞助权益</h2>
        <p style={{ color: '#666', marginTop: 8 }}>管理品牌赞助合作，维护赞助权益和交付物</p>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增赞助</Button>
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

      <Modal title={currentRecord ? '编辑赞助' : '新增赞助'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="brandId" label="品牌" rules={[{ required: true }]}>
            <Select placeholder="请选择品牌">
              {brands.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="赞助标题" rules={[{ required: true }]}>
            <Input placeholder="请输入赞助标题" />
          </Form.Item>
          <Form.Item name="sponsorshipType" label="赞助类型" initialValue="EVENT">
            <Select>
              <Select.Option value="EVENT">活动赞助</Select.Option>
              <Select.Option value="PRODUCT">产品赞助</Select.Option>
              <Select.Option value="BRAND">品牌合作</Select.Option>
              <Select.Option value="CHARITY">公益赞助</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="赞助金额">
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item label="赞助周期">
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
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待确认</Select.Option>
              <Select.Option value="ACTIVE">进行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="EXPIRED">已过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="benefits" label="赞助权益">
            <Input.TextArea rows={3} placeholder="请输入赞助权益内容" />
          </Form.Item>
          <Form.Item name="deliverables" label="交付物">
            <Input.TextArea rows={3} placeholder="请输入需要交付的内容" />
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

export default Sponsorships
