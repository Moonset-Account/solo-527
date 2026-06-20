import React, { useState, useEffect } from 'react'
import { Table, Tag, Form, Input, Select, Button, Space, message, Spin, Card, Statistic, Row, Col, Progress } from 'antd'
import { SearchOutlined, DownloadOutlined, DollarOutlined } from '@ant-design/icons'
import { getPaymentProgress, exportBills } from '../api'

export default function PaymentProgress() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [filters, setFilters] = useState({})
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getPaymentProgress(filters)
      setData(result || [])
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params = {}
    if (values.buildingNo) params.buildingNo = values.buildingNo
    if (values.feeType) params.feeType = values.feeType
    if (values.billPeriod) params.billPeriod = values.billPeriod.format('YYYY-MM')
    setFilters(params)
  }

  const handleReset = () => {
    form.resetFields()
    setFilters({})
  }

  const handleExport = () => {
    exportBills(filters)
  }

  const summary = data.reduce((acc, item) => {
    if (item.buildingno !== '总计') {
      acc.totalBills += Number(item.totalbills || 0)
      acc.totalAmount += Number(item.totalamount || 0)
      acc.paidAmount += Number(item.paidamount || 0)
      acc.paidCount += Number(item.paidcount || 0)
    }
    return acc
  }, { totalBills: 0, totalAmount: 0, paidAmount: 0, paidCount: 0 })

  const columns = [
    { title: '楼栋', dataIndex: 'buildingno', width: 120, render: v => v || '合计' },
    { title: '费用类型', dataIndex: 'feetype', width: 100 },
    { title: '账期', dataIndex: 'billperiod', width: 100 },
    { title: '账单总数', dataIndex: 'totalbills', width: 100 },
    { title: '已缴账单数', dataIndex: 'paidcount', width: 110, render: v => <span style={{ color: '#52c41a' }}>{v || 0}</span> },
    { title: '未缴账单数', dataIndex: 'unpaidcount', width: 110, render: v => <span style={{ color: '#f5222d' }}>{v || 0}</span> },
    { title: '应缴总额(元)', dataIndex: 'totalamount', width: 130, render: v => Number(v || 0).toFixed(2) },
    { title: '已缴金额(元)', dataIndex: 'paidamount', width: 130, render: v => <span style={{ color: '#52c41a' }}>{Number(v || 0).toFixed(2)}</span> },
    {
      title: '缴费率', dataIndex: 'paymentrate', width: 180,
      render: v => (
        <Progress
          percent={Number(v || 0)}
          size="small"
          status={Number(v) >= 80 ? 'success' : Number(v) >= 50 ? 'normal' : 'exception'}
        />
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">收费进度</h2>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出Excel</Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="账单总数" value={summary.totalBills} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已缴账单" value={summary.paidCount} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="应收金额(元)"
                value={summary.totalAmount.toFixed(2)}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已收金额(元)"
                value={summary.paidAmount.toFixed(2)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Form form={form} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="buildingNo" label="楼栋">
            <Input placeholder="楼栋号" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="feeType" label="费用类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
              { value: '物业费', label: '物业费' },
              { value: '水费', label: '水费' },
              { value: '电费', label: '电费' }
            ]} />
          </Form.Item>
          <Form.Item name="billPeriod" label="账期">
            <Select placeholder="全部" allowClear style={{ width: 140 }} options={[
              { value: '2024-06', label: '2024年6月' },
              { value: '2024-05', label: '2024年5月' },
              { value: '2024-04', label: '2024年4月' }
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey={(r, i) => `${r.buildingno}-${r.feetype}-${r.billperiod}-${i}`}
          columns={columns}
          dataSource={data}
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={3}>合计</Table.Summary.Cell>
                <Table.Summary.Cell>{summary.totalBills}</Table.Summary.Cell>
                <Table.Summary.Cell style={{ color: '#52c41a' }}>{summary.paidCount}</Table.Summary.Cell>
                <Table.Summary.Cell style={{ color: '#f5222d' }}>{summary.totalBills - summary.paidCount}</Table.Summary.Cell>
                <Table.Summary.Cell>{summary.totalAmount.toFixed(2)}</Table.Summary.Cell>
                <Table.Summary.Cell style={{ color: '#52c41a' }}>{summary.paidAmount.toFixed(2)}</Table.Summary.Cell>
                <Table.Summary.Cell>
                  {summary.totalAmount > 0 ? ((summary.paidAmount / summary.totalAmount) * 100).toFixed(2) + '%' : '0%'}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </div>
    </Spin>
  )
}
