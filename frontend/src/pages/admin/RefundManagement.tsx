import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  InputNumber,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  getRefundList,
  applyRefund,
  approveRefund,
  rejectRefund,
} from '@/api/order'
import type { RefundRecord } from '@/types'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const RefundManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RefundRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()

  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectForm] = Form.useForm()

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RefundRecord | null>(null)

  useEffect(() => {
    fetchData()
  }, [page, size])

  const fetchData = async (values?: any) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        size,
        ...values,
      }
      const res = await getRefundList(params)
      if (res.data.code === 200) {
        setData(res.data.data.records)
        setTotal(res.data.data.total)
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(0)
    searchForm.validateFields().then((values) => {
      fetchData(values)
    })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPage(0)
    fetchData()
  }

  const handleApply = () => {
    form.resetFields()
    setApplyModalVisible(true)
  }

  const handleApplySubmit = async () => {
    try {
      const values = await form.validateFields()
      await applyRefund(values)
      message.success('退款申请提交成功')
      setApplyModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('提交失败')
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await approveRefund(id)
      message.success('退款审批通过')
      fetchData()
    } catch (error) {
      message.error('审批失败')
    }
  }

  const handleReject = (id: number) => {
    setRejectId(id)
    rejectForm.resetFields()
    setRejectModalVisible(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectId) return
    try {
      const values = await rejectForm.validateFields()
      await rejectRefund(rejectId, values.rejectReason)
      message.success('已拒绝退款')
      setRejectModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleViewDetail = (record: RefundRecord) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const columns = [
    {
      title: '退款单号',
      dataIndex: 'refundNo',
      key: 'refundNo',
      width: 160,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      render: (val: number) => <span style={{ color: '#ff4d4f' }}>¥{val}</span>,
    },
    {
      title: '退款类型',
      dataIndex: 'refundType',
      key: 'refundType',
      render: (val: string) => {
        const map: Record<string, string> = {
          FULL_REFUND: '全额退款',
          PARTIAL_REFUND: '部分退款',
          NORMAL: '普通退款',
        }
        return map[val] || val
      },
    },
    {
      title: '退款原因',
      dataIndex: 'refundReason',
      key: 'refundReason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'refundStatus',
      key: 'refundStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          APPROVED: 'green',
          REJECTED: 'red',
          PROCESSING: 'blue',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'approver',
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: RefundRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.refundStatus === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>退款管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleApply}>
          申请退款
        </Button>
      </div>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="refundNo" label="退款单号">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="orderNo" label="订单号">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="refundStatus" label="状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="PENDING">待审批</Option>
            <Option value="APPROVED">已通过</Option>
            <Option value="REJECTED">已拒绝</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1)
            setSize(s)
          },
        }}
      />

      <Modal
        title="申请退款"
        open={applyModalVisible}
        onOk={handleApplySubmit}
        onCancel={() => setApplyModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="orderNo" label="订单号" rules={[{ required: true, message: '请输入订单号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="refundAmount" label="退款金额" rules={[{ required: true, message: '请输入退款金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="refundType" label="退款类型">
            <Select>
              <Option value="FULL_REFUND">全额退款</Option>
              <Option value="PARTIAL_REFUND">部分退款</Option>
              <Option value="NORMAL">普通退款</Option>
            </Select>
          </Form.Item>
          <Form.Item name="refundReason" label="退款原因" rules={[{ required: true, message: '请输入退款原因' }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝退款"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="rejectReason" label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="退款详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="退款单号">{selectedItem.refundNo}</Descriptions.Item>
            <Descriptions.Item label="订单号">{selectedItem.orderNo}</Descriptions.Item>
            <Descriptions.Item label="退款金额">¥{selectedItem.refundAmount}</Descriptions.Item>
            <Descriptions.Item label="退款类型">{selectedItem.refundType}</Descriptions.Item>
            <Descriptions.Item label="退款原因">{selectedItem.refundReason}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag>{selectedItem.refundStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="审批人">{selectedItem.approver || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批时间">{selectedItem.approveTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="退款时间">{selectedItem.refundTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{selectedItem.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default RefundManagement
