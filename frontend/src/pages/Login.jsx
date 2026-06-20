import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { login as apiLogin } from '../api/auth'

const Login = () => {
  const navigate = useNavigate()
  const { setUser, setToken } = useUserStore()

  const onFinish = async (values) => {
    try {
      const res = await apiLogin(values)
      setToken(res.token)
      setUser({
        userId: res.userId,
        username: res.username,
        realName: res.realName,
        role: res.role,
        avatar: res.avatar,
      })
      message.success('登录成功')
      navigate('/')
    } catch (e) {
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
      }}
    >
      <Card
        title="装修线索客户画像库"
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        headStyle={{ textAlign: 'center', fontSize: 20 }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
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
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            默认账号: admin / 密码: 123456
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
