import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  InputNumber,
  Tag,
  message,
  Typography,
  Drawer,
  Descriptions,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  SyncOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  getInventoryList,
  createInventory,
  updateInventory,
  syncInventory,
  deleteInventory,
} from '@/api/inventory'
import { exportInventoryDetails } from '@/api/config'
import type { RoomInventory } from '@/types'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const InventoryManagement = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RoomInventory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()

  const [modalVisible, setModalVisible] = useState(false)
  const [syncModalVisible, setSyncModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<RoomInventory | null>(null)
  const [form] = Form.useForm()
  const [syncForm] = Form.useForm()

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RoomInventory | null>(null)

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
      const res = await getInventoryList(params)
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

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: RoomInventory) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      values.inventoryDate = values.inventoryDate.format('YYYY-MM-DD')

      if (editingItem) {
        await updateInventory({ ...editingItem, ...values })
        message.success('更新成功')
      } else {
        await createInventory(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleSync = () => {
    syncForm.resetFields()
    setSyncModalVisible(true)
  }

  const handleSyncSubmit = async () => {
    try {
      const values = await syncForm.validateFields()
      values.date = values.date.format('YYYY-MM-DD')
      await syncInventory(values)
      message.success('库存同步成功')
      setSyncModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('同步失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteInventory(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleViewDetail = (record: RoomInventory) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const handleDrillDown = (id: number) => {
    navigate(`/admin/inventory/${id}/detail`)
  }

  const handleExport = async () => {
    try {
      const values = searchForm.getFieldsValue()
      const params: any = {}
      if (values.hotelCode) params.hotelCode = values.hotelCode
      if (values.roomType) params.roomType = values.roomType
      if (values.roomStatus) params.roomStatus = values.roomStatus
      if (values.dateRange?.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD')
        params.endDate = values.dateRange[1].format('YYYY-MM-DD')
      }

      const res = await exportInventoryDetails(params)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const exportNo = res.headers['export-no']
      const fileName = exportNo ? `inventory_detail_${exportNo}.xlsx` : 'inventory_detail.xlsx'
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '路线ID',
      dataIndex: 'routeId',
      key: 'routeId',
      width: 80,
    },
    {
      title: '酒店',
      dataIndex: 'hotelName',
      key: 'hotelName',
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
      title: '总库存',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
    },
    {
      title: '已预订',
      dataIndex: 'bookedQuantity',
      key: 'bookedQuantity',
    },
    {
      title: '可售',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      render: (val: number, record: RoomInventory) => {
        let color = 'green'
        if (val < 5) color = 'red'
        else if (val < 10) color = 'orange'
        return <Tag color={color}>{val}</Tag>
      },
    },
    {
      title: '房态',
      dataIndex: 'roomStatus',
      key: 'roomStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          NORMAL: 'green',
          TIGHT: 'orange',
          SOLD_OUT: 'red',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: RoomInventory) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" onClick={() => handleDrillDown(record.id)}>
            明细
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>库存管理</Title>
        <Space>
          <Button icon={<SyncOutlined />} onClick={handleSync}>
            同步库存
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出明细
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增库存
          </Button>
        </Space>
      </div>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="hotelCode" label="酒店编码">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="roomType" label="房型">
          <Input placeholder="请输入" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="roomStatus" label="房态">
          <Select placeholder="请选择" style={{ width: 120 }} allowClear>
            <Option value="NORMAL">正常</Option>
            <Option value="TIGHT">紧张</Option>
            <Option value="SOLD_OUT">售罄</Option>
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

      <Modal
        title={editingItem ? '编辑库存' : '新增库存'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="routeId" label="路线ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hotelCode" label="酒店编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="hotelName" label="酒店名称">
            <Input />
          </Form.Item>
          <Form.Item name="roomType" label="房型" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="inventoryDate" label="库存日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalQuantity" label="总库存">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="bookedQuantity" label="已预订">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="blockedQuantity" label="已占用">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="roomStatus" label="房态">
            <Select>
              <Option value="NORMAL">正常</Option>
              <Option value="TIGHT">紧张</Option>
              <Option value="SOLD_OUT">售罄</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="同步库存"
        open={syncModalVisible}
        onOk={handleSyncSubmit}
        onCancel={() => setSyncModalVisible(false)}
        width={500}
      >
        <Form form={syncForm} layout="vertical">
          <Form.Item name="routeId" label="路线ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hotelCode" label="酒店编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roomType" label="房型" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date" label="库存日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalQuantity" label="总库存数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="库存详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{selectedItem.id}</Descriptions.Item>
            <Descriptions.Item label="路线ID">{selectedItem.routeId}</Descriptions.Item>
            <Descriptions.Item label="酒店">
              {selectedItem.hotelName} ({selectedItem.hotelCode})
            </Descriptions.Item>
            <Descriptions.Item label="房型">{selectedItem.roomType}</Descriptions.Item>
            <Descriptions.Item label="库存日期">{selectedItem.inventoryDate}</Descriptions.Item>
            <Descriptions.Item label="总库存">{selectedItem.totalQuantity}</Descriptions.Item>
            <Descriptions.Item label="已预订">{selectedItem.bookedQuantity}</Descriptions.Item>
            <Descriptions.Item label="已占用">{selectedItem.blockedQuantity}</Descriptions.Item>
            <Descriptions.Item label="可用库存">{selectedItem.availableQuantity}</Descriptions.Item>
            <Descriptions.Item label="房态">{selectedItem.roomStatus}</Descriptions.Item>
            <Descriptions.Item label="版本号">{selectedItem.version}</Descriptions.Item>
          </Descriptions>
        )}
        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={() => handleDrillDown(selectedItem!.id)}
        >
          查看明细下钻
        </Button>
      </Drawer>
    </div>
  )
}

export default InventoryManagement
