import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, Card, Row, Col, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { eventAPI } from '../services/api.js'
import FilterSaver from '../components/FilterSaver.jsx'

const { Option } = Select

function EventList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', keyword: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await eventAPI.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      })
      setData(result.list)
      setPagination(p => ({ ...p, total: result.total }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleApplySavedFilter = (filterData) => {
    setFilters(filterData)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const statusMap = {
    DRAFT: { color: 'default', text: '草稿' },
    ON_SALE: { color: 'green', text: '售票中' },
    ENDED: { color: 'gray', text: '已结束' },
    CANCELLED: { color: 'red', text: '已取消' }
  }

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/events/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '场馆',
      dataIndex: 'venue'
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '场次',
      dataIndex: ['_count', 'sessions'],
      width: 80
    },
    {
      title: '订单数',
      dataIndex: ['_count', 'orders'],
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const info = statusMap[s] || { color: 'default', text: s }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/events/${record.id}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => navigate(`/events/${record.id}/buy`)}>购票</Button>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>活动列表</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          新建活动
        </Button>
      </div>

      <div className="filter-section">
        <Space wrap>
          <Input
            placeholder="搜索活动名称/场馆"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={filters.status || undefined}
            onChange={(v) => handleFilterChange('status', v)}
          >
            <Option value="DRAFT">草稿</Option>
            <Option value="ON_SALE">售票中</Option>
            <Option value="ENDED">已结束</Option>
            <Option value="CANCELLED">已取消</Option>
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
          <FilterSaver
            pageKey="events"
            filterData={filters}
            onApply={handleApplySavedFilter}
          />
        </Space>
      </div>

      <div className="table-container">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
          }}
        />
      </div>
    </div>
  )
}

export default EventList
