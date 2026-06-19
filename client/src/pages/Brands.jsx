import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Row, Col, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getBrands, createBrand, updateBrand, deleteBrand, getBrand } from '../services/api'
import dayjs from 'dayjs'

function Brands() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const res = await getBrands({
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
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDetail = async record => {
    try {
      const data = await getBrand(record.id)
      setDetailData(data)
      setDetailVisible(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async id => {
    try {
      await deleteBrand(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async values => {
    try {
      if (currentRecord) {
        await updateBrand(currentRecord.id, values)
        message.success('更新成功')
      } else {
        await createBrand(values)
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
    { title: '品牌名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      render: level => (
        <Tag color={level === 'VIP' ? 'gold' : level === 'NORMAL' ? 'blue' : 'default'}>
          {level}
        </Tag>
      )
    },
    { title: '订单数', dataIndex: ['_count', 'orders'], key: 'orderCount' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: t => dayjs(t).format('YYYY-MM-DD') },
    {
      title: '操作',
      key: 'actions',
      width: 180,
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
        <h2>品牌管理</h2>
      </div>

      <div className="filter-bar">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="品牌名称/联系人/电话" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="level" label="等级">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value="NORMAL">普通</Select.Option>
              <Select.Option value="VIP">VIP</Select.Option>
              <Select.Option value="KEY">重点</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="industry" label="行业">
            <Input placeholder="行业" style={{ width: 150 }} />
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增品牌</Button>
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
        title={currentRecord ? '编辑品牌' : '新增品牌'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="品牌名称" rules={[{ required: true, message: '请输入品牌名称' }]}>
                <Input placeholder="请输入品牌名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="industry" label="行业">
                <Input placeholder="请输入行业" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="客户等级" initialValue="NORMAL">
                <Select>
                  <Select.Option value="NORMAL">普通</Select.Option>
                  <Select.Option value="VIP">VIP</Select.Option>
                  <Select.Option value="KEY">重点</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="品牌详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {detailData && (
          <div>
            <p><strong>品牌名称：</strong>{detailData.name}</p>
            <p><strong>联系人：</strong>{detailData.contactPerson || '-'}</p>
            <p><strong>电话：</strong>{detailData.phone || '-'}</p>
            <p><strong>邮箱：</strong>{detailData.email || '-'}</p>
            <p><strong>行业：</strong>{detailData.industry || '-'}</p>
            <p><strong>等级：</strong>{detailData.level}</p>
            <p><strong>地址：</strong>{detailData.address || '-'}</p>
            <p><strong>备注：</strong>{detailData.remark || '-'}</p>
            
            <h4 style={{ marginTop: 16 }}>最近订单</h4>
            {detailData.orders?.length > 0 ? (
              <Table size="small" dataSource={detailData.orders} rowKey="id" pagination={false}>
                <Table.Column title="订单号" dataIndex="orderNo" />
                <Table.Column title="标题" dataIndex="title" />
                <Table.Column title="状态" dataIndex="status" render={s => <Tag>{s}</Tag>} />
                <Table.Column title="创建时间" dataIndex="createdAt" render={t => dayjs(t).format('YYYY-MM-DD')} />
              </Table>
            ) : <p>暂无订单</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Brands
