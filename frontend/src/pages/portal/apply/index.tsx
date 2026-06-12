import React, { useState } from 'react'
import { Form, Input, InputNumber, Select, Button, Card, Typography, message, Upload, Space } from 'antd'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { application, attachment } from '@/api'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import type { CreateApplicationRequest } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface FormValues extends CreateApplicationRequest {
  expenseType: string
}

const expenseTypes = [
  { value: 'TRAVEL', label: '差旅费' },
  { value: 'ENTERTAINMENT', label: '招待费' },
  { value: 'OFFICE', label: '办公用品' },
  { value: 'TRANSPORT', label: '交通费' },
  { value: 'MEAL', label: '餐费' },
  { value: 'OTHER', label: '其他' }
]

const Apply: React.FC = () => {
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [applicationId, setApplicationId] = useState<number | null>(null)

  const uploadProps: UploadProps = {
    fileList,
    multiple: true,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList)
    },
    onRemove: async (file) => {
      if (file.response?.id) {
        try {
          await attachment.delete(file.response.id)
          message.success('附件删除成功')
        } catch (error) {
          console.error('Delete attachment failed:', error)
        }
      }
      return true
    }
  }

  const handleUpload = async (appId: number) => {
    const filesToUpload = fileList.filter(file => !file.response?.id)
    for (const file of filesToUpload) {
      if (file.originFileObj) {
        try {
          const uploaded = await attachment.upload(appId, file.originFileObj)
          file.response = uploaded
          file.status = 'done'
        } catch (error) {
          file.status = 'error'
          console.error('Upload failed:', error)
        }
      }
    }
    setFileList([...fileList])
  }

  const onFinish = async (values: FormValues) => {
    setLoading(true)
    try {
      const app = await application.create(values)
      setApplicationId(app.id)
      message.success('申请保存成功')
      if (fileList.length > 0) {
        await handleUpload(app.id)
      }
    } catch (error) {
      console.error('Create application failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!applicationId) {
      message.error('请先保存申请')
      return
    }
    setLoading(true)
    try {
      await application.submit({ id: applicationId })
      message.success('申请提交成功')
      navigate('/portal/my-applications')
    } catch (error) {
      console.error('Submit application failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          提交报销申请
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ amount: 0 }}
        >
          <Form.Item
            name="title"
            label="申请标题"
            rules={[{ required: true, message: '请输入申请标题' }]}
          >
            <Input placeholder="请输入申请标题" maxLength={100} showCount />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="expenseType"
              label="费用类型"
              rules={[{ required: true, message: '请选择费用类型' }]}
            >
              <Select placeholder="请选择费用类型">
                {expenseTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="amount"
              label="申请金额 (元)"
              rules={[
                { required: true, message: '请输入申请金额' },
                { type: 'number', min: 0.01, message: '金额必须大于0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入申请金额"
                min={0}
                step={0.01}
                precision={2}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => (value ? Number(value.replace(/\¥\s?|(,*)/g, '')) : 0) as 0}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label="费用说明"
            rules={[{ required: true, message: '请输入费用说明' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明费用用途"
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item label="附件上传">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              支持上传多个附件，如发票、收据等
            </div>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={!applicationId}
                icon={<PlusOutlined />}
              >
                提交审批
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Apply
