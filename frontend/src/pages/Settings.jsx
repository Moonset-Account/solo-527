import { Card, Form, Input, Button, Switch, Select, message } from 'antd'

const Settings = () => {
  const [form] = Form.useForm()

  const onFinish = (values) => {
    console.log('设置信息:', values)
    message.success('设置保存成功')
  }

  return (
    <div>
      <h2>系统设置</h2>
      <Card title="基本设置" style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            siteName: '管理系统',
            email: 'admin@example.com',
            language: 'zh-CN',
            notification: true,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            label="站点名称"
            name="siteName"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="请输入站点名称" />
          </Form.Item>
          <Form.Item
            label="管理员邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入管理员邮箱" />
          </Form.Item>
          <Form.Item label="语言设置" name="language">
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="开启通知" name="notification" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Settings
