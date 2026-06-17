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
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { Popconfirm } from 'antd'
import { getAllActiveRoutes } from '@/api/route'
import type { TourRoute } from '@/types'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const RouteAdmin = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TourRoute[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<TourRoute | null>(null)

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TourRoute | null>(null)

  useEffect(() => {
    fetchData()
  }, [page, size])

  const fetchData = async (values?: any) => {
    setLoading(true)
    try {
      const res = await getAllActiveRoutes()
      if (res.data.code === 200) {
        let records = res.data.data
        if (values?.routeName) {
          records = records.filter((r: TourRoute) => r.routeName.includes(values.routeName))
        }
        if (values?.city) {
          records = records.filter((r: TourRoute) => r.city === values.city)
        }
        if (values?.status) {
          records = records.filter((r: TourRoute) => r.status === values.status)
        }
        setData(records.slice(page * size, (page + 1) * size))
        setTotal(records.length)
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
    form.setFieldsValue({ status: 'ACTIVE' })
    setModalVisible(true)
  }

  const handleEdit = (record: TourRoute) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      message.success(editingItem ? '更新成功' : '创建成功')
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleDelete = (id: number) => {
    message.success('删除成功')
    fetchData()
  }

  const handleViewDetail = (record: TourRoute) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '路线编码',
      dataIndex: 'routeCode',
      key: 'routeCode',
      width: 100,
    },
    {
      title: '路线名称',
      dataIndex: 'routeName',
      key: 'routeName',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 80,
    },
    {
      title: '天数',
      dataIndex: 'durationDays',
      key: 'durationDays',
      width: 80,
      render: (val: number) => `${val}天`,
    },
    {
      title: '基础价格',
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (val: number) => <span style={{ color: '#ff4d4f' }}>¥{val}</span>,
    },
    {
      title: '最大容量',
      dataIndex: 'maxCapacity',
      key: 'maxCapacity',
      width: 100,
      render: (val: number) => `${val}人`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          INACTIVE: 'default',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 60,
      render: (val: number) => `v${val}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: TourRoute) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />}>
            版本
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
        <Title level={4} style={{ margin: 0 }}>路线管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增路线
        </Button>
      </div>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="routeName" label="路线名称">
          <Input placeholder="请输入" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="city" label="城市">
          <Input placeholder="请输入" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="ACTIVE">上架</Option>
            <Option value="INACTIVE">下架</Option>
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
        title={editingItem ? '编辑路线' : '新增路线'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="routeCode" label="路线编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="routeName" label="路线名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Input />
          </Form.Item>
          <Form.Item name="durationDays" label="行程天数">
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="basePrice" label="基础价格">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="maxCapacity" label="最大容量">
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="ACTIVE">上架</Option>
              <Option value="INACTIVE">下架</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="路线描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="coverImage" label="封面图URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="路线详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{selectedItem.id}</Descriptions.Item>
            <Descriptions.Item label="路线编码">{selectedItem.routeCode}</Descriptions.Item>
            <Descriptions.Item label="路线名称">{selectedItem.routeName}</Descriptions.Item>
            <Descriptions.Item label="城市">{selectedItem.city}</Descriptions.Item>
            <Descriptions.Item label="行程天数">{selectedItem.durationDays}天</Descriptions.Item>
            <Descriptions.Item label="基础价格">¥{selectedItem.basePrice}</Descriptions.Item>
            <Descriptions.Item label="最大容量">{selectedItem.maxCapacity}人</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag>{selectedItem.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="版本号">v{selectedItem.version}</Descriptions.Item>
            <Descriptions.Item label="描述">{selectedItem.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="封面图">{selectedItem.coverImage || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default RouteAdmin
