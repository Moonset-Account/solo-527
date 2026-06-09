import React, { useState } from 'react'
import { Form, Input, Button, Typography, App, Alert, Card } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { api } from '../api'
import { useAuthStore } from '../store'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuthStore()
  const { message } = App.useApp()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const from = location.state?.from?.pathname || '/dashboard'

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append('username', values.username)
      formData.append('password', values.password)
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || '登录失败')
      login(data.access_token, data.user)
      message.success('登录成功')
      navigate(from, { replace: true })
    } catch (e) {
      message.error(e.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u, p) => {
    onFinish({ username: u, password: p })
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-title">
          <div className="logo-icon">🏥</div>
          <Title level={3} style={{ marginBottom: 8 }}>
            门诊爽约风险提醒AI平台
          </Title>
          <Text type="secondary">基于LightGBM的智能风险预测工作台</Text>
        </div>

        <Alert
          style={{ marginBottom: 20 }}
          type="info"
          showIcon
          message="演示账号"
          description={
            <div>
              <div>admin / admin123 （管理员，全部权限）</div>
              <div>operator / operator123 （运营人员）</div>
              <div>datascientist / ds123456 （数据科学家）</div>
            </div>
          }
        />

        <Form
          name="login"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
              style={{ height: 44 }}
            >
              登录系统
            </Button>
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => quickLogin('admin', 'admin123')}>
            管理员登录
          </Button>
          <Button size="small" onClick={() => quickLogin('operator', 'operator123')}>
            运营登录
          </Button>
          <Button size="small" onClick={() => quickLogin('datascientist', 'ds123456')}>
            科学家登录
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
