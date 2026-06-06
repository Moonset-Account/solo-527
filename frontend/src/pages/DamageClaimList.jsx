import React, { useState, useEffect } from 'react'
import { 
  Table, Button, Modal, Form, Select, Input, 
  InputNumber, Tag, Space, message, Popconfirm
} from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { damageClaimApi } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { text: '待处理', color: 'orange' },
  APPROVED: { text: '已同意', color: 'green' },
  REJECTED: { text: '已拒绝', color: 'red' }
}

export default function DamageClaimList() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createModal, setCreateModal] = useState(false)
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: page - 1, size: pageSize }
      const result = await damageClaimApi.list(params)
      setData(result.content)
      setTotal(result.totalElements)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await damageClaimApi.create(values)
      message.success('申请已提交')
      setCreateModal(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleProcess = async (id, approved) => {
    try {
      await damageClaimApi.process(id, approved, '')
      message.success(approved ? '已同意赔付' : '已拒绝赔付')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { title: '赔付编号', dataIndex: 'claimCode', width: 180 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: status => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    },
    { title: '破损类型', dataIndex: 'damageType', width: 120 },
    { 
      title: '赔付类型', 
      dataIndex: 'compensationType', 
      width: 100,
      render: type => type === 'REFUND' ? '退款' : type === 'REMAKE' ? '重制' : '其他'
    },
    { title: '赔付金额', dataIndex: 'compensationAmount', width: 100, render: val => val ? `¥${val}` : '-' },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      width: 160,
      render: date => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        record.status === 'PENDING' && (
          <Space>
            <Button 
              type="link" 
              size="small" 
              icon={<CheckOutlined />} 
              onClick={() => handleProcess(record.id, true)}
            >
              同意
            </Button>
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<CloseOutlined />}
              onClick={() => handleProcess(record.id, false)}
            >
              拒绝
            </Button>
          </Space>
        )
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>破损赔付</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新建赔付
        </Button>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Select 
            placeholder="状态" 
            style={{ width: 140 }} 
            allowClear
            value={filters.status}
            onChange={val => setFilters({ ...filters, status: val })}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.text}</Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => { setPage(1); loadData() }}>查询</Button>
          <Button onClick={() => { setFilters({}); setPage(1); loadData() }}>重置</Button>
        </Space>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </div>

      <Modal
        title="新建赔付申请"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="artworkId" label="关联作品" rules={[{ required: true }]}>
            <Select placeholder="请选择作品">
              <Select.Option value={1}>作品1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="damageType" label="破损类型" rules={[{ required: true }]}>
            <Select placeholder="请选择破损类型">
              <Select.Option value="CRACK">开裂</Select.Option>
              <Select.Option value="BROKEN">碎裂</Select.Option>
              <Select.Option value="GLAZE_DEFECT">釉面缺陷</Select.Option>
              <Select.Option value="DEFORMATION">变形</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="damageDescription" label="破损描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="compensationType" label="赔付类型" rules={[{ required: true }]}>
            <Select placeholder="请选择赔付类型">
              <Select.Option value="REMAKE">免费重制</Select.Option>
              <Select.Option value="REFUND">退款</Select.Option>
              <Select.Option value="DISCOUNT">折扣</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="compensationAmount" label="赔付金额(元)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
