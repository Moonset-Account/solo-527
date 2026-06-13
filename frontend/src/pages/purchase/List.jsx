import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getPurchaseRequests, deletePurchaseRequest, submitPurchaseRequest } from '../../services/api'

const statusMap = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审批中', color: 'processing' },
  approved: { text: '已通过', color: 'success' },
  rejected: { text: '已驳回', color: 'error' },
  completed: { text: '已完成', color: 'blue' },
}

const PurchaseRequestList = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getPurchaseRequests({ page, pageSize, keyword, status })
      setData(res.list)
      setPagination({ current: page, pageSize, total: res.total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize)
  }

  const handleSubmit = async (id) => {
    try {
      await submitPurchaseRequest(id)
      message.success('提交成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await deletePurchaseRequest(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const columns = [
    { title: '需求编号', dataIndex: 'requestNo', width: 150 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '项目名称', dataIndex: 'projectName', width: 150 },
    { title: '部门', dataIndex: 'department', width: 100 },
    {
      title: '申请人',
      dataIndex: 'requester',
      width: 100,
      render: (v) => v?.realName || '-',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const s = statusMap[v] || { text: v, color: 'default' }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/purchase-requests/${record.id}`)}>
            查看
          </Button>
          {record.status === 'draft' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/purchase-requests/edit/${record.id}`)}>
                编辑
              </Button>
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmit(record.id)}>
                提交
              </Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'rejected' && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-title">采购需求管理</div>
      
      <div className="table-toolbar">
        <div className="filter-section">
          <Input
            placeholder="搜索编号/标题"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态筛选"
            value={status || undefined}
            onChange={(v) => setStatus(v)}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="pending">审批中</Select.Option>
            <Select.Option value="approved">已通过</Select.Option>
            <Select.Option value="rejected">已驳回</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
        </div>
        <div className="action-section">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchase-requests/new')}>
            新建需求
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchData(page, pageSize),
        }}
        scroll={{ x: 1000 }}
      />
    </div>
  )
}

export default PurchaseRequestList
