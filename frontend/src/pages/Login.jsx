import React, { useState } from 'react'
import { Form, Input, Button, Card, message, App as AntdApp } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authApi } from '@/api/endpoints'

function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const { message: antdMessage } = AntdApp.useApp()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      const userRes = await authApi.getCurrentUser()
      setAuth(res.data.access, res.data.refresh, userRes.data)
      antdMessage.success('登录成功')
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (e) {
      antdMessage.error('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8, color: '#1677ff' }}>办公耗材框架协议管理系统</h1>
          <p style={{ color: '#999', margin: 0 }}>请登录您的账户</p>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱!' }, { type: 'email', message: '请输入正确的邮箱格式!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <p>默认测试账户：admin@example.com / admin123</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
