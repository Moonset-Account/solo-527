import React, { useState } from 'react'
import { Tabs, Card, Table, Tag, Button, Form, Input, Select, Space, message, Spin, DatePicker, DownloadOutlined, SearchOutlined } from 'antd'
import { queryBills, queryVisitors, queryInspections, exportBills, exportVisitors, exportInspections } from '../api'
import dayjs from 'dayjs'

const billStatusMap = {
  UNPAID: { color: 'red', text: '未缴' },
  PARTIAL_PAID: { color: 'orange', text: '部分已缴' },
  PAID: { color: 'green', text: '已缴清' },
  OVERDUE: { color: 'volcano', text: '逾期' }
}

const visitorStatusMap = {
  PENDING: { color: 'default', text: '待审批' },
  APPROVED: { color: 'green', text: '已批准' },
  REJECTED: { color: 'red', text: '已拒绝' },
  CHECKED_IN: { color: 'blue', text: '已到访' },
  CHECKED_OUT: { color: 'geekblue', text: '已离开' }
}

const inspectionStatusMap = {
  PENDING: { color: 'default', text: '待执行' },
  IN_PROGRESS: { color: 'processing', text: '进行中' },
  COMPLETED: { color: 'green', text: '已完成' },
  EXPIRED: { color: 'red', text: '已过期' }
}

export default function BatchQuery() {
  const [activeTab, setActiveTab] = useState('bills')
  const [loading, setLoading] = useState(false)

  const [billList, setBillList] = useState([])
  const [billPage, setBillPage] = useState({ current: 1, pageSize: 10, total: 0 })
  const [billFilters, setBillFilters] = useState({})
  const [billSearchForm] = Form.useForm()

  const [visitorList, setVisitorList] = useState([])
  const [visitorPage, setVisitorPage] = useState({ current: 1, pageSize: 10, total: 0 })
  const [visitorFilters, setVisitorFilters] = useState({})
  const [visitorSearchForm] = Form.useForm()

  const [inspectionList, setInspectionList] = useState([])
  const [inspectionPage, setInspectionPage] = useState({ current: 1, pageSize: 10, total: 0 })
  const [inspectionFilters, setInspectionFilters] = useState({})
  const [inspectionSearchForm] = Form.useForm()

  const loadBills = async (filters, page, pageSize) => {
    try {
      setLoading(true)
      const data = await queryBills({ ...filters, current: page, size: pageSize })
      setBillList(data.records || [])
      setBillPage({ current: page, pageSize, total: data.total || 0 })
    } catch (e) {
      message.error('加载账单失败')
    } finally {
      setLoading(false)
    }
  }

  const loadVisitors = async (filters, page, pageSize) => {
    try {
      setLoading(true)
      const data = await queryVisitors({ ...filters, current: page, size: pageSize })
      setVisitorList(data.records || [])
      setVisitorPage({ current: page, pageSize, total: data.total || 0 })
    } catch (e) {
      message.error('加载访客失败')
    } finally {
      setLoading(false)
    }
  }

  const loadInspections = async (filters, page, pageSize) => {
    try {
      setLoading(true)
      const data = await queryInspections({ ...filters, current: page, size: pageSize })
      setInspectionList(data.records || [])
      setInspectionPage({ current: page, pageSize, total: data.total || 0 })
    } catch (e) {
      message.error('加载巡检失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBillSearch = () => {
    const values = billSearchForm.getFieldsValue()
    const params = {}
    if (values.buildingNo) params.buildingNo = values.buildingNo
    if (values.roomNo) params.roomNo = values.roomNo
    if (values.feeType) params.feeType = values.feeType
    if (values.billPeriod) params.billPeriod = values.billPeriod.format('YYYY-MM')
    if (values.status) params.status = values.status
    setBillFilters(params)
    loadBills(params, 1, billPage.pageSize)
  }

  const handleVisitorSearch = () => {
    const values = visitorSearchForm.getFieldsValue()
    const params = {}
    if (values.visitorName) params.visitorName = values.visitorName
    if (values.visitorPhone) params.visitorPhone = values.visitorPhone
    if (values.buildingNo) params.buildingNo = values.buildingNo
    if (values.visitDate) params.visitDate = values.visitDate.format('YYYY-MM-DD')
    if (values.status) params.status = values.status
    setVisitorFilters(params)
    loadVisitors(params, 1, visitorPage.pageSize)
  }

  const handleInspectionSearch = () => {
    const values = inspectionSearchForm.getFieldsValue()
    const params = {}
    if (values.title) params.title = values.title
    if (values.inspectionType) params.inspectionType = values.inspectionType
    if (values.status) params.status = values.status
    if (values.planDate) params.planDate = values.planDate.format('YYYY-MM-DD')
    setInspectionFilters(params)
    loadInspections(params, 1, inspectionPage.pageSize)
  }

  React.useEffect(() => {
    if (activeTab === 'bills' && billList.length === 0) {
      loadBills({}, 1, 10)
    }
    if (activeTab === 'visitors' && visitorList.length === 0) {
      loadVisitors({}, 1, 10)
    }
    if (activeTab === 'inspections' && inspectionList.length === 0) {
      loadInspections({}, 1, 10)
    }
  }, [activeTab])

  const billColumns = [
    { title: '账单编号', dataIndex: 'billNo', width: 150 },
    { title: '楼栋', dataIndex: 'buildingNo', width: 80 },
    { title: '房间号', dataIndex: 'roomNo', width: 80 },
    { title: '费用类型', dataIndex: 'feeType', width: 100 },
    { title: '账期', dataIndex: 'billPeriod', width: 100 },
    { title: '应缴(元)', dataIndex: 'totalAmount', render: v => Number(v).toFixed(2) },
    { title: '已缴(元)', dataIndex: 'paidAmount', render: v => Number(v).toFixed(2) },
    {
      title: '状态', dataIndex: 'status',
      render: v => billStatusMap[v] ? <Tag color={billStatusMap[v].color}>{billStatusMap[v].text}</Tag> : v
    }
  ]

  const visitorColumns = [
    { title: '预约编号', dataIndex: 'appointmentNo', width: 150 },
    { title: '访客姓名', dataIndex: 'visitorName', width: 100 },
    { title: '访客电话', dataIndex: 'visitorPhone', width: 120 },
    { title: '人数', dataIndex: 'visitorCount', width: 60 },
    { title: '位置', width: 120, render: (_, r) => `${r.buildingNo} ${r.roomNo}` },
    { title: '来访日期', dataIndex: 'visitDate', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '时段', width: 130, render: (_, r) => `${r.visitTimeStart} - ${r.visitTimeEnd}` },
    {
      title: '状态', dataIndex: 'status',
      render: v => visitorStatusMap[v] ? <Tag color={visitorStatusMap[v].color}>{visitorStatusMap[v].text}</Tag> : v
    }
  ]

  const inspectionColumns = [
    { title: '任务编号', dataIndex: 'taskNo', width: 150 },
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '类型', dataIndex: 'inspectionType', width: 100 },
    { title: '区域', dataIndex: 'area', width: 150 },
    { title: '计划日期', dataIndex: 'planDate', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '负责人', dataIndex: 'assigneeId', width: 100,
      render: v => v ? `员工#${v}` : '-'
    },
    {
      title: '状态', dataIndex: 'status',
      render: v => inspectionStatusMap[v] ? <Tag color={inspectionStatusMap[v].color}>{inspectionStatusMap[v].text}</Tag> : v
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">批量查询中心</h2>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'bills',
              label: '费用账单查询',
              children: (
                <Spin spinning={loading}>
                  <Form form={billSearchForm} layout="inline" className="filter-bar" onFinish={handleBillSearch}>
                    <Form.Item name="buildingNo" label="楼栋">
                      <Input placeholder="楼栋" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item name="roomNo" label="房间">
                      <Input placeholder="房号" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item name="feeType" label="类型">
                      <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
                        { value: '物业费', label: '物业费' },
                        { value: '水费', label: '水费' },
                        { value: '电费', label: '电费' }
                      ]} />
                    </Form.Item>
                    <Form.Item name="billPeriod" label="账期">
                      <DatePicker picker="month" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                      <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
                        { value: 'UNPAID', label: '未缴' },
                        { value: 'PARTIAL_PAID', label: '部分已缴' },
                        { value: 'PAID', label: '已缴清' },
                        { value: 'OVERDUE', label: '逾期' }
                      ]} />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
                        <Button onClick={() => { billSearchForm.resetFields(); setBillFilters({}); loadBills({}, 1, billPage.pageSize) }}>重置</Button>
                        <Button icon={<DownloadOutlined />} onClick={() => exportBills(billFilters)}>导出Excel</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                  <Table
                    rowKey="id"
                    columns={billColumns}
                    dataSource={billList}
                    pagination={{
                      current: billPage.current,
                      pageSize: billPage.pageSize,
                      total: billPage.total,
                      showSizeChanger: true,
                      showTotal: total => `共 ${total} 条`,
                      onChange: (page, pageSize) => loadBills(billFilters, page, pageSize)
                    }}
                  />
                </Spin>
              )
            },
            {
              key: 'visitors',
              label: '访客预约查询',
              children: (
                <Spin spinning={loading}>
                  <Form form={visitorSearchForm} layout="inline" className="filter-bar" onFinish={handleVisitorSearch}>
                    <Form.Item name="visitorName" label="访客">
                      <Input placeholder="姓名" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item name="visitorPhone" label="电话">
                      <Input placeholder="手机号" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item name="buildingNo" label="楼栋">
                      <Input placeholder="楼栋" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item name="visitDate" label="来访日期">
                      <DatePicker style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                      <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
                        { value: 'PENDING', label: '待审批' },
                        { value: 'APPROVED', label: '已批准' },
                        { value: 'CHECKED_IN', label: '已到访' },
                        { value: 'CHECKED_OUT', label: '已离开' }
                      ]} />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
                        <Button onClick={() => { visitorSearchForm.resetFields(); setVisitorFilters({}); loadVisitors({}, 1, visitorPage.pageSize) }}>重置</Button>
                        <Button icon={<DownloadOutlined />} onClick={() => exportVisitors(visitorFilters)}>导出Excel</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                  <Table
                    rowKey="id"
                    columns={visitorColumns}
                    dataSource={visitorList}
                    pagination={{
                      current: visitorPage.current,
                      pageSize: visitorPage.pageSize,
                      total: visitorPage.total,
                      showSizeChanger: true,
                      showTotal: total => `共 ${total} 条`,
                      onChange: (page, pageSize) => loadVisitors(visitorFilters, page, pageSize)
                    }}
                  />
                </Spin>
              )
            },
            {
              key: 'inspections',
              label: '巡检任务查询',
              children: (
                <Spin spinning={loading}>
                  <Form form={inspectionSearchForm} layout="inline" className="filter-bar" onFinish={handleInspectionSearch}>
                    <Form.Item name="title" label="标题">
                      <Input placeholder="关键词" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="inspectionType" label="类型">
                      <Select placeholder="全部" allowClear style={{ width: 130 }} options={[
                        { value: '消防安全', label: '消防安全' },
                        { value: '电梯安全', label: '电梯安全' },
                        { value: '设备巡检', label: '设备巡检' },
                        { value: '环境检查', label: '环境检查' }
                      ]} />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                      <Select placeholder="全部" allowClear style={{ width: 110 }} options={[
                        { value: 'PENDING', label: '待执行' },
                        { value: 'IN_PROGRESS', label: '进行中' },
                        { value: 'COMPLETED', label: '已完成' }
                      ]} />
                    </Form.Item>
                    <Form.Item name="planDate" label="计划日期">
                      <DatePicker style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
                        <Button onClick={() => { inspectionSearchForm.resetFields(); setInspectionFilters({}); loadInspections({}, 1, inspectionPage.pageSize) }}>重置</Button>
                        <Button icon={<DownloadOutlined />} onClick={() => exportInspections(inspectionFilters)}>导出Excel</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                  <Table
                    rowKey="id"
                    columns={inspectionColumns}
                    dataSource={inspectionList}
                    pagination={{
                      current: inspectionPage.current,
                      pageSize: inspectionPage.pageSize,
                      total: inspectionPage.total,
                      showSizeChanger: true,
                      showTotal: total => `共 ${total} 条`,
                      onChange: (page, pageSize) => loadInspections(inspectionFilters, page, pageSize)
                    }}
                  />
                </Spin>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
