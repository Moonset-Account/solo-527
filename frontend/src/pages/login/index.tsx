import React, { useEffect } from 'react'
import { Form, Input, Button, Checkbox, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store'
import type { RoleCode } from '@/types'

const { Title } = Typography

interface LoginFormValues {
  username: string
  password: string
  remember: boolean
}

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const { login, isLoading, isLoggedIn, user } = useUserStore()

  useEffect(() => {
    if (isLoggedIn && user) {
      const redirectPath = getRedirectPath(user.roles)
      navigate(redirectPath, { replace: true })
    }
  }, [isLoggedIn, user, navigate])

  const getRedirectPath = (roles: RoleCode[]): string => {
    const adminRoles: RoleCode[] = ['ADMIN', 'FINANCE_MANAGER', 'APPROVER']
    const hasAdminRole = roles.some(role => adminRoles.includes(role))
    return hasAdminRole ? '/admin/dashboard' : '/portal/apply'
  }

  const onFinish = async (values: LoginFormValues) => {
    try {
      const response = await login({
        username: values.username,
        password: values.password
      })
      message.success('登录成功')
      const redirectPath = getRedirectPath(response.user.roles)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const onFinishFailed = () => {
    message.error('请检查输入的用户名和密码')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 16
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 12
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            费用报销系统
          </Title>
          <p style={{ color: '#666', marginTop: 8 }}>请登录您的账户</p>
        </div>
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              style={{ height: 44, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16, color: '#999', fontSize: 12 }}>
          <p>测试账号: applicant / applicant123 (申请人)</p>
          <p>测试账号: approver / approver123 (审批人)</p>
          <p>测试账号: admin / admin123 (管理员)</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
