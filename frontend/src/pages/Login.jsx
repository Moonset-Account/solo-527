import { Form, Input, Button, Card, Tabs, message, Select } from 'antd'
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { login, register, getBuildings } from '../api/user'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [buildings, setBuildings] = useState([])

  useEffect(() => {
    loadBuildings()
  }, [])

  const loadBuildings = async () => {
    try {
      const res = await getBuildings()
      setBuildings(res.data || [])
    } catch (e) {}
  }

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const res = await login(values)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      message.success('登录成功')
      if (res.data.user.role === 'admin' || res.data.user.role === 'staff') {
        navigate('/admin/dashboard')
      } else {
        navigate('/products')
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const res = await register(values)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      message.success('注册成功')
      navigate('/products')
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const loginItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block style={{ background: '#52c41a' }}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            管理员测试账号：13800138000 / admin123
          </div>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form onFinish={handleRegister} layout="vertical">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="building_id" rules={[{ required: true, message: '请选择楼栋' }]}>
            <Select placeholder="选择楼栋" size="large">
              {buildings.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="room_number">
            <Input placeholder="房号（选填）" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block style={{ background: '#52c41a' }}>
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <div style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card className="login-container" style={{ width: 400 }}>
        <div className="login-title">🥬 生鲜团购平台</div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={loginItems} centered />
      </Card>
    </div>
  )
}

export default Login
