import React from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setLogin } from '@/store'
import { authApi } from '@/services/api'

const { Title, Paragraph } = Typography

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const data = await authApi.login(values)
      dispatch(
        setLogin({
          token: data.token,
          user: {
            id: data.userId,
            username: data.username,
            realName: data.realName,
            email: data.email,
          },
          permissions: data.permissions,
          roles: data.roles,
        })
      )
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error) {
      console.error('登录失败', error)
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
      <Card
        style={{
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            用户增长数据门户
          </Title>
          <Paragraph type="secondary">
            Data Growth Portal - 权限管理与数据分析平台
          </Paragraph>
        </div>

        <Form
          name="login"
          initialValues={{ username: 'leader', password: '123456' }}
          onFinish={handleLogin}
          size="large"
        >
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

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', height: 44 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Paragraph style={{ marginBottom: 8, fontWeight: 'bold' }}>测试账号：</Paragraph>
          <Paragraph style={{ marginBottom: 4, fontSize: 13 }}>
            admin / 123456 - 系统管理员
          </Paragraph>
          <Paragraph style={{ marginBottom: 4, fontSize: 13 }}>
            leader / 123456 - 运营负责人
          </Paragraph>
          <Paragraph style={{ marginBottom: 4, fontSize: 13 }}>
            analyst / 123456 - 业务分析师
          </Paragraph>
          <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
            staff / 123456 - 运营人员
          </Paragraph>
        </div>
      </Card>
    </div>
  )
}
