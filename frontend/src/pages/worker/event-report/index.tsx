import { useState } from 'react'
import { Card, Form, Input, Select, Upload, Button, message, Row, Col, Space, InputNumber } from 'antd'
import { PlusOutlined, EnvironmentOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '@/api'
import { EventType } from '@/types'

const { TextArea } = Input

const eventTypeOptions = [
  { value: EventType.ENVIRONMENTAL_HYGIENE, label: '环境卫生' },
  { value: EventType.SECURITY_ISSUE, label: '治安安全' },
  { value: EventType.FACILITY_DAMAGE, label: '设施损坏' },
  { value: EventType.DISPUTE_RESOLUTION, label: '民事纠纷' },
  { value: EventType.OTHER, label: '其他' }
]

const priorityOptions = [
  { value: 1, label: '低' },
  { value: 2, label: '中' },
  { value: 3, label: '高' },
  { value: 4, label: '紧急' }
]

const EventReport = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<any[]>([])

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setFieldsValue({
            locationLat: position.coords.latitude,
            locationLng: position.coords.longitude
          })
          message.success('定位成功')
        },
        () => {
          message.error('定位失败，请手动输入')
        }
      )
    } else {
      message.error('浏览器不支持定位功能')
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await createEvent(values)
      message.success('上报成功')
      navigate('/worker/event-list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="事件上报">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ eventType: EventType.OTHER, priority: 2 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="事件标题"
              name="title"
              rules={[{ required: true, message: '请输入事件标题' }]}
            >
              <Input placeholder="请输入事件标题" maxLength={100} showCount />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="事件类型"
              name="eventType"
              rules={[{ required: true, message: '请选择事件类型' }]}
            >
              <Select options={eventTypeOptions} placeholder="请选择事件类型" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="事件描述"
          name="description"
          rules={[{ required: true, message: '请输入事件描述' }]}
        >
          <TextArea rows={4} placeholder="请详细描述事件情况" maxLength={500} showCount />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="纬度"
              name="locationLat"
              rules={[{ required: true, message: '请输入纬度' }]}
            >
              <InputNumber placeholder="如：39.9042" style={{ width: '100%' }} step="any" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="经度"
              name="locationLng"
              rules={[{ required: true, message: '请输入经度' }]}
            >
              <InputNumber placeholder="如：116.4074" style={{ width: '100%' }} step="any" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Form.Item style={{ width: '100%' }}>
              <Button icon={<EnvironmentOutlined />} onClick={getLocation} block>
                获取当前位置
              </Button>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="详细地址"
          name="locationAddress"
          rules={[{ required: true, message: '请输入详细地址' }]}
        >
          <Input placeholder="请输入事件发生的详细地址" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="所属网格ID"
              name="gridId"
              rules={[{ required: true, message: '请输入网格ID' }]}
            >
              <InputNumber placeholder="网格ID" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select options={priorityOptions} placeholder="请选择优先级" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="来源单号" name="sourceBillNo">
              <Input placeholder="选填" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="现场照片">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: newList }) => setFileList(newList)}
            beforeUpload={() => false}
            multiple
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传照片</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              <UploadOutlined /> 提交上报
            </Button>
            <Button onClick={() => navigate(-1)}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default EventReport
