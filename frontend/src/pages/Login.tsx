import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useUserStore } from '../store/useUserStore'

const { Title } = Typography

export default function Login() {
  const navigate = useNavigate()
  const { setToken, setUserInfo } = useUserStore()
  const [loading, setLoading] = false

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true)
      const res: any = await authApi.login(values)
      setToken(res.token)
      setUserInfo({
        userId: res.userId,
        username: res.username,
        realName: res.realName,
        role: res.role,
        avatar: res.avatar,
      })
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            健身房私教课管理系统
          </Title>
          <p style={{ color: '#999' }}>Gym Management System</p>
        </div>
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
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
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          <p>默认账号：admin / admin123</p>
        </div>
      </Card>
    </div>
  )
}
