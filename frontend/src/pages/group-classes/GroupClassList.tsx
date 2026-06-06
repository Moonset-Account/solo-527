import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, InputNumber, Space, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
import { groupClassApi, coachApi } from '@/api'
import type { GroupClass, Coach } from '@/types'
import dayjs from 'dayjs'

const GroupClassList: React.FC = () => {
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<GroupClass | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [classData, coachData] = await Promise.all([
        groupClassApi.list(),
        coachApi.list()
      ])
      setGroupClasses(classData)
      setCoaches(coachData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingClass(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: GroupClass) => {
    setEditingClass(record)
    form.setFieldsValue({
      ...record,
      classDate: record.classDate ? dayjs(record.classDate) : null,
      startTime: record.startTime ? dayjs(record.startTime, 'HH:mm') : null,
      endTime: record.endTime ? dayjs(record.endTime, 'HH:mm') : null
    })
    setModalOpen(true)
  }

  const handleCancel = async (id: number) => {
    try {
      await groupClassApi.cancel(id)
      message.success('取消成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        classDate: values.classDate ? values.classDate.format('YYYY-MM-DD') : null,
        startTime: values.startTime ? values.startTime.format('HH:mm') : null,
        endTime: values.endTime ? values.endTime.format('HH:mm') : null
      }
      if (editingClass) {
        await groupClassApi.update(editingClass.id, data)
        message.success('更新成功')
      } else {
        await groupClassApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      SCHEDULED: 'blue',
      IN_PROGRESS: 'green',
      COMPLETED: 'default',
      CANCELLED: 'red'
    }
    const textMap: Record<string, string> = {
      SCHEDULED: '已排期',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '课程编号', dataIndex: 'classNo', key: 'classNo' },
    { title: '课程名称', dataIndex: 'name', key: 'name' },
    {
      title: '教练',
      dataIndex: 'coachId',
      key: 'coachId',
      render: (coachId: number) => {
        const coach = coaches.find((c) => c.id === coachId)
        return coach?.coachNo || coachId
      }
    },
    { title: '上课日期', dataIndex: 'classDate', key: 'classDate' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '容量', dataIndex: 'capacity', key: 'capacity' },
    {
      title: '报名人数',
      dataIndex: 'registeredCount',
      key: 'registeredCount',
      render: (count: number, record: GroupClass) => (
        <span>
          {count}/{record.capacity}
        </span>
      )
    },
    { title: '地点', dataIndex: 'location', key: 'location' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: GroupClass) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status !== 'CANCELLED' && record.status !== 'COMPLETED' && (
            <Button type="link" danger icon={<StopOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增团课
        </Button>
      </div>

      <Table columns={columns} dataSource={groupClasses} rowKey="id" loading={loading} />

      <Modal
        title={editingClass ? '编辑团课' : '新增团课'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Form.Item name="coachId" label="教练" rules={[{ required: true, message: '请选择教练' }]}>
            <Select placeholder="请选择教练">
              {coaches.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.coachNo}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="classDate" label="上课日期" rules={[{ required: true, message: '请选择上课日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="时间">
            <Space>
              <Form.Item name="startTime" noStyle rules={[{ required: true, message: '请选择开始时间' }]}>
                <TimePicker format="HH:mm" placeholder="开始时间" />
              </Form.Item>
              <Form.Item name="endTime" noStyle rules={[{ required: true, message: '请选择结束时间' }]}>
                <TimePicker format="HH:mm" placeholder="结束时间" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="capacity" label="容量" rules={[{ required: true, message: '请输入容量' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入容量" />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input placeholder="请输入地点" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="SCHEDULED">
            <Select>
              <Select.Option value="SCHEDULED">已排期</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GroupClassList
