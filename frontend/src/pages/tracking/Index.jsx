import React, { useState, useEffect } from 'react'
import { Tabs, Input, Button, Table, Card, Descriptions, List, Tag, Space, InputNumber, Select, DatePicker, message, Modal, Form } from 'antd'
import { SearchOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import {
  getTrackingPurchaseRequests,
  getOriginalDocuments,
  getDeliveryConfirmations,
  confirmDelivery,
  getPriceTrend,
  getSuppliers,
} from '../../services/api'

const TrackingPage = () => {
  const [activeTab, setActiveTab] = useState('requests')

  return (
    <div className="page-container">
      <div className="page-title">事后追踪</div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'requests', label: '采购需求查询', children: <RequestTracker /> },
          { key: 'original', label: '原始单据追踪', children: <OriginalDocTracker /> },
          { key: 'delivery', label: '到货确认记录', children: <DeliveryTracker /> },
          { key: 'price', label: '价格趋势分析', children: <PriceTrendChart /> },
        ]}
      />
    </div>
  )
}

const RequestTracker = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getTrackingPurchaseRequests({ page, pageSize, keyword })
      setData(res.list)
      setPagination({ current: page, pageSize, total: res.total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    pending: { text: '审批中', color: 'processing' },
    approved: { text: '已通过', color: 'success' },
    rejected: { text: '已驳回', color: 'error' },
    completed: { text: '已完成', color: 'blue' },
  }

  const columns = [
    { title: '需求编号', dataIndex: 'requestNo', width: 150 },
    { title: '标题', dataIndex: 'title' },
    { title: '项目名称', dataIndex: 'projectName', width: 150 },
    { title: '申请部门', dataIndex: 'department', width: 100 },
    { title: '申请人', dataIndex: ['requester', 'realName'], width: 100 },
    { title: '总金额', dataIndex: 'totalAmount', width: 120, render: (v) => `¥${Number(v).toLocaleString()}` },
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
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="table-toolbar">
        <div className="filter-section">
          <Input
            placeholder="搜索需求编号/标题"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
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
        scroll={{ x: 1000 }}
      />
    </div>
  )
}

const OriginalDocTracker = () => {
  const [requestId, setRequestId] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const data = await getOriginalDocuments({ requestId })
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="请输入采购需求ID"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            查询原始单据
          </Button>
        </Space.Compact>
      </Card>

      {detail && (
        <div>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={3} bordered size="small">
              <Descriptions.Item label="需求编号">{detail.requestNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
              <Descriptions.Item label="项目">{detail.projectName}</Descriptions.Item>
              <Descriptions.Item label="部门">{detail.department}</Descriptions.Item>
              <Descriptions.Item label="申请人">{detail.requester?.realName}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{Number(detail.totalAmount).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="物料明细" style={{ marginBottom: 16 }}>
            <Table
              dataSource={detail.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '物料名称', dataIndex: 'materialName' },
                { title: '规格', dataIndex: 'specification' },
                { title: '单位', dataIndex: 'unit', width: 80 },
                { title: '数量', dataIndex: 'quantity', width: 100 },
                { title: '单价', dataIndex: 'estimatedPrice', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
                { title: '金额', dataIndex: 'totalAmount', width: 120, render: (v) => `¥${Number(v).toLocaleString()}` },
              ]}
            />
          </Card>

          <Card title="附件清单" style={{ marginBottom: 16 }}>
            {detail.attachments?.length > 0 ? (
              <List
                size="small"
                dataSource={detail.attachments}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.fileName} description={`${(item.fileSize / 1024).toFixed(1)} KB`} />
                    <Button type="link" size="small">下载</Button>
                  </List.Item>
                )}
              />
            ) : (
              <span style={{ color: '#999' }}>暂无附件</span>
            )}
          </Card>

          <Card title="审批记录">
            <Table
              dataSource={detail.approvals}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '层级', dataIndex: 'level', width: 80 },
                { title: '审批人', dataIndex: ['approver', 'realName'], width: 100 },
                { title: '状态', dataIndex: 'status', width: 100,
                  render: (v) => {
                    const map = { pending: '待审批', approved: '通过', rejected: '驳回' }
                    const colors = { pending: 'processing', approved: 'success', rejected: 'error' }
                    return <Tag color={colors[v]}>{map[v] || v}</Tag>
                  }
                },
                { title: '审批意见', dataIndex: 'comment' },
                { title: '时间', dataIndex: 'approvedAt', width: 180, render: (v) => v ? new Date(v).toLocaleString() : '-' },
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

const DeliveryTracker = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getDeliveryConfirmations({ pageSize: 50 })
      setData(res.list || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await confirmDelivery(values)
      message.success('确认成功')
      setModalVisible(false)
      fetchData()
    } catch (e) {}
  }

  const qualityMap = {
    qualified: { text: '合格', color: 'success' },
    unqualified: { text: '不合格', color: 'error' },
    partial: { text: '部分合格', color: 'warning' },
  }

  const columns = [
    { title: '订单编号', dataIndex: ['order', 'request', 'requestNo'], width: 150 },
    { title: '需求标题', dataIndex: ['order', 'request', 'title'] },
    { title: '供应商', dataIndex: ['order', 'supplier', 'name'], width: 150 },
    { title: '到货数量', dataIndex: 'deliveryQty', width: 100 },
    {
      title: '质量状态',
      dataIndex: 'qualityStatus',
      width: 100,
      render: (v) => {
        const s = qualityMap[v] || { text: v, color: 'default' }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '确认人', dataIndex: ['confirmer', 'realName'], width: 100 },
    { title: '确认时间', dataIndex: 'confirmedAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    { title: '备注', dataIndex: 'remark' },
  ]

  return (
    <div>
      <div className="table-toolbar">
        <div className="action-section">
          <Button type="primary" icon={<CheckOutlined />} onClick={handleAdd}>
            新增到货确认
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="到货确认"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="orderId" label="订单ID" rules={[{ required: true, message: '请输入订单ID' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="deliveryQty" label="到货数量" rules={[{ required: true, message: '请输入到货数量' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="qualityStatus" label="质量状态" rules={[{ required: true, message: '请选择质量状态' }]}>
            <Select>
              <Select.Option value="qualified">合格</Select.Option>
              <Select.Option value="unqualified">不合格</Select.Option>
              <Select.Option value="partial">部分合格</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

const PriceTrendChart = () => {
  const [materialName, setMaterialName] = useState('')
  const [chartData, setChartData] = useState({ dates: [], prices: [] })
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!materialName) return
    setLoading(true)
    try {
      const res = await getPriceTrend({ materialName })
      const trend = res.trend || []
      setChartData({
        dates: trend.map(t => new Date(t.date).toLocaleDateString()),
        prices: trend.map(t => Number(t.price)),
      })
    } finally {
      setLoading(false)
    }
  }

  const option = {
    title: { text: materialName ? `${materialName} 价格趋势` : '价格趋势图' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: chartData.dates },
    yAxis: { type: 'value', name: '价格(元)' },
    series: [{
      name: '价格',
      type: 'line',
      data: chartData.prices,
      smooth: true,
      areaStyle: { opacity: 0.3 },
    }],
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="请输入物料名称"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            查询趋势
          </Button>
        </Space.Compact>
      </Card>
      <Card>
        <ReactECharts option={option} style={{ height: 400 }} />
      </Card>
    </div>
  )
}

export default TrackingPage
