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
  Tag,
  message,
  Typography,
  Popconfirm,
  Drawer,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import {
  getCleaningTaskList,
  createCleaningTask,
  updateCleaningTask,
  updateCleaningTaskStatus,
  deleteCleaningTask,
} from '@/api/cleaning'
import type { CleaningTask } from '@/types'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

const CleaningTaskPage = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CleaningTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<CleaningTask | null>(null)

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CleaningTask | null>(null)

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
      if (values?.taskDate) {
        params.taskDate = values.taskDate.format('YYYY-MM-DD')
      }
      const res = await getCleaningTaskList(params)
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

  const handleEdit = (record: CleaningTask) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      taskDate: record.taskDate ? dayjs(record.taskDate) : null,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.taskDate) {
        values.taskDate = values.taskDate.format('YYYY-MM-DD')
      }

      if (editingItem) {
        await updateCleaningTask({ ...editingItem, ...values })
        message.success('更新成功')
      } else {
        await createCleaningTask(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateCleaningTaskStatus(id, status)
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleViewDetail = (record: CleaningTask) => {
    setSelectedItem(record)
    setDetailDrawerVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCleaningTask(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '任务号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 160,
    },
    {
      title: '酒店',
      dataIndex: 'hotelName',
      key: 'hotelName',
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
      title: '任务日期',
      dataIndex: 'taskDate',
      key: 'taskDate',
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (val: string) => {
        const map: Record<string, string> = {
          DAILY_CLEAN: '日常清洁',
          REPAIR_CLEAN: '维修清洁',
          TURN_DOWN: '夜床服务',
        }
        return map[val] || val
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          HIGH: 'red',
          NORMAL: 'blue',
          LOW: 'green',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          IN_PROGRESS: 'blue',
          COMPLETED: 'green',
          CANCELLED: 'default',
        }
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>
      },
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: CleaningTask) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.taskStatus === 'PENDING' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'IN_PROGRESS')}
            >
              开始
            </Button>
          )}
          {record.taskStatus === 'IN_PROGRESS' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'COMPLETED')}
            >
              完成
            </Button>
          )}
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
        <Title level={4} style={{ margin: 0 }}>清洁任务</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增任务
        </Button>
      </div>

      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="hotelCode" label="酒店编码">
          <Input placeholder="请输入" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="roomNumber" label="房号">
          <Input placeholder="请输入" style={{ width: 100 }} />
        </Form.Item>
        <Form.Item name="taskDate" label="任务日期">
          <DatePicker />
        </Form.Item>
        <Form.Item name="taskStatus" label="状态">
          <Select placeholder="请选择" style={{ width: 100 }} allowClear>
            <Option value="PENDING">待处理</Option>
            <Option value="IN_PROGRESS">进行中</Option>
            <Option value="COMPLETED">已完成</Option>
          </Select>
        </Form.Item>
        <Form.Item name="assignee" label="负责人">
          <Input placeholder="请输入" style={{ width: 100 }} />
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
        title={editingItem ? '编辑任务' : '新增任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="hotelCode" label="酒店编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="hotelName" label="酒店名称">
            <Input />
          </Form.Item>
          <Form.Item name="roomNumber" label="房号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roomType" label="房型">
            <Input />
          </Form.Item>
          <Form.Item name="taskDate" label="任务日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="taskType" label="任务类型">
            <Select>
              <Option value="DAILY_CLEAN">日常清洁</Option>
              <Option value="REPAIR_CLEAN">维修清洁</Option>
              <Option value="TURN_DOWN">夜床服务</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select>
              <Option value="HIGH">高</Option>
              <Option value="NORMAL">中</Option>
              <Option value="LOW">低</Option>
            </Select>
          </Form.Item>
          <Form.Item name="assignee" label="负责人">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="任务详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
      >
        {selectedItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="任务号">{selectedItem.taskNo}</Descriptions.Item>
            <Descriptions.Item label="酒店">
              {selectedItem.hotelName} ({selectedItem.hotelCode})
            </Descriptions.Item>
            <Descriptions.Item label="房号">{selectedItem.roomNumber}</Descriptions.Item>
            <Descriptions.Item label="房型">{selectedItem.roomType}</Descriptions.Item>
            <Descriptions.Item label="任务日期">{selectedItem.taskDate}</Descriptions.Item>
            <Descriptions.Item label="任务类型">{selectedItem.taskType}</Descriptions.Item>
            <Descriptions.Item label="状态">{selectedItem.taskStatus}</Descriptions.Item>
            <Descriptions.Item label="优先级">{selectedItem.priority}</Descriptions.Item>
            <Descriptions.Item label="负责人">{selectedItem.assignee || '-'}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{selectedItem.startTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="结束时间">{selectedItem.endTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{selectedItem.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default CleaningTaskPage
