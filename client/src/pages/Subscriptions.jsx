import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import { getSubscriptions, createSubscription, updateSubscription, deleteSubscription, renewSubscription, getMembers } from '../services/api'
import dayjs from 'dayjs'

function Subscriptions() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [members, setMembers] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadMembers()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getSubscriptions()
      setList(res.list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const res = await getMembers({ pageSize: 100 })
      setMembers(res.list)
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

  const handleRenew = async record => {
    try {
      await renewSubscription(record.id)
      message.success('续费成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async id => {
    try {
      await deleteSubscription(id)
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
        await updateSubscription(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createSubscription(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const planTypes = [
    { value: 'MONTHLY', label: '月度订阅', color: 'blue' },
    { value: 'QUARTERLY', label: '季度订阅', color: 'purple' },
    { value: 'YEARLY', label: '年度订阅', color: 'gold' }
  ]

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '会员', dataIndex: ['member', 'name'], key: 'member', render: (v, r) => r.member?.name + ' (' + (r.member?.phone || '-') + ')' },
    { title: '套餐名称', dataIndex: 'planName', key: 'planName' },
    {
      title: '套餐类型',
      dataIndex: 'planType',
      key: 'planType',
      render: t => {
        const type = planTypes.find(p => p.value === t)
        return <Tag color={type?.color || 'default'}>{type?.label || t}</Tag>
      }
    },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '续费次数', dataIndex: 'renewalCount', key: 'renewalCount', render: v => `${v}次` },
    { title: '自动续费', dataIndex: 'autoRenew', key: 'autoRenew', render: v => <Switch checked={v} disabled size="small" /> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={s === 'ACTIVE' ? 'green' : s === 'EXPIRED' ? 'orange' : 'default'}>{s}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => handleRenew(r)}>续费</Button>
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
        <h2>订阅管理</h2>
        <p style={{ color: '#666', marginTop: 8 }}>管理会员订阅套餐，支持续费操作，与会员留存关联</p>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增订阅</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title={currentRecord ? '编辑订阅' : '新增订阅'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={550}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="memberId" label="会员" rules={[{ required: true }]}>
            <Select placeholder="请选择会员">
              {members.map(m => (
                <Select.Option key={m.id} value={m.id}>{m.name} ({m.phone || '-'})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="planName" label="套餐名称" rules={[{ required: true }]}>
            <Input placeholder="请输入套餐名称" />
          </Form.Item>
          <Form.Item name="planType" label="套餐类型" initialValue="MONTHLY">
            <Select>
              {planTypes.map(t => (
                <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="订阅金额">
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item label="订阅周期">
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
          <Form.Item name="status" label="状态" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">活跃</Select.Option>
              <Select.Option value="EXPIRED">已过期</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="autoRenew" label="自动续费" valuePropName="checked" initialValue={true}>
            <Switch />
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

export default Subscriptions
