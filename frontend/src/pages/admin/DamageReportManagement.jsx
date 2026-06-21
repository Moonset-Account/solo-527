
import { useState } from 'react'
import { Card, Table, Button, Space, Select, Modal, Form, Input, Tag, message, Descriptions } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { damageReportList, productList } from './mockData'

const { Option } = Select
const { TextArea } = Input

const DamageReportManagement = () => {
  const [data, setData] = useState(damageReportList)
  const [statusFilter, setStatusFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()

  const statusMap = {
    pending: { text: '待审批', color: 'orange' },
    approved: { text: '已通过', color: 'green' },
    rejected: { text: '已驳回', color: 'red' },
  }

  const filteredData = data.filter(item => !statusFilter || item.status === statusFilter)

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleDetail = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleApprove = (record) => {
    Modal.confirm({
      title: '确认通过',
      content: `确定要通过报损单 ${record.code} 吗？`,
      onOk: () => {
        setData(data.map(item =>
          item.id === record.id
            ? { ...item, status: 'approved', approver: '管理员', approveTime: new Date().toLocaleString() }
            : item
        ))
        message.success('审批通过')
      },
    })
  }

  const handleReject = (record) => {
    Modal.confirm({
      title: '确认驳回',
      content: `确定要驳回报损单 ${record.code} 吗？`,
      onOk: () => {
        setData(data.map(item =>
          item.id === record.id
            ? { ...item, status: 'rejected', approver: '管理员', approveTime: new Date().toLocaleString(), rejectReason: '审核未通过' }
            : item
        ))
        message.success('已驳回')
      },
    })
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const newItem = {
        ...values,
        id: Math.max(...data.map(d => d.id)) + 1,
        code: `BS-${Date.now()}`,
        applicant: '管理员',
        status: 'pending',
        createTime: new Date().toLocaleString(),
      }
      setData([newItem, ...data])
      message.success('创建成功')
      setModalVisible(false)
    })
  }

  const columns = [
    { title: '报损单号', dataIndex: 'code', key: 'code' },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '报损数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '报损原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={statusMap[text].color}>{statusMap[text].text}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>详情</Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>驳回</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>报损管理</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="状态筛选"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 150 }}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建报损
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="创建报损申请"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productName" label="产品名称" rules={[{ required: true, message: '请选择产品' }]}>
            <Select showSearch placeholder="请选择产品">
              {productList.map(p => <Option key={p.id} value={p.name}>{p.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="报损数量" rules={[{ required: true, message: '请输入报损数量' }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="reason" label="报损原因" rules={[{ required: true, message: '请输入报损原因' }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="报损详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="报损单号">{currentItem.code}</Descriptions.Item>
            <Descriptions.Item label="产品名称">{currentItem.productName}</Descriptions.Item>
            <Descriptions.Item label="报损数量">{currentItem.quantity}</Descriptions.Item>
            <Descriptions.Item label="报损原因">{currentItem.reason}</Descriptions.Item>
            <Descriptions.Item label="申请人">{currentItem.applicant}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentItem.status].color}>{statusMap[currentItem.status].text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{currentItem.createTime}</Descriptions.Item>
            {currentItem.approver && <Descriptions.Item label="审批人">{currentItem.approver}</Descriptions.Item>}
            {currentItem.approveTime && <Descriptions.Item label="审批时间">{currentItem.approveTime}</Descriptions.Item>}
            {currentItem.rejectReason && <Descriptions.Item label="驳回原因">{currentItem.rejectReason}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default DamageReportManagement
