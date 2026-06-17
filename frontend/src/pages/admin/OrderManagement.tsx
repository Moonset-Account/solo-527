import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  InputNumber,
} from 'antd'
import { SearchOutlined, EyeOutlined, RefundOutlined } from '@ant-design/icons'
import { getOrderList } from '@/api/order'
import type { TourOrder } from '@/types'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const OrderManagement = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TourOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TourOrder | null>(null)

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
      if (values?.dateRange?.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD')
        params.endDate = values.dateRange[1].format('YYYY-MM-DD')
        delete params.dateRange
      }
      const res = await getOrderList(params)
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

  const handleViewDetail = (record: TourOrder) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '路线',
      dataIndex: 'routeName',
      key: 'routeName',
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '联系电话',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
    },
    {
      title: '出行日期',
      dataIndex: 'travelDate',
      key: 'travelDate',
    },
    {
      title: '人数/房间',
      key: 'count',
      render: (_: any, record: TourOrder) => (
        <span>
          {record.guestCount}人 / {record.roomCount}间
        </span>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => <span style={{ color: '#ff4d4f' }}>¥{val}</span>,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          CONFIRMED: 'green',
          CANCELLED: 'red',
          COMPLETED: 'blue',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '退款状态',
      dataIndex: 'refundStatus',
      key: 'refundStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          NONE: 'default',
          PROCESSING: 'orange',
          REFUNDED: 'green',
          REJECTED: 'red',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: TourOrder) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.refundStatus === 'NONE' && record.orderStatus !== 'CANCELLED' && (
            <Button
              type="link"
              size="small"
              icon={<RefundOutlined />}
              onClick={() => message.info('退款功能请前往退款管理')}
            >
              申请退款
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>订单管理</Title>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="orderNo" label="订单号">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="customerName" label="客户姓名">
          <Input placeholder="请输入" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name="customerPhone" label="手机号">
          <Input placeholder="请输入" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="orderStatus" label="订单状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="PENDING">待确认</Option>
            <Option value="CONFIRMED">已确认</Option>
            <Option value="CANCELLED">已取消</Option>
            <Option value="COMPLETED">已完成</Option>
          </Select>
        </Form.Item>
        <Form.Item name="refundStatus" label="退款状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="NONE">无退款</Option>
            <Option value="PROCESSING">处理中</Option>
            <Option value="REFUNDED">已退款</Option>
            <Option value="REJECTED">已拒绝</Option>
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="出行日期">
          <RangePicker />
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

      <Drawer
        title="订单详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">{selectedItem.orderNo}</Descriptions.Item>
            <Descriptions.Item label="路线">{selectedItem.routeName}</Descriptions.Item>
            <Descriptions.Item label="客户姓名">{selectedItem.customerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedItem.customerPhone}</Descriptions.Item>
            <Descriptions.Item label="出行日期">{selectedItem.travelDate}</Descriptions.Item>
            <Descriptions.Item label="出行人数">{selectedItem.guestCount}人</Descriptions.Item>
            <Descriptions.Item label="房间数量">{selectedItem.roomCount}间</Descriptions.Item>
            <Descriptions.Item label="酒店">{selectedItem.hotelCode}</Descriptions.Item>
            <Descriptions.Item label="房型">{selectedItem.roomType}</Descriptions.Item>
            <Descriptions.Item label="订单金额">¥{selectedItem.totalAmount}</Descriptions.Item>
            <Descriptions.Item label="已付金额">¥{selectedItem.paidAmount}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag>{selectedItem.orderStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="支付状态">{selectedItem.paymentStatus}</Descriptions.Item>
            <Descriptions.Item label="退款状态">{selectedItem.refundStatus}</Descriptions.Item>
            {selectedItem.refundAmount && (
              <Descriptions.Item label="退款金额">¥{selectedItem.refundAmount}</Descriptions.Item>
            )}
            <Descriptions.Item label="版本号">{selectedItem.version}</Descriptions.Item>
            <Descriptions.Item label="备注">{selectedItem.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default OrderManagement
