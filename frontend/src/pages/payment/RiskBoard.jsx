import React, { useState, useEffect } from 'react'
import { Table, Tag, Input, Button, Space, Card, List, Progress, Modal, message } from 'antd'
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { getSupplierRiskBoard, getSupplierRiskDetail } from '../../services/api'

const riskLevelMap = {
  1: { text: '低风险', color: 'success', percent: 20 },
  2: { text: '较低风险', color: 'blue', percent: 40 },
  3: { text: '中等风险', color: 'warning', percent: 60 },
  4: { text: '较高风险', color: 'orange', percent: 80 },
  5: { text: '高风险', color: 'error', percent: 100 },
}

const riskTypeMap = {
  payment_diff: '付款差异',
  delivery_delay: '交付延迟',
  quality_issue: '质量问题',
  price_fluctuation: '价格波动',
}

const RiskBoard = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getSupplierRiskBoard({
        page, pageSize,
        keyword,
        riskLevel: riskLevel || undefined,
      })
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

  const handleViewDetail = async (record) => {
    try {
      const data = await getSupplierRiskDetail(record.id)
      setCurrentSupplier(data)
      setDetailVisible(true)
    } catch (e) {}
  }

  const riskDistribution = [
    { value: data.filter(d => d.riskLevel === 1).length, name: '低风险' },
    { value: data.filter(d => d.riskLevel === 2).length, name: '较低风险' },
    { value: data.filter(d => d.riskLevel === 3).length, name: '中等风险' },
    { value: data.filter(d => d.riskLevel === 4).length, name: '较高风险' },
    { value: data.filter(d => d.riskLevel === 5).length, name: '高风险' },
  ]

  const chartOption = {
    title: { text: '供应商风险分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 20, fontWeight: 'bold' }
      },
      data: riskDistribution.filter(d => d.value > 0),
      color: ['#52c41a', '#1890ff', '#faad14', '#fa8c16', '#f5222d'],
    }],
  }

  const columns = [
    { title: '供应商编码', dataIndex: 'code', width: 120 },
    { title: '供应商名称', dataIndex: 'name', width: 200 },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 150,
      render: (v) => {
        const level = riskLevelMap[v] || riskLevelMap[1]
        return (
          <Space>
            <Progress
              percent={level.percent}
              size="small"
              status={level.color === 'error' ? 'exception' : level.color === 'warning' ? 'normal' : 'active'}
              style={{ width: 80 }}
            />
            <Tag color={level.color}>{level.text}</Tag>
          </Space>
        )
      },
    },
    { title: '风险记录数', dataIndex: ['_count', 'supplierRiskLogs'], width: 100 },
    { title: '订单数', dataIndex: ['_count', 'purchaseOrders'], width: 100 },
    { title: '风险说明', dataIndex: 'riskNote', ellipsis: true },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-title">供应商风险看板</div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <ReactECharts option={chartOption} style={{ height: 250 }} />
        </Card>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 20 }}>
            {[1, 2, 3, 4, 5].map(level => {
              const info = riskLevelMap[level]
              const count = data.filter(d => d.riskLevel === level).length
              return (
                <div key={level} style={{ textAlign: 'center', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: info.color }}>{count}</div>
                  <div style={{ color: '#666', marginTop: 4 }}>{info.text}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="table-toolbar">
        <div className="filter-section">
          <Input
            placeholder="搜索供应商名称/编码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            onPressEnter={handleSearch}
          />
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            style={{ width: 150, height: 32, borderRadius: 6, border: '1px solid #d9d9d9', padding: '0 11px' }}
          >
            <option value="">全部等级</option>
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>{riskLevelMap[level].text}</option>
            ))}
          </select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
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
          showTotal: (total) => `共 ${total} 家供应商`,
          onChange: (page, pageSize) => fetchData(page, pageSize),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="供应商风险详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentSupplier && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p><strong>供应商：</strong>{currentSupplier.name}（{currentSupplier.code}）</p>
              <p><strong>风险等级：</strong>
                <Tag color={riskLevelMap[currentSupplier.riskLevel]?.color}>
                  {riskLevelMap[currentSupplier.riskLevel]?.text}
                </Tag>
              </p>
              <p><strong>风险说明：</strong>{currentSupplier.riskNote || '暂无'}</p>
            </Card>

            <div className="detail-section-title">风险记录</div>
            <List
              size="small"
              dataSource={currentSupplier.supplierRiskLogs || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />}
                    title={
                      <Space>
                        <Tag>{riskTypeMap[item.riskType] || item.riskType}</Tag>
                        <span>严重度: {item.severity}/5</span>
                      </Space>
                    }
                    description={item.description}
                  />
                  <span style={{ color: '#999' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RiskBoard
