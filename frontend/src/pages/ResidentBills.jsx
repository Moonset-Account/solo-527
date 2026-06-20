import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Button, Tag, Modal, Form, Input, Select, message, Spin, Divider } from 'antd'
import { DollarOutlined, FileTextOutlined } from '@ant-design/icons'
import { getResidentBills, getResidentBillSummary, payBill } from '../api'
import dayjs from 'dayjs'

const billStatusMap = {
  UNPAID: { color: 'red', text: '未缴' },
  PARTIAL_PAID: { color: 'orange', text: '部分已缴' },
  PAID: { color: 'green', text: '已缴清' },
  OVERDUE: { color: 'volcano', text: '逾期' }
}

const feeTypeMap = {
  '物业费': '物业管理费',
  '水费': '水费',
  '电费': '电费'
}

export default function ResidentBills({ residentId }) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [bills, setBills] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState(null)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [currentBill, setCurrentBill] = useState(null)
  const [form] = Form.useForm()
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    loadData()
  }, [residentId, pagination.current, pagination.pageSize, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sumData, billData] = await Promise.all([
        getResidentBillSummary(residentId),
        getResidentBills(residentId, {
          current: pagination.current,
          size: pagination.pageSize,
          status: statusFilter
        })
      ])
      setSummary(sumData)
      setBills(billData.records || [])
      setPagination(p => ({ ...p, total: billData.total || 0 }))
    } catch (e) {
      message.error('加载账单失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = (bill) => {
    setCurrentBill(bill)
    form.setFieldsValue({
      amount: (Number(bill.totalAmount) - Number(bill.paidAmount)).toFixed(2),
      method: 'ALIPAY'
    })
    setPayModalVisible(true)
  }

  const handlePaySubmit = async () => {
    try {
      const values = await form.validateFields()
      setPaying(true)
      await payBill(currentBill.id, values)
      message.success('缴费成功')
      setPayModalVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '缴费失败')
    } finally {
      setPaying(false)
    }
  }

  const columns = [
    { title: '账单编号', dataIndex: 'billNo', width: 160 },
    {
      title: '费用类型', dataIndex: 'feeType', render: v => feeTypeMap[v] || v
    },
    { title: '账期', dataIndex: 'billPeriod', width: 100 },
    { title: '出账日期', dataIndex: 'billDate', width: 120, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '截止日期', dataIndex: 'dueDate', width: 120, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '应缴金额(元)', dataIndex: 'totalAmount', render: v => Number(v).toFixed(2) },
    { title: '已缴金额(元)', dataIndex: 'paidAmount', render: v => Number(v).toFixed(2) },
    {
      title: '未缴金额(元)',
      render: (_, r) => (Number(r.totalAmount) - Number(r.paidAmount)).toFixed(2)
    },
    {
      title: '状态', dataIndex: 'status',
      render: v => billStatusMap[v] ? <Tag color={billStatusMap[v].color}>{billStatusMap[v].text}</Tag> : v
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, r) => {
        if (r.status === 'PAID') return null
        return <Button type="primary" size="small" onClick={() => handlePay(r)}>缴费</Button>
      }
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">我的账单</h2>
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            allowClear
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, current: 1 })) }}
            options={[
              { value: 'UNPAID', label: '未缴' },
              { value: 'PARTIAL_PAID', label: '部分已缴' },
              { value: 'PAID', label: '已缴清' }
            ]}
          />
        </div>

        {summary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="账单总数" value={summary.totalBills} prefix={<FileTextOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="未缴账单" value={summary.unpaidCount} valueStyle={{ color: '#f5222d' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="应缴总额(元)" value={Number(summary.totalAmount).toFixed(2)} prefix={<DollarOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="未缴金额(元)" value={Number(summary.totalUnpaid).toFixed(2)} valueStyle={{ color: '#f5222d' }} prefix={<DollarOutlined />} />
              </Card>
            </Col>
          </Row>
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={bills}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Modal
          title="账单缴费"
          open={payModalVisible}
          onCancel={() => setPayModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          {currentBill && (
            <Form form={form} layout="vertical" onFinish={handlePaySubmit}>
              <Divider orientation="left">账单信息</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <p>账单编号：{currentBill.billNo}</p>
                </Col>
                <Col span={12}>
                  <p>费用类型：{feeTypeMap[currentBill.feeType] || currentBill.feeType}</p>
                </Col>
                <Col span={12}>
                  <p>应缴金额：{Number(currentBill.totalAmount).toFixed(2)} 元</p>
                </Col>
                <Col span={12}>
                  <p>已缴金额：{Number(currentBill.paidAmount).toFixed(2)} 元</p>
                </Col>
              </Row>
              <Divider orientation="left">缴费信息</Divider>
              <Form.Item
                label="缴费金额(元)"
                name="amount"
                rules={[{ required: true, message: '请输入缴费金额' }]}
              >
                <Input type="number" step="0.01" />
              </Form.Item>
              <Form.Item
                label="支付方式"
                name="method"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Select options={[
                  { value: 'ALIPAY', label: '支付宝' },
                  { value: 'WECHAT', label: '微信支付' },
                  { value: 'BANK', label: '银行转账' },
                  { value: 'CASH', label: '现金' }
                ]} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={paying} block>
                  确认缴费
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </Spin>
  )
}
