import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getBrandQuotes, createBrandQuote, updateBrandQuote, deleteBrandQuote, getBrands } from '../services/api'
import dayjs from 'dayjs'

function BrandQuotes() {
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
      const res = await getBrandQuotes({ page: pagination.current, pageSize: pagination.pageSize })
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
      validFrom: record.validFrom ? dayjs(record.validFrom) : null,
      validTo: record.validTo ? dayjs(record.validTo) : null,
      amount: Number(record.amount)
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deleteBrandQuote(id)
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
        validFrom: values.validFrom?.toDate(),
        validTo: values.validTo?.toDate(),
        amount: String(values.amount || 0)
      }
      if (currentRecord) {
        await updateBrandQuote(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createBrandQuote(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
    { title: '报价编号', dataIndex: 'quoteNo', key: 'quoteNo', width: 140 },
    { title: '报价标题', dataIndex: 'title', key: 'title' },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand' },
    { title: '服务类型', dataIndex: 'serviceType', key: 'serviceType', render: t => <Tag color="blue">{t}</Tag> },
    { title: '报价金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '有效期', dataIndex: 'validFrom', key: 'validPeriod', render: (v, r) => 
      v ? `${dayjs(v).format('YYYY-MM-DD')} 至 ${dayjs(r.validTo).format('YYYY-MM-DD')}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { DRAFT: 'default', PENDING: 'processing', APPROVED: 'green', REJECTED: 'red', EXPIRED: 'orange' }
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
        <h2>品牌报价</h2>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增报价</Button>
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

      <Modal title={currentRecord ? '编辑报价' : '新增报价'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={550}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="brandId" label="品牌" rules={[{ required: true }]}>
            <Select placeholder="请选择品牌">
              {brands.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="报价标题" rules={[{ required: true }]}>
            <Input placeholder="请输入报价标题" />
          </Form.Item>
          <Form.Item name="serviceType" label="服务类型">
            <Select>
              <Select.Option value="PHOTOSHOOT">商业拍摄</Select.Option>
              <Select.Option value="PORTRAIT">人像写真</Select.Option>
              <Select.Option value="PRODUCT">产品摄影</Select.Option>
              <Select.Option value="EVENT">活动跟拍</Select.Option>
              <Select.Option value="VIDEO">视频制作</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="报价金额">
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item label="有效期">
            <Space>
              <Form.Item name="validFrom" noStyle>
                <DatePicker placeholder="开始日期" />
              </Form.Item>
              <span>至</span>
              <Form.Item name="validTo" noStyle>
                <DatePicker placeholder="结束日期" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="DRAFT">
            <Select>
              <Select.Option value="DRAFT">草稿</Select.Option>
              <Select.Option value="PENDING">待审核</Select.Option>
              <Select.Option value="APPROVED">已通过</Select.Option>
              <Select.Option value="REJECTED">已拒绝</Select.Option>
              <Select.Option value="EXPIRED">已过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="请输入报价描述" />
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

export default BrandQuotes
