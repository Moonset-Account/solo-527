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
  Card,
  Descriptions,
} from 'antd'
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { getInventoryDetails, getInventoryById } from '@/api/inventory'
import type { InventoryDetail, RoomInventory } from '@/types'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const InventoryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<InventoryDetail[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [inventoryInfo, setInventoryInfo] = useState<RoomInventory | null>(null)

  useEffect(() => {
    if (id) {
      fetchInventoryInfo(Number(id))
      fetchData(Number(id))
    }
  }, [id, page, size])

  const fetchInventoryInfo = async (invId: number) => {
    try {
      const res = await getInventoryById(invId)
      if (res.data.code === 200) {
        setInventoryInfo(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory info:', error)
    }
  }

  const fetchData = async (invId: number, values?: any) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        size,
        roomInventoryId: invId,
        ...values,
      }
      if (values?.dateRange?.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD')
        params.endDate = values.dateRange[1].format('YYYY-MM-DD')
        delete params.dateRange
      }
      const res = await getInventoryDetails(params)
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
      fetchData(Number(id), values)
    })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setPage(0)
    fetchData(Number(id))
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '房号',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: '房型',
      dataIndex: 'roomType',
      key: 'roomType',
    },
    {
      title: '库存日期',
      dataIndex: 'inventoryDate',
      key: 'inventoryDate',
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (val: string) => val || '-',
    },
    {
      title: '客人姓名',
      dataIndex: 'guestName',
      key: 'guestName',
      render: (val: string) => val || '-',
    },
    {
      title: '房态',
      dataIndex: 'roomStatus',
      key: 'roomStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          OCCUPIED: 'blue',
          VACANT: 'green',
          MAINTENANCE: 'red',
          RESERVED: 'orange',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '清洁状态',
      dataIndex: 'cleanStatus',
      key: 'cleanStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          CLEAN: 'green',
          DIRTY: 'red',
          INSPECTED: 'blue',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '来源类型',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (val: string) => val || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (val: string) => val || '-',
    },
  ]

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/inventory')}
        style={{ marginBottom: 16 }}
      >
        返回库存列表
      </Button>

      <Title level={4} style={{ marginTop: 0 }}>库存明细下钻</Title>

      {inventoryInfo && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Descriptions column={4} size="small">
            <Descriptions.Item label="酒店">
              {inventoryInfo.hotelName} ({inventoryInfo.hotelCode})
            </Descriptions.Item>
            <Descriptions.Item label="房型">{inventoryInfo.roomType}</Descriptions.Item>
            <Descriptions.Item label="日期">{inventoryInfo.inventoryDate}</Descriptions.Item>
            <Descriptions.Item label="可用/总库存">
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {inventoryInfo.availableQuantity}
              </span>
              {' / '}
              {inventoryInfo.totalQuantity}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="roomNumber" label="房号">
          <Input placeholder="请输入" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="roomStatus" label="房态">
          <Select placeholder="请选择" style={{ width: 120 }} allowClear>
            <Option value="OCCUPIED">已占用</Option>
            <Option value="VACANT">空房</Option>
            <Option value="MAINTENANCE">维修</Option>
          </Select>
        </Form.Item>
        <Form.Item name="cleanStatus" label="清洁状态">
          <Select placeholder="请选择" style={{ width: 120 }} allowClear>
            <Option value="CLEAN">干净</Option>
            <Option value="DIRTY">脏房</Option>
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="日期范围">
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
    </div>
  )
}

export default InventoryDetailPage
