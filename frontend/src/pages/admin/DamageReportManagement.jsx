
import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Select, Modal, Form, Input, Tag, message, Descriptions } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { getDamageReports, createDamageReport, updateDamageReport, approveDamageReport, rejectDamageReport, deleteDamageReport } from '../../api/damageReports'
import { getProducts } from '../../api/products'

const { Option } = Select
const { TextArea } = Input

const DamageReportManagement = () => {
  const [data, setData] = useState([])
  const [productList, setProductList] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [rejectVisible, setRejectVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [rejectForm] = Form.useForm()
  const [form] = Form.useForm()

  const statusMap = {
    pending: { text: '待审批', color: 'orange' },
    approved: { text: '已通过', color: 'green' },
    rejected: { text: '已驳回', color: 'red' },
  }

  const loadData = () => {
    const params = { pageSize: 50 }
    if (statusFilter) params.status = statusFilter
    if (keyword) params.keyword = keyword
    getDamageReports(params).then(res => {
      if (res.success === true) {
        setData(res.data?.list || [])
      }
    })
  }

  const loadProducts = () => {
    getProducts({ pageSize: 100 }).then(res => {
      if (res.success === true) {
        setProductList(res.data?.list || [])
      }
    })
  }

  useEffect(() => {
    loadData()
    loadProducts()
  }, [])

  const handleSearch = () => {
    loadData()
  }

  const handleStatusChange = (value) => {
    setStatusFilter(value)
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

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
        approveDamageReport(record.id).then(res => {
          if (res.success === true) {
            message.success('审批通过')
            loadData()
          } else {
            message.error(res.message || '审批失败')
          }
        })
      },
    })
  }

  const handleReject = (record) => {
    setCurrentItem(record)
    rejectForm.resetFields()
    setRejectVisible(true)
  }

  const handleRejectOk = () => {
    rejectForm.validateFields().then(values => {
      rejectDamageReport(currentItem.id, { remark: values.remark }).then(res => {
        if (res.success === true) {
          message.success('已驳回')
          setRejectVisible(false)
          loadData()
        } else {
          message.error(res.message || '驳回失败')
        }
      })
    })
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除报损单 ${record.code} 吗？`,
      onOk: () => {
        deleteDamageReport(record.id).then(res => {
          if (res.success === true) {
            message.success('删除成功')
            loadData()
          } else {
            message.error(res.message || '删除失败')
          }
        })
      },
    })
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      createDamageReport(values).then(res => {
        if (res.success === true) {
          message.success('创建成功')
          setModalVisible(false)
          loadData()
        } else {
          message.error(res.message || '创建失败')
        }
      })
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
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>详情</Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>驳回</Button>
            </>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>删除</Button>
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
            <Input
              placeholder="搜索关键词"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              value={statusFilter || undefined}
              onChange={handleStatusChange}
              allowClear
              style={{ width: 150 }}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建报损
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
        title="驳回报损"
        open={rejectVisible}
        onOk={handleRejectOk}
        onCancel={() => setRejectVisible(false)}
        width={500}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="remark" label="驳回原因" rules={[{ required: true, message: '请输入驳回原因' }]}>
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
