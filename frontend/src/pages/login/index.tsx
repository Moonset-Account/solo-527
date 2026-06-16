import { useState } from 'react'
import { Form, Input, Button, Card, message, Select } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { setToken, setUserInfo } from '@/utils/auth'
import type { LoginParams, UserRole } from '@/types'

const roleOptions = [
  { value: 'worker', label: '网格员' },
  { value: 'admin', label: '后台管理员' },
  { value: 'manager', label: '管理层' }
]

const dashboardMap: Record<UserRole, string> = {
  worker: '/worker/dashboard',
  admin: '/admin/resident-list',
  manager: '/manager/dashboard'
}

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = (values: LoginParams & { role: UserRole }) => {
    setLoading(true)
    setTimeout(() => {
      setToken('mock-token-' + Date.now())
      setUserInfo({
        id: 1,
        username: values.username,
        nickname: values.username,
        avatar: '',
        roles: [values.role]
      })
      message.success('登录成功')
      setLoading(false)
      navigate(dashboardMap[values.role])
    }, 1000)
  }

  return (
    <Card
      title="网格管理系统登录"
      style={{
        width: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <Form
        form={form}
        name="login"
        initialValues={{ role: 'worker', username: 'worker', password: '123456' }}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="role"
          rules={[{ required: true, message: '请选择登录角色' }]}
        >
          <Select options={roleOptions} placeholder="请选择登录角色" />
        </Form.Item>

        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default Login
