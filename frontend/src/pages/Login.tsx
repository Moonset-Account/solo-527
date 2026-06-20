import React from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const Login: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore(state => state.token)
  const login = useAuthStore(state => state.login)

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success('登录成功')
      const from = (location.state as any)?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-title">运维工单台</div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
