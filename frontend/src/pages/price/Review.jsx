import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Input, Select, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getPriceReviews } from '../../services/api'

const conclusionMap = {
  reasonable: { text: '价格合理，继续执行', color: 'green' },
  need_negotiate: { text: '需与供应商议价', color: 'orange' },
  find_supplier: { text: '需寻找替代供应商', color: 'red' },
  adjust_quantity: { text: '建议调整采购数量', color: 'blue' },
  other: { text: '其他', color: 'default' },
}

const PriceReview = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [keyword, setKeyword] = useState('')

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getPriceReviews({ page, pageSize })
      setData(res.list)
      setPagination({ current: page, pageSize, total: res.total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const columns = [
    { title: '物料名称', dataIndex: ['alert', 'materialName'], width: 150 },
    {
      title: '波动幅度',
      dataIndex: ['alert', 'fluctuation'],
      width: 120,
      render: (v) => (
        <Tag color={v > 0 ? 'red' : 'green'}>
          {v > 0 ? '↑' : '↓'} {Math.abs(v)}%
        </Tag>
      ),
    },
    {
      title: '复盘结论',
      dataIndex: 'conclusion',
      width: 180,
      render: (v) => {
        const item = conclusionMap[v] || { text: v, color: 'default' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    { title: '处理建议', dataIndex: 'suggestion', ellipsis: true },
    { title: '复盘人', dataIndex: ['reviewer', 'realName'], width: 100 },
    { title: '复盘时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
  ]

  return (
    <div className="page-container">
      <div className="page-title">价格复盘记录</div>

      <div className="table-toolbar">
        <div className="filter-section">
          <Input
            placeholder="搜索物料名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={() => fetchData(1, pagination.pageSize)}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchData(1, pagination.pageSize)}>
            查询
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
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchData(page, pageSize),
        }}
      />
    </div>
  )
}

export default PriceReview
