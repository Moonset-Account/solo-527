import { useState } from 'react'
import { Card, Form, Input, Select, Upload, Button, Row, Col, DatePicker, message, Space } from 'antd'
import { PlusOutlined, LeftOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '@/utils/request'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

const { TextArea } = Input

export default function RepairSubmit() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])

  const handlePhotoChange = (e: any) => {
    const files = Array.from(e.target.files) as File[]
    files.forEach((file) => {
      setPhotos((prev) => [...prev, { file, url: URL.createObjectURL(file) }])
    })
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.keys(values).forEach((key) => {
        if (key === 'expected_date') {
          formData.append(key, values[key].format('YYYY-MM-DD'))
        } else if (values[key]) {
          formData.append(key, values[key])
        }
      })
      photos.forEach((p, i) => {
        formData.append(`photos`, p.file)
      })

      await axios.post('/api/repairs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      message.success('报修提交成功')
      navigate('/repairs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} />
            <span>提交报修申请</span>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 'medium',
            repair_type: 'plumbing',
            dorm_building: user?.dorm_building,
            dorm_room: user?.dorm_room,
            contact_name: user?.real_name || user?.username,
            contact_phone: user?.phone,
          }}
          onFinish={onSubmit}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="报修标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="简要描述问题" maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="报修类型" name="repair_type" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'plumbing', label: '水电维修' },
                    { value: 'furniture', label: '家具维修' },
                    { value: 'electrical', label: '电器维修' },
                    { value: 'door_window', label: '门窗维修' },
                    { value: 'network', label: '网络维修' },
                    { value: 'other', label: '其他' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="优先级" name="priority" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' },
                    { value: 'urgent', label: '紧急' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="宿舍楼" name="dorm_building" rules={[{ required: true, message: '请输入宿舍楼' }]}>
                <Input placeholder="如：1号楼" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="宿舍号" name="dorm_room" rules={[{ required: true, message: '请输入宿舍号' }]}>
                <Input placeholder="如：301" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="联系人" name="contact_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" name="contact_phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请详细描述问题' }]}>
            <TextArea rows={5} placeholder="请详细描述问题情况..." />
          </Form.Item>
          <Form.Item label="预计完成日期" name="expected_date">
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Form.Item label="现场照片（可选）">
            <div>
              <label className="upload-area" style={{ display: 'inline-block', width: 100, height: 100, lineHeight: '100px' }}>
                <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                <input type="file" accept="image/*" multiple hidden onChange={handlePhotoChange} />
              </label>
              {photos.map((p, i) => (
                <span key={i} className="photo-item">
                  <img src={p.url} alt="" />
                  <Button
                    type="primary"
                    danger
                    size="small"
                    shape="circle"
                    icon={<CloseOutlined />}
                    className="delete-btn"
                    onClick={() => removePhoto(i)}
                  />
                </span>
              ))}
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
