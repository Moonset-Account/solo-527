import React, { useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  DatePicker,
  message,
  Space,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { requirementApi } from '../api'

const { TextArea } = Input
const { Option } = Select

const RequirementCreate = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = {
        ...values,
        expectedDate: values.expectedDate?.format('YYYY-MM-DD'),
      }
      await requirementApi.create(data)
      message.success('创建成功')
      navigate('/requirements')
    } catch (error) {
      console.error('创建失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            />
            <span>新建需求</span>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ priority: 3 }}
        >
          <Form.Item
            label="需求标题"
            name="title"
            rules={[{ required: true, message: '请输入需求标题' }]}
          >
            <Input placeholder="请输入需求标题" maxLength={200} showCount />
          </Form.Item>

          <Form.Item label="需求分类" name="category">
            <Select placeholder="请选择分类" allowClear>
              <Option value="功能需求">功能需求</Option>
              <Option value="优化需求">优化需求</Option>
              <Option value="Bug修复">Bug修复</Option>
              <Option value="运营需求">运营需求</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item label="优先级" name="priority">
            <Select placeholder="请选择优先级">
              <Option value={1}>最高</Option>
              <Option value={2}>高</Option>
              <Option value={3}>中</Option>
              <Option value={4}>低</Option>
              <Option value={5}>最低</Option>
            </Select>
          </Form.Item>

          <Form.Item label="预期完成时间" name="expectedDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="需求描述" name="description">
            <TextArea
              rows={6}
              placeholder="请详细描述需求内容"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存为草稿
              </Button>
              <Button onClick={() => navigate(-1)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default RequirementCreate
