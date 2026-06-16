import { useState } from 'react'
import { Card, Form, Input, Select, Upload, Button, message, Row, Col, Space } from 'antd'
import { PlusOutlined, EnvironmentOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '@/api'
import { EventCategory } from '@/types'
import type { UploadFile } from 'antd'

const { TextArea } = Input

const categoryOptions = [
  { value: EventCategory.ENVIRONMENT, label: '环境卫生' },
  { value: EventCategory.SECURITY, label: '治安安全' },
  { value: EventCategory.FACILITY, label: '设施损坏' },
  { value: EventCategory.CIVIL, label: '民事纠纷' },
  { value: EventCategory.OTHER, label: '其他' }
]

const EventReport = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setFieldsValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
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
      const images = fileList.map(f => f.url || f.name).filter(Boolean)
      await createEvent({ ...values, images })
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
        initialValues={{ category: EventCategory.OTHER }}
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
              name="category"
              rules={[{ required: true, message: '请选择事件类型' }]}
            >
              <Select options={categoryOptions} placeholder="请选择事件类型" />
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
              name="latitude"
              rules={[{ required: true, message: '请输入纬度' }]}
            >
              <Input placeholder="如：39.9042" type="number" step="any" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="经度"
              name="longitude"
              rules={[{ required: true, message: '请输入经度' }]}
            >
              <Input placeholder="如：116.4074" type="number" step="any" />
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
          name="address"
          rules={[{ required: true, message: '请输入详细地址' }]}
        >
          <Input placeholder="请输入事件发生的详细地址" />
        </Form.Item>

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
