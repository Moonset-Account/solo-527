import React, { useState } from 'react'
import { Form, Input, Button, Card, Radio, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api.js'

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('INTERNAL')

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const data = await authAPI.login(values)
      message.success('登录成功')
      onLogin(data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (username) => {
    setLoading(true)
    try {
      const data = await authAPI.login({ username, password: '123456' })
      message.success('登录成功')
      onLogin(data)
    } catch (e) {
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
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>🎵 音乐演出活动复盘看板</h1>
          <p style={{ color: '#999' }}>票务管理 · 核销签到 · 数据复盘</p>
        </div>
        <Form onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <p style={{ color: '#999', marginBottom: 8, fontSize: 12 }}>快速登录（密码均为 123456）：</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="small" onClick={() => quickLogin('admin')}>管理员</Button>
            <Button size="small" onClick={() => quickLogin('internal')}>内部运营</Button>
            <Button size="small" onClick={() => quickLogin('organizer')}>主办方</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Login
