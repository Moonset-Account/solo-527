import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, Row, Col, DatePicker, Descriptions, Drawer } from 'antd'
import { SearchOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { queryBills, getBillDetail, payBill, exportBills } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  UNPAID: { color: 'red', text: '未缴' },
  PARTIAL_PAID: { color: 'orange', text: '部分已缴' },
  PAID: { color: 'green', text: '已缴清' },
  OVERDUE: { color: 'volcano', text: '逾期' },
  CANCELLED: { color: 'gray', text: '已取消' }
}

export default function BillManagement() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentBill, setCurrentBill] = useState(null)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await queryBills({
        ...filters,
        current: pagination.current,
        size: pagination.pageSize
      })
      setList(data.records || [])
      setPagination(p => ({ ...p, total: data.total || 0 }))
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setFilters(values)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleExport = () => {
    exportBills(filters)
  }

  const handleViewDetail = async (bill) => {
    try {
      const detail = await getBillDetail(bill.id)
      setCurrentBill(detail)
      setDetailVisible(true)
    } catch (e) {
      message.error('加载详情失败')
    }
  }

  const handlePay = (bill) => {
    setCurrentBill(bill)
    form.setFieldsValue({
      amount: (Number(bill.totalAmount) - Number(bill.paidAmount)).toFixed(2),
      method: 'CASH'
    })
    setPayModalVisible(true)
  }

  const handlePaySubmit = async () => {
    try {
      const values = await form.validateFields()
      await payBill(currentBill.id, values)
      message.success('缴费成功')
      setPayModalVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '缴费失败')
    }
  }

  const columns = [
    { title: '账单编号', dataIndex: 'billNo', width: 160, fixed: 'left' },
    { title: '楼栋', dataIndex: 'buildingNo', width: 80 },
    { title: '房间号', dataIndex: 'roomNo', width: 80 },
    { title: '费用类型', dataIndex: 'feeType', width: 100 },
    { title: '账期', dataIndex: 'billPeriod', width: 100 },
    { title: '出账日期', dataIndex: 'billDate', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '截止日期', dataIndex: 'dueDate', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '应缴金额(元)', dataIndex: 'totalAmount', width: 110, render: v => Number(v).toFixed(2) },
    { title: '已缴金额(元)', dataIndex: 'paidAmount', width: 110, render: v => Number(v).toFixed(2) },
    { title: '未缴金额(元)', width: 110, render: (_, r) => (Number(r.totalAmount) - Number(r.paidAmount)).toFixed(2) },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status !== 'PAID' && r.status !== 'CANCELLED' && (
            <Button size="small" type="primary" onClick={() => handlePay(r)}>登记缴费</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">账单管理</h2>
        </div>

        <Form form={searchForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="buildingNo" label="楼栋">
            <Input placeholder="楼栋号" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="roomNo" label="房间号">
            <Input placeholder="房间号" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="feeType" label="费用类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
              { value: '物业费', label: '物业费' },
              { value: '水费', label: '水费' },
              { value: '电费', label: '电费' }
            ]} />
          </Form.Item>
          <Form.Item name="billPeriod" label="账期">
            <DatePicker picker="month" style={{ width: 140 }} format="YYYY-MM" />
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
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>导出Excel</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          scroll={{ x: 1300 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Drawer
          title="账单详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={500}
        >
          {currentBill && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="账单编号">{currentBill.billNo}</Descriptions.Item>
              <Descriptions.Item label="位置">{currentBill.buildingNo} {currentBill.roomNo}</Descriptions.Item>
              <Descriptions.Item label="费用类型">{currentBill.feeType}</Descriptions.Item>
              <Descriptions.Item label="账期">{currentBill.billPeriod}</Descriptions.Item>
              <Descriptions.Item label="出账日期">{dayjs(currentBill.billDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="截止日期">{dayjs(currentBill.dueDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="应缴金额">{Number(currentBill.totalAmount).toFixed(2)} 元</Descriptions.Item>
              <Descriptions.Item label="已缴金额">{Number(currentBill.paidAmount).toFixed(2)} 元</Descriptions.Item>
              <Descriptions.Item label="未缴金额">{(Number(currentBill.totalAmount) - Number(currentBill.paidAmount)).toFixed(2)} 元</Descriptions.Item>
              <Descriptions.Item label="状态">{statusMap[currentBill.status]?.text || currentBill.status}</Descriptions.Item>
              {currentBill.remark && <Descriptions.Item label="备注">{currentBill.remark}</Descriptions.Item>}
            </Descriptions>
          )}
        </Drawer>

        <Modal
          title="登记缴费"
          open={payModalVisible}
          onCancel={() => setPayModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          {currentBill && (
            <Form form={form} layout="vertical" onFinish={handlePaySubmit}>
              <p>账单编号：{currentBill.billNo}</p>
              <p>应缴金额：{Number(currentBill.totalAmount).toFixed(2)} 元</p>
              <p>已缴金额：{Number(currentBill.paidAmount).toFixed(2)} 元</p>
              <p style={{ color: '#f5222d' }}>本次可缴：{(Number(currentBill.totalAmount) - Number(currentBill.paidAmount)).toFixed(2)} 元</p>
              <Form.Item label="缴费金额(元)" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
                <Input type="number" step="0.01" />
              </Form.Item>
              <Form.Item label="支付方式" name="method" rules={[{ required: true, message: '请选择' }]}>
                <Select options={[
                  { value: 'CASH', label: '现金' },
                  { value: 'ALIPAY', label: '支付宝' },
                  { value: 'WECHAT', label: '微信支付' },
                  { value: 'BANK', label: '银行转账' },
                  { value: 'TRANSFER', label: '转账' }
                ]} />
              </Form.Item>
              <Form.Item label="操作员ID" name="operatorId">
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>确认缴费</Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </Spin>
  )
}
