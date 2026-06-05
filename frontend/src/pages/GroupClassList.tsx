import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Tag,
  Typography,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { groupClassApi, coachApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

export default function GroupClassList() {
  const [classes, setClasses] = useState<any[]>([])
  const [coaches, setCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadCoaches()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data: any = await groupClassApi.list()
      setClasses(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadCoaches = async () => {
    try {
      const data: any = await coachApi.listActive()
      setCoaches(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        name: values.name,
        coach: { id: values.coachId },
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        maxCapacity: values.maxCapacity,
        location: values.location,
        description: values.description,
      }
      await groupClassApi.create(submitData)
      message.success('团课创建成功')
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await groupClassApi.cancel(id, '管理员取消')
      message.success('团课已取消')
      loadData()
    } catch (error) {
      console.error(error)
    }
  }

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '教练',
      dataIndex: ['coach', 'name'],
      key: 'coach',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: '预约人数',
      key: 'capacity',
      render: (_: any, record: any) => (
        <span>
          {record.bookedCount} / {record.maxCapacity}
        </span>
      ),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'cancelled',
      key: 'status',
      render: (cancelled: boolean) =>
        cancelled ? (
          <Tag color="default">已取消</Tag>
        ) : (
          <Tag color="green">正常</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) =>
        !record.cancelled ? (
          <Popconfirm
            title="确定取消该团课吗？"
            onConfirm={() => handleCancel(record.id)}
          >
            <Button type="link" size="small" danger icon={<CloseOutlined />}>
              取消课程
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          团课管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增团课
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={classes}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title="新增团课"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input placeholder="例如：动感单车" />
          </Form.Item>
          <Form.Item
            name="coachId"
            label="授课教练"
            rules={[{ required: true, message: '请选择教练' }]}
          >
            <Select placeholder="请选择教练">
              {coaches.map((coach) => (
                <Option key={coach.id} value={coach.id}>
                  {coach.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startTime"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxCapacity"
            label="最大人数"
            rules={[{ required: true, message: '请输入最大人数' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="上课地点">
            <Input placeholder="例如：操房1" />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <TextArea rows={3} placeholder="课程介绍" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
