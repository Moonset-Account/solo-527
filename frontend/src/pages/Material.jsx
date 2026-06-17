import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Select, Modal, Form, Input, InputNumber, Tag, App, Card } from 'antd'
import { PlusOutlined, EditOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { materialApi, workOrderApi } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const Material = () => {
  const [data, setData] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [completeFilter, setCompleteFilter] = useState('')
  const { message } = App.useApp()

  useEffect(() => {
    fetchData()
    fetchWorkOrders()
  }, [completeFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (completeFilter !== '') params.isComplete = completeFilter
      const res = await materialApi.getList(params)
      if (res.code === 200) setData(res.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkOrders = async () => {
    const res = await workOrderApi.getList()
    if (res.code === 200) setWorkOrders(res.data)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let res
      if (editingItem) {
        res = await materialApi.update(editingItem.id, values)
      } else {
        res = await materialApi.create(values)
      }
      if (res.code === 200) {
        message.success(editingItem ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchData()
      } else {
        message.error(res.message)
      }
    } catch (e) {
      if (e.errorFields) return
      message.error('保存失败')
    }
  }

  const columns = [
    {
      title: '检查时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: (d) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '工单',
      key: 'workOrder',
      render: (_, r) => `${r.workOrder?.orderNo} - ${r.workOrder?.productName}`,
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
    },
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      key: 'materialCode',
    },
    {
      title: '需求数量',
      dataIndex: 'requiredQty',
      key: 'requiredQty',
    },
    {
      title: '可用数量',
      dataIndex: 'availableQty',
      key: 'availableQty',
    },
    {
      title: '齐套状态',
      dataIndex: 'isComplete',
      key: 'isComplete',
      render: (v) =>
        v ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            齐套
          </Tag>
        ) : (
          <Tag color="warning" icon={<WarningOutlined />}>
            缺料
          </Tag>
        ),
    },
    {
      title: '缺口数量',
      key: 'gap',
      render: (_, r) => Math.max(0, r.requiredQty - r.availableQty),
    },
    {
      title: '检查人',
      dataIndex: 'checkedBy',
      key: 'checkedBy',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            更新
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">物料齐套</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增检查
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="状态筛选"
            value={completeFilter === '' ? undefined : completeFilter}
            onChange={setCompleteFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="true">齐套</Option>
            <Option value="false">缺料</Option>
          </Select>
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      {data.filter((d) => !d.isComplete).length > 0 && (
        <Card
          style={{ marginBottom: 16, borderColor: '#faad14' }}
          title={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span>缺料提醒</span>
            </Space>
          }
        >
          <p style={{ margin: 0, color: '#d48806' }}>
            当前有 {data.filter((d) => !d.isComplete).length} 项物料缺料，请及时补充！
          </p>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '更新物料检查' : '新增物料检查'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="workOrderId"
            label="工单"
            rules={[{ required: true, message: '请选择工单' }]}
          >
            <Select placeholder="请选择工单" showSearch optionFilterProp="label">
              {workOrders.map((w) => (
                <Option key={w.id} value={w.id} label={`${w.orderNo} - ${w.productName}`}>
                  {w.orderNo} - {w.productName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="materialName"
            label="物料名称"
            rules={[{ required: true, message: '请输入物料名称' }]}
          >
            <Input placeholder="请输入物料名称" />
          </Form.Item>
          <Form.Item
            name="materialCode"
            label="物料编码"
            rules={[{ required: true, message: '请输入物料编码' }]}
          >
            <Input placeholder="请输入物料编码" />
          </Form.Item>
          <Form.Item
            name="requiredQty"
            label="需求数量"
            rules={[{ required: true, message: '请输入需求数量' }]}
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入需求数量" />
          </Form.Item>
          <Form.Item
            name="availableQty"
            label="可用数量"
            rules={[{ required: true, message: '请输入可用数量' }]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入可用数量" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Material
