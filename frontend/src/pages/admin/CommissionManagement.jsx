
import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Select, Modal, Form, Input, DatePicker, Tag, message, InputNumber } from 'antd'
import { PlusOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { getCommissions, createCommission, settleCommission } from '../../api/commissions'
import { getConsultants } from '../../api/consultants'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const CommissionManagement = () => {
  const [data, setData] = useState([])
  const [consultantList, setConsultantList] = useState([])
  const [consultantFilter, setConsultantFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const statusMap = {
    pending: { text: '待结算', color: 'orange' },
    settled: { text: '已结算', color: 'green' },
  }

  const loadCommissions = async () => {
    const params = { pageSize: 100 }
    if (consultantFilter) {
      params.consultantId = consultantFilter
    }
    if (statusFilter) {
      params.status = statusFilter
    }
    const res = await getCommissions(params)
    if (res.success) {
      setData(res.data.list || [])
    }
  }

  const loadConsultants = async () => {
    const res = await getConsultants({ pageSize: 100 })
    if (res.success) {
      setConsultantList(res.data.list || [])
    }
  }

  useEffect(() => {
    loadCommissions()
    loadConsultants()
  }, [])

  useEffect(() => {
    loadCommissions()
  }, [consultantFilter, statusFilter])

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSettle = (record) => {
    Modal.confirm({
      title: '确认结算',
      content: `确定要结算 ${record.consultantName} 的 ¥${record.amount} 提成吗？`,
      onOk: async () => {
        const res = await settleCommission(record.id)
        if (res.success) {
          message.success('结算成功')
          loadCommissions()
        }
      },
    })
  }

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      const res = await createCommission(values)
      if (res.success) {
        message.success('创建成功')
        setModalVisible(false)
        loadCommissions()
      }
    })
  }

  const totalPending = data.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
  const totalSettled = data.filter(item => item.status === 'settled').reduce((sum, item) => sum + item.amount, 0)

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '顾问姓名', dataIndex: 'consultantName', key: 'consultantName' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (text) => `¥${text}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={statusMap[text].color}>{statusMap[text].text}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
    { title: '结算时间', dataIndex: 'settleTime', key: 'settleTime', render: (text) => text || '-' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        record.status === 'pending' ? (
          <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleSettle(record)}>
            结算
          </Button>
        ) : null
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>提成管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 40 }}>
          <div>
            <div style={{ color: '#666', fontSize: 14 }}>待结算总额</div>
            <div style={{ color: '#faad14', fontSize: 28, fontWeight: 'bold' }}>¥{totalPending.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: 14 }}>已结算总额</div>
            <div style={{ color: '#52c41a', fontSize: 28, fontWeight: 'bold' }}>¥{totalSettled.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="顾问筛选"
              value={consultantFilter || undefined}
              onChange={setConsultantFilter}
              allowClear
              style={{ width: 150 }}
            >
              {consultantList.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
            <Select
              placeholder="状态筛选"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="pending">待结算</Option>
              <Option value="settled">已结算</Option>
            </Select>
            <RangePicker placeholder={['开始日期', '结束日期']} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建提成
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="创建提成记录"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="consultantId" label="顾问姓名" rules={[{ required: true, message: '请选择顾问' }]}>
            <Select>
              {consultantList.filter(c => c.status === 'active').map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="提成类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select>
              <Option value="销售提成">销售提成</Option>
              <Option value="推荐奖励">推荐奖励</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="提成金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CommissionManagement
